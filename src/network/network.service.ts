import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NetworkStats, NetworkStatsDocument } from './network.schema';
import { NetworkStatsDto } from './network.types';

@Injectable()
export class NetworkService {
  constructor(
    @InjectModel(NetworkStats.name)
    private readonly statsModel: Model<NetworkStatsDocument>,
  ) {}

  async getStats(): Promise<NetworkStatsDto> {
    const [utxo, chain] = await Promise.all([
      this.statsModel.findOne({ chain: 'main', type: 'utxo' }).lean(),
      this.statsModel.findOne({ chain: 'main', type: 'chain' }).lean(),
    ]);

    if (!utxo || !chain) {
      throw new ServiceUnavailableException(
        'Network stats not yet available — scheduler may still be initializing',
      );
    }
    return {
      height: chain.height!,
      transactions: utxo.transactions!,
      totalSupply: utxo.totalSupply!,
      difficulty: chain.difficulty!,
      hashrate: chain.hashrate!,
      bestBlockHash: chain.bestBlockHash!,
      updatedAt: chain.updatedAt,
    };
  }
}
