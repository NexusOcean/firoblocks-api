import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EstimateRequest, EstimateResponse, CreateExchangeRequest, Exchange } from './swap.types';

@Injectable()
export class SwapClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.getOrThrow<string>('SWAP_BASE_URL');
    this.apiKey = this.config.getOrThrow<string>('SWAP_API_KEY');
  }

  async estimate(req: EstimateRequest): Promise<EstimateResponse> {
    const { data } = await firstValueFrom(
      this.http.post<EstimateResponse>(`${this.baseUrl}/estimate`, {
        ...req,
        api_key: this.apiKey,
      }),
    );
    return data;
  }

  async createExchange(req: CreateExchangeRequest): Promise<Exchange> {
    const { data } = await firstValueFrom(
      this.http.post<Exchange>(`${this.baseUrl}/exchange`, {
        ...req,
        api_key: this.apiKey,
      }),
    );
    return data;
  }

  async getExchange(id: string): Promise<Exchange> {
    const { data } = await firstValueFrom(
      this.http.get<Exchange>(`${this.baseUrl}/exchange/${id}`),
    );
    return data;
  }
}
