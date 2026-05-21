import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RpcModule } from '../rpc/rpc.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { CachedBlock, CachedBlockSchema } from './blocks.schema';
import { CachedTransaction, CachedTransactionSchema } from '../transactions/transactions.schema';

@Module({
  imports: [
    RpcModule,
    MongooseModule.forFeature([
      { name: CachedBlock.name, schema: CachedBlockSchema },
      { name: CachedTransaction.name, schema: CachedTransactionSchema },
    ]),
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
