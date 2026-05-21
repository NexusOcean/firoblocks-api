import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NetworkStats, NetworkStatsSchema } from './network.schema';
import { RpcModule } from '../rpc/rpc.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: NetworkStats.name, schema: NetworkStatsSchema }]),
    RpcModule,
  ],
  providers: [NetworkService],
  controllers: [NetworkController],
})
export class NetworkModule {}
