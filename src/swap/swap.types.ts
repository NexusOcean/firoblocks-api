import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type ExchangeStatus =
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'verifying';

export const ALLOWED_COINS = ['btc', 'eth', 'ltc', 'xmr', 'firo'] as const;
export type AllowedCoin = (typeof ALLOWED_COINS)[number];

export const COIN_VALIDATION: Record<AllowedCoin, string> = {
  firo: '^[aZ34][0-9A-Za-z]{33}$',
  ltc: '^(L|M|3)[A-Za-z0-9]{33}$|^(ltc1)[0-9A-Za-z]{39}$',
  eth: '^(0x)[0-9A-Fa-f]{40}$',
  btc: '^[13][a-km-zA-HJ-NP-Z1-9]{25,80}$|^(bc1)[0-9A-Za-z]{25,80}$',
  xmr: '^[48][a-zA-Z\\d]{94}([a-zA-Z\\d]{11})?$',
};

export class Currency {
  @ApiProperty({ example: 'firo' })
  symbol!: string;

  @ApiProperty()
  has_extra_id!: boolean;

  @ApiProperty({ example: 'Firo' })
  name!: string;

  @ApiProperty({ type: [String] })
  warnings_from!: string[];

  @ApiProperty({ type: [String] })
  warnings_to!: string[];

  @ApiPropertyOptional({ example: '^[aZ34][0-9A-Za-z]{33}$' })
  validation_address?: string | null;

  @ApiPropertyOptional()
  validation_extra?: string | null;

  @ApiPropertyOptional()
  address_explorer?: string | null;

  @ApiPropertyOptional()
  tx_explorer?: string | null;

  @ApiProperty()
  image!: string;
}

export class EstimateRequest {
  @ApiProperty({ example: 'eth', enum: ALLOWED_COINS })
  @IsEnum(ALLOWED_COINS)
  currency_from!: AllowedCoin;

  @ApiProperty({ example: 'firo', enum: ALLOWED_COINS })
  @IsEnum(ALLOWED_COINS)
  currency_to!: AllowedCoin;

  @ApiProperty({ example: '0.01' })
  @IsString()
  @IsNotEmpty()
  amount_from!: string;
}

export class EstimateResponse {
  @ApiProperty({ example: '32.17682133' })
  estimated_amount!: string;
}

export class CreateExchangeRequest {
  @ApiProperty({ example: 'eth', enum: ALLOWED_COINS })
  @IsEnum(ALLOWED_COINS)
  currency_from!: AllowedCoin;

  @ApiProperty({ example: 'firo', enum: ALLOWED_COINS })
  @IsEnum(ALLOWED_COINS)
  currency_to!: AllowedCoin;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address_to!: string;

  @ApiProperty({ example: '0.01' })
  @IsString()
  @IsNotEmpty()
  amount_from!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refund_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extra_id_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refund_extra_id?: string;
}

export class Exchange {
  @ApiProperty({ example: 'BGL9U9B4' })
  id!: string;

  @ApiProperty({
    enum: [
      'waiting',
      'confirming',
      'exchanging',
      'sending',
      'finished',
      'failed',
      'refunded',
      'verifying',
    ],
  })
  status!: ExchangeStatus;

  @ApiProperty({ example: 'eth' })
  currency_from!: string;

  @ApiProperty({ example: 'firo' })
  currency_to!: string;

  @ApiProperty()
  amount_from!: string;

  @ApiProperty()
  amount_to!: string;

  @ApiProperty()
  address_from!: string;

  @ApiProperty()
  address_to!: string;

  @ApiProperty()
  extra_id_from!: string;

  @ApiProperty()
  extra_id_to!: string;

  @ApiProperty()
  tx_from!: string;

  @ApiProperty()
  tx_to!: string;

  @ApiProperty()
  refund_address!: string;

  @ApiProperty()
  refund_extra_id!: string;

  @ApiPropertyOptional({ type: [Currency] })
  currencies?: Currency[];
}
