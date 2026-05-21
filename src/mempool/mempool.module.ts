import { Module } from '@nestjs/common';
import { MempoolController } from './mempool.controller';
import { MempoolService } from './mempool.service';
import { RpcModule } from '../rpc/rpc.module';

@Module({
  imports: [RpcModule],
  controllers: [MempoolController],
  providers: [MempoolService],
})
export class MempoolModule {}
