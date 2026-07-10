import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RpcService } from '../rpc/rpc.service';
import {
  FiroMempoolInfo,
  FiroRawMempool,
  FiroRawMempoolVerbose,
  MempoolDto,
  MempoolEntryDto,
} from './mempool.types';
import { BatchResult } from '@nexusocean/firo-rpc';

const CACHE_TTL_MS = 10_000;

@Injectable()
export class MempoolService {
  private cache: { value: MempoolDto; expiresAt: number } | null = null;

  constructor(private readonly rpc: RpcService) {}

  async getMempool(): Promise<MempoolDto> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.value;
    }

    const [info, txids] = (await this.rpc.batch([
      { method: 'getmempoolinfo' },
      { method: 'getrawmempool', params: [true] },
    ])) as BatchResult<FiroMempoolInfo | FiroRawMempool>[];

    if (info.error)
      throw new InternalServerErrorException(`getmempoolinfo failed: ${info.error.message}`);
    if (txids.error)
      throw new InternalServerErrorException(`getrawmempool failed: ${txids.error.message}`);

    const { size, bytes, usage, maxmempool, mempoolminfee, instantsendlocks } =
      info.result as FiroMempoolInfo;

    const verbose = txids.result as unknown as FiroRawMempoolVerbose;

    const transactions: MempoolEntryDto[] = Object.entries(verbose).map(([txid, entry]) => ({
      txid,
      fee: entry.fee,
      size: entry.size,
      feeRate: (entry.fee / entry.size) * 1000,
      time: entry.time,
    }));

    const dto: MempoolDto = {
      pendingCount: size,
      bytes,
      usage,
      maxMempool: maxmempool,
      minFee: mempoolminfee,
      instantSendLocks: instantsendlocks,
      transactions,
    };
    this.cache = { value: dto, expiresAt: Date.now() + CACHE_TTL_MS };
    return dto;
  }
}
