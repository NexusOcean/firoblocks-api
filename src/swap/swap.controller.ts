import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SwapService } from './swap.service';
import { EstimateRequest, CreateExchangeRequest } from './swap.types';
import type { Response } from 'express';
import axios from 'axios';

@ApiTags('Swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Get('price')
  @ApiOperation({ summary: 'Get current FIRO price in USD' })
  async getFiroPrice() {
    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: 'zcoin', vs_currencies: 'usd' },
      });
      return { usd: data.zcoin.usd };
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Unable to fetch FIRO price');
    }
  }

  @Post('estimate')
  @ApiOperation({ summary: 'Get a non-binding exchange rate estimate' })
  estimate(@Body() req: EstimateRequest) {
    try {
      return this.swapService.estimate(req);
    } catch {
      throw new InternalServerErrorException('Unable to get estimate');
    }
  }

  @Post('exchange')
  @ApiOperation({ summary: 'Create a new exchange' })
  async createExchange(
    @Body() req: CreateExchangeRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const swap = await this.swapService.createExchange(req);

      console.log(swap);

      const isProd = process.env.NODE_ENV === 'production';

      res.cookie('swapId', swap.opaqueId, {
        maxAge: 86_400_000,
        httpOnly: false,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        domain: isProd ? '.firoblocks.app' : undefined,
        path: '/',
      });

      const expiresAt = String(Date.now() + 15 * 60 * 1000);

      res.cookie('timeExpiry', expiresAt, {
        maxAge: 86_400_000,
        httpOnly: false,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        domain: isProd ? '.firoblocks.app' : undefined,
        path: '/',
      });

      return { opaqueId: swap.opaqueId, exchange: swap.exchange };
    } catch {
      throw new InternalServerErrorException('Unable to create exchange');
    }
  }

  @Get('exchange/:opaqueId')
  @ApiOperation({ summary: 'Get exchange status by opaque ID' })
  getExchange(@Param('opaqueId') opaqueId: string) {
    return this.swapService.getExchange(opaqueId);
  }
}
