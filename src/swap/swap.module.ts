import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { SwapClient } from './swap.client';
import { SwapMapping, SwapMappingSchema } from './swap.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: SwapMapping.name, schema: SwapMappingSchema }]),
  ],
  controllers: [SwapController],
  providers: [SwapService, SwapClient],
})
export class SwapModule {}
