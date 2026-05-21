import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasternodeCache, MasternodeCacheDocument, MasternodeStats } from './masternode.schema';
import { MASTERNODE_CACHE_KEY } from '../constants';

const EMPTY_STATS: MasternodeStats = {
  total: 0,
  resolved: 0,
  countries: [],
  asns: [],
};

@Injectable()
export class MasternodeService {
  constructor(
    @InjectModel(MasternodeCache.name)
    private readonly cacheModel: Model<MasternodeCacheDocument>,
  ) {}

  async stats(): Promise<MasternodeStats> {
    const doc = await this.cacheModel.findOne({ key: MASTERNODE_CACHE_KEY }).select('stats').lean();
    if (!doc?.stats) return EMPTY_STATS;

    const stats = doc.stats;

    return {
      ...stats,
      countries: stats.countries.filter((c) => c.countryCode !== 'XX'),
      asns: stats.asns.filter((a) => a.asn !== 0),
    };
  }
}
