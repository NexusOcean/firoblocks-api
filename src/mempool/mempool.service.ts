import { Injectable } from '@nestjs/common';
import { RpcService } from '../rpc/rpc.service';
import { FiroMempoolInfo, FiroRawMempool, MempoolDto } from './mempool.types';

const CACHE_TTL_MS = 10_000;

@Injectable()
export class MempoolService {
  private cache: { value: MempoolDto; expiresAt: number } | null = null;

  constructor(private readonly rpc: RpcService) {}

  async getMempool(): Promise<MempoolDto> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.value;
    }

    const [info, txids] = await Promise.all([
      this.rpc.call<FiroMempoolInfo>('getmempoolinfo'),
      this.rpc.call<FiroRawMempool>('getrawmempool'),
    ]);

    const dto: MempoolDto = {
      pendingCount: info.size,
      bytes: info.bytes,
      usage: info.usage,
      maxMempool: info.maxmempool,
      minFee: info.mempoolminfee,
      instantSendLocks: info.instantsendlocks,
      txids,
    };

    this.cache = { value: dto, expiresAt: Date.now() + CACHE_TTL_MS };
    return dto;
  }
}
