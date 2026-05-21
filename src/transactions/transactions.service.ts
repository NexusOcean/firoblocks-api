import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcService } from '../rpc/rpc.service';
import {
  CachedTransaction,
  TransactionDocument,
  RecentTransactionsCache,
  RecentTransactionsCacheDocument,
} from './transactions.schema';
import { FiroTransaction, TransactionDto } from './transactions.types';
import { classifyTransaction } from './transaction-classifier';
import { BatchResult } from '@nexusocean/firo-rpc';

const TIP_TTL_MS = 15_000;
const CONFIRMED_TTL_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private tipCache: { value: number; expiresAt: number } | null = null;

  constructor(
    private readonly rpc: RpcService,
    @InjectModel(CachedTransaction.name)
    private readonly txModel: Model<TransactionDocument>,
    @InjectModel(RecentTransactionsCache.name)
    private readonly recentTxModel: Model<RecentTransactionsCacheDocument>,
  ) {}

  async getTransaction(txid: string): Promise<TransactionDto> {
    const cached = await this.txModel.findOne({ txid }).lean();
    if (cached) {
      const dto = cached.data as unknown as TransactionDto;
      const tip = await this.getChainTip();
      return { ...dto, confirmations: tip - dto.blockHeight + 1 };
    }

    const raw = await this.rpc.call<FiroTransaction>('getrawtransaction', txid, true);
    if (!raw) throw new NotFoundException(`Transaction ${txid} not found`);

    const dto = this.toTransactionDto(raw);
    await this.cache(dto, raw.chainlock);

    this.logger.debug('Returning transaction data for', dto.txid);
    return dto;
  }

  async getTransactionsByBlock(txids: string[]): Promise<TransactionDto[]> {
    const uniqueIds = [...new Set(txids)];

    const cached = await this.txModel.find({ txid: { $in: uniqueIds } }).lean();
    const dtoMap = new Map(cached.map((doc) => [doc.txid, doc.data as unknown as TransactionDto]));

    const tip = await this.getChainTip();
    const uncachedIds = uniqueIds.filter((id) => !dtoMap.has(id));

    if (uncachedIds.length > 0) {
      const batchResults = await this.rpc.batch(
        uncachedIds.map((txid) => ({ method: 'getrawtransaction', params: [txid, true] })),
      );

      for (let i = 0; i < uncachedIds.length; i++) {
        const { result, error } = batchResults[i];
        if (error) {
          this.logger.warn(`Failed to fetch tx ${uncachedIds[i]}: ${error.message}`);
          continue;
        }
        const raw = result as FiroTransaction;
        const dto = this.toTransactionDto(raw);
        await this.cache(dto, raw.chainlock);
        dtoMap.set(uncachedIds[i], dto);
      }
    }

    const results: TransactionDto[] = [];
    for (const txid of uniqueIds) {
      const dto = dtoMap.get(txid);
      if (dto) results.push({ ...dto, confirmations: tip - dto.blockHeight + 1 });
    }

    return results;
  }

  private async getBlocks(hashes: BatchResult[]) {
    const blockResults = await this.rpc.batch(
      hashes.map((hash) => ({ method: 'getblock', params: [hash, true] })),
    );

    const ids: string[] = [];

    for (const r of blockResults) {
      const block = r.result as { tx: string[] };
      ids.push(...block.tx);
    }

    return ids;
  }

  async getRecentTransactions(limit = 15): Promise<TransactionDto[]> {
    const height = await this.getChainTip();
    const txids: string[] = [];
    const BLOCK_BATCH = 5;

    const heights = Array.from({ length: limit + 10 }, (_, i) => height - i).filter((h) => h > 0);
    const hashResults = await this.rpc.batch(
      heights.map((h) => ({ method: 'getblockhash', params: [h] })),
    );

    for (let i = 0; i < hashResults.length && txids.length < limit; i += BLOCK_BATCH) {
      const sub = hashResults.slice(i, i + BLOCK_BATCH);
      const ids = await this.getBlocks(sub);
      txids.push(...ids);
    }

    this.logger.debug('Returning recent transactions by block');

    return this.getTransactionsByBlock(txids.slice(0, limit));
  }

  async getCachedRecentTransactions(): Promise<TransactionDto[] | null> {
    const cached = await this.recentTxModel.findOne({ key: 'recent' }).lean();
    if (!cached) return null;
    if (new Date() > cached.expiresAt) return null;

    this.logger.debug('Returning recent cached transactions');

    return cached.data as unknown as TransactionDto[];
  }

  private toTransactionDto(raw: FiroTransaction): TransactionDto {
    const { type, category, flags, vin, vout, fee } = classifyTransaction(raw);

    return {
      txid: raw.txid,
      type,
      category,
      flags,
      size: raw.size,
      fee,
      confirmations: raw.confirmations,
      time: raw.time,
      blockHash: raw.blockhash,
      blockHeight: raw.height,
      chainlock: raw.chainlock,
      instantlock: raw.instantlock,
      vin,
      vout,
    };
  }

  private async getChainTip(): Promise<number> {
    if (this.tipCache && Date.now() < this.tipCache.expiresAt) {
      return this.tipCache.value;
    }
    const info = await this.rpc.call<{ blocks: number }>('getblockchaininfo');
    this.tipCache = { value: info.blocks, expiresAt: Date.now() + TIP_TTL_MS };
    return info.blocks;
  }

  private async cache(tx: TransactionDto, chainlock: boolean): Promise<void> {
    const ttlMs = chainlock ? CONFIRMED_TTL_MS : TIP_TTL_MS;
    const expiresAt = new Date(Date.now() + ttlMs);

    const { confirmations: _, ...dataToStore } = tx;

    await this.txModel.updateOne(
      { txid: tx.txid },
      { $set: { txid: tx.txid, data: dataToStore, expiresAt } },
      { upsert: true },
    );
  }
}
