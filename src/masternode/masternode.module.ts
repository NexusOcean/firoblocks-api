import { Module } from '@nestjs/common';
import { MasternodeController } from './masternode.controller';
import { MasternodeService } from './masternode.service';
import { RpcModule } from '../rpc/rpc.module';
import { GeoModule } from '../geo/geo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MasternodeCache, MasternodeCacheSchema } from './masternode.schema';

@Module({
  imports: [
    RpcModule,
    GeoModule,
    MongooseModule.forFeature([{ name: MasternodeCache.name, schema: MasternodeCacheSchema }]),
  ],
  controllers: [MasternodeController],
  providers: [MasternodeService],
})
export class MasternodeModule {}
