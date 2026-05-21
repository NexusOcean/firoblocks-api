// api/src/geo/geo.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Geo, GeoDocument } from './geo.schema';

@Injectable()
export class GeoService {
  constructor(@InjectModel(Geo.name) private readonly geoModel: Model<GeoDocument>) {}

  async lookupMany(ips: string[]): Promise<Map<string, Geo>> {
    const hosts = ips.map((ip) => ip.split(':')[0]);
    const docs = await this.geoModel.find({ ip: { $in: hosts } }).lean();
    return new Map(docs.map((d) => [d.ip, d]));
  }
}
