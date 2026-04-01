import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcService } from '../rpc/rpc.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CachedAddress, AddressDocument } from './addresses.schema';
import {
  FiroAddressBalance,
  FiroAddressTxIds,
  AddressDto,
  AddressTxSummaryDto,
} from './addresses.types';
import { TransactionDto } from '../transactions/transactions.types';

const SATOSHIS = 1e8;
const PAGE_SIZE = 10;
const CONCURRENCY = 3;
const ADDRESS_TTL_MS = 15 * 60 * 1000;
const MAX_TX_IDS = 1000;

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    private readonly rpc: RpcService,
    private readonly txService: TransactionsService,
    @InjectModel(CachedAddress.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  async getAddress(address: string, page = 1): Promise<AddressDto> {
    let cached = await this.addressModel.findOne({ address }).lean();

    if (!cached) {
      const [balanceRaw, allTxIds] = await Promise.all([
        this.rpc.call<FiroAddressBalance>('getaddressbalance', [{ addresses: [address] }]),
        this.rpc.call<FiroAddressTxIds>('getaddresstxids', [{ addresses: [address] }]),
      ]);

      if (!allTxIds) throw new NotFoundException(`Address ${address} not found`);

      const reversed = [...allTxIds].reverse().slice(0, MAX_TX_IDS);

      await this.cache(address, {
        balance: balanceRaw.balance / SATOSHIS,
        received: balanceRaw.received / SATOSHIS,
        allTxIds: reversed,
      });

      cached = await this.addressModel.findOne({ address }).lean();
    }

    const stored = cached!.data as unknown as {
      balance: number;
      received: number;
      allTxIds: string[];
    };

    const { balance, received, allTxIds } = stored;
    const totalTxCount = allTxIds.length;
    const totalPages = Math.max(1, Math.ceil(totalTxCount / PAGE_SIZE));
    const clampedPage = Math.min(Math.max(1, page), totalPages);
    const start = (clampedPage - 1) * PAGE_SIZE;
    const pageTxids = allTxIds.slice(start, start + PAGE_SIZE);
    const pageTxs = await this.hydrateIds(pageTxids);

    return {
      address,
      balance,
      received,
      totalTxCount,
      transactions: pageTxs.map((tx) => this.toSummaryDto(tx, address)),
      page: clampedPage,
      totalPages,
    };
  }

  private async hydrateIds(txids: string[]): Promise<TransactionDto[]> {
    const results: TransactionDto[] = [];

    for (let i = 0; i < txids.length; i += CONCURRENCY) {
      const batch = txids.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(
        batch.map((id) => this.txService.getTransaction(id)),
      );
      for (const result of settled) {
        if (result.status === 'fulfilled') results.push(result.value);
        else this.logger.warn(`Failed to hydrate tx: ${result.reason}`);
      }
    }

    return results;
  }

  private toSummaryDto(tx: TransactionDto, address: string): AddressTxSummaryDto {
    const totalOut = tx.vout
      .filter((v) => v.addresses.includes(address))
      .reduce((s, v) => s + v.value, 0);

    const totalIn = tx.vin
      .filter((v) => v.address === address)
      .reduce((s, v) => s + (v.value ?? 0), 0);

    const valueDelta =
      tx.type === 'transparent' || tx.type === 'coinbase'
        ? parseFloat((totalOut - totalIn).toFixed(8))
        : undefined;

    return {
      txid: tx.txid,
      type: tx.type,
      time: tx.time,
      blockHeight: tx.blockHeight,
      confirmations: tx.confirmations,
      valueDelta,
    };
  }

  private async cache(address: string, data: object): Promise<void> {
    const expiresAt = new Date(Date.now() + ADDRESS_TTL_MS);
    await this.addressModel.updateOne(
      { address },
      { $set: { address, data, expiresAt } },
      { upsert: true },
    );
  }
}
