import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generateSwapId } from '../utils/swap-id';
import { SwapClient } from './swap.client';
import { SwapMapping, SwapMappingDocument } from './swap.schema';
import { EstimateRequest, EstimateResponse, CreateExchangeRequest, Exchange } from './swap.types';

@Injectable()
export class SwapService {
  constructor(
    private readonly client: SwapClient,
    @InjectModel(SwapMapping.name)
    private readonly mappingModel: Model<SwapMappingDocument>,
  ) {}

  async estimate(req: EstimateRequest): Promise<EstimateResponse> {
    return await this.client.estimate(req);
  }

  async createExchange(
    req: CreateExchangeRequest,
  ): Promise<{ opaqueId: string; exchange: Exchange }> {
    const exchange = await this.client.createExchange(req);
    const opaqueId = generateSwapId();
    await this.mappingModel.create({
      opaqueId,
      exchangeId: exchange.id,
      provider: 'WS',
    });
    return { opaqueId, exchange };
  }

  async getExchange(opaqueId: string): Promise<Exchange> {
    const mapping = await this.mappingModel.findOne({ opaqueId });
    if (!mapping) throw new NotFoundException('Swap not found');
    return this.client.getExchange(mapping.exchangeId);
  }
}
