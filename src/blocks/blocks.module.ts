import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RpcModule } from '../rpc/rpc.module';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { CachedBlock, CachedBlockSchema } from './blocks.model';

@Module({
  imports: [
    RpcModule,
    MongooseModule.forFeature([{ name: CachedBlock.name, schema: CachedBlockSchema }]),
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
