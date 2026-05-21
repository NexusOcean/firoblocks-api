import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcService } from '../rpc/rpc.service';
import { CachedBlock, BlockDocument } from './blocks.schema';
import { CachedTransaction, TransactionDocument } from '../transactions/transactions.schema';
import { FiroBlock, BlockDto, BlockListDto, BlockSummaryDto } from './blocks.types';

const DEFAULT_LIMIT = 25;
const CONCURRENCY = 3;
const TIP_TTL_MS = 15_000;

@Injectable()
export class BlocksService {
  private tipCache: { value: number; expiresAt: number } | null = null;
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly rpc: RpcService,
    @InjectModel(CachedBlock.name)
    private readonly blockModel: Model<BlockDocument>,
    @InjectModel(CachedTransaction.name)
    private readonly txModel: Model<TransactionDocument>,
  ) {}

  async getBlockByHeight(height: number): Promise<BlockDto> {
    const tip = await this.getChainTip();
    const cached = await this.blockModel.findOne({ height }).lean();
    if (cached) {
      const dto = cached.data as unknown as BlockDto;
      const txTypes = await this.getTxTypes(dto.txids);
      this.logger.debug('Returning cached block at height', dto.height);
      return { ...dto, confirmations: tip - dto.height + 1, txTypes };
    }

    const hash = await this.rpc.call<string>('getblockhash', height);
    const raw = await this.rpc.call<FiroBlock>('getblock', hash, true);
    const dto = this.toBlockDto(raw, tip);
    await this.cache(dto);
    const txTypes = await this.getTxTypes(dto.txids);

    this.logger.debug('Returning block lookup at height', dto.height);

    return { ...dto, txTypes };
  }

  async getBlockList(before?: number, limit = DEFAULT_LIMIT): Promise<BlockListDto> {
    const tip = await this.getChainTip();
    const cursor = before ?? tip;

    if (cursor > tip || cursor < 0) {
      throw new NotFoundException(`Block height ${cursor} not found`);
    }

    const heights = Array.from({ length: Math.min(limit, cursor + 1) }, (_, i) => cursor - i);

    const cachedDocs = await this.blockModel.find({ height: { $in: heights } }).lean();

    const cachedByHeight = new Map(
      cachedDocs.map((doc) => [doc.height, doc.data as unknown as BlockDto]),
    );

    const blocks = await this.inBatches(heights, CONCURRENCY, async (h) => {
      const cached = cachedByHeight.get(h);
      if (cached) return this.toBlockSummaryDto(cached);

      const hash = await this.rpc.call<string>('getblockhash', h);
      const raw = await this.rpc.call<FiroBlock>('getblock', hash, true);

      const dto = this.toBlockDto(raw, tip);
      await this.cache(dto);
      return this.toBlockSummaryDto(dto);
    });

    this.logger.debug('Returning recent blocks from tip', tip);

    const last = heights[heights.length - 1];
    return { blocks, tip, nextCursor: last > 0 ? last - 1 : null };
  }

  public async getChainTip(): Promise<number> {
    if (this.tipCache && Date.now() < this.tipCache.expiresAt) {
      return this.tipCache.value;
    }
    const info = await this.rpc.call<{ blocks: number }>('getblockchaininfo');
    this.tipCache = { value: info.blocks, expiresAt: Date.now() + TIP_TTL_MS };
    return info.blocks;
  }

  private async getTxTypes(txids: string[]): Promise<Record<string, string>> {
    const docs = await this.txModel
      .find({ txid: { $in: txids } }, { txid: 1, 'data.category': 1 })
      .lean();
    const map: Record<string, string> = {};
    for (const txid of txids) map[txid] = 'unknown';
    for (const doc of docs) map[doc.txid] = (doc.data as any).category ?? 'unknown';
    return map;
  }

  private toBlockDto(raw: FiroBlock, tip: number): BlockDto {
    return {
      hash: raw.hash,
      height: raw.height,
      confirmations: tip - raw.height + 1,
      time: raw.time,
      medianTime: raw.mediantime,
      size: raw.size,
      weight: raw.weight,
      difficulty: raw.difficulty,
      chainlock: raw.chainlock,
      nTx: raw.tx.length,
      previousBlockHeight: raw.height - 1,
      nextBlockHeight: raw.height < tip ? raw.height + 1 : undefined,
      txids: raw.tx,
    };
  }

  private toBlockSummaryDto(block: BlockDto): BlockSummaryDto {
    return {
      hash: block.hash,
      height: block.height,
      time: block.time,
      nTx: block.nTx,
      size: block.size,
      difficulty: block.difficulty,
      chainlock: block.chainlock,
    };
  }

  private async cache(block: BlockDto): Promise<void> {
    const { confirmations: _, ...dataToStore } = block;

    await this.blockModel.updateOne(
      { hash: block.hash },
      {
        $set: {
          hash: block.hash,
          height: block.height,
          data: dataToStore,
        },
      },
      { upsert: true },
    );
  }

  private async inBatches<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);
    }
    return results;
  }
}
