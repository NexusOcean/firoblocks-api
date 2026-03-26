import { ApiProperty } from '@nestjs/swagger';

// ─── RPC raw shapes ───────────────────────────────────────────────────────────
export interface FiroScriptPubKey {
  asm: string;
  hex: string;
  type: string;
  reqSigs?: number;
  addresses?: string[];
}

export interface FiroScriptSig {
  asm: string;
  hex: string;
}

export interface FiroVinTransparent {
  txid: string;
  vout: number;
  scriptSig: FiroScriptSig;
  value: number;
  valueSat: number;
  address: string;
  sequence: number;
}

export interface FiroVinCoinbase {
  coinbase: string;
  sequence: number;
}

export interface FiroVinSparkSpend {
  scriptSig: FiroScriptSig;
  nFees: number;
  lTags: string[];
  sequence: number;
}

export type FiroVin = FiroVinTransparent | FiroVinCoinbase | FiroVinSparkSpend;

export interface FiroVout {
  value: number;
  n: number;
  scriptPubKey: FiroScriptPubKey;
}

export type FiroTxType = 0 | 5 | 6 | 8 | 9;

export interface FiroTransaction {
  txid: string;
  hash: string;
  hex: string;
  size: number;
  vsize: number;
  version: number;
  locktime: number;
  type: FiroTxType;
  vin: FiroVin[];
  vout: FiroVout[];
  blockhash: string;
  height: number;
  confirmations: number;
  time: number;
  blocktime: number;
  instantlock: boolean;
  chainlock: boolean;
  cbTx?: {
    version: number;
    height: number;
    merkleRootMNList: string;
    merkleRootQuorums: string;
  };
  sparkData?: string;
}

// ─── Type guards ──────────────────────────────────────────────────────────────
export function isCoinbaseVin(vin: FiroVin): vin is FiroVinCoinbase {
  return 'coinbase' in vin;
}

export function isSparkSpendVin(vin: FiroVin): vin is FiroVinSparkSpend {
  return 'lTags' in vin;
}

export function isTransparentVin(vin: FiroVin): vin is FiroVinTransparent {
  return 'txid' in vin;
}

// ─── REST response DTOs ───────────────────────────────────────────────────────
export type TxType = 'coinbase' | 'transparent' | 'spark' | 'unknown';

export class TxVinDto {
  @ApiProperty({ description: 'Source transaction ID', required: false })
  txid?: string;

  @ApiProperty({ description: 'Source output index', required: false })
  vout?: number;

  @ApiProperty({ description: 'Source address', required: false })
  address?: string;

  @ApiProperty({ description: 'Input value in FIRO', required: false })
  value?: number;

  @ApiProperty({ description: 'Spark spend fees', required: false })
  nFees?: number;

  @ApiProperty({
    description: 'Spark linking tags',
    type: [String],
    required: false,
  })
  lTags?: string[];

  @ApiProperty({ description: 'Coinbase data', required: false })
  coinbase?: string;
}

export class TxVoutDto {
  @ApiProperty({ description: 'Output index' })
  n: number;

  @ApiProperty({ description: 'Output value in FIRO' })
  value: number;

  @ApiProperty({ description: 'Script type (e.g. pubkeyhash, sparksmint)' })
  type: string;

  @ApiProperty({ description: 'Output addresses', type: [String] })
  addresses: string[];
}

export class TransactionDto {
  @ApiProperty({ description: 'Transaction ID (64 char hex)' })
  txid: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['coinbase', 'transparent', 'spark', 'unknown'],
  })
  type: TxType;

  @ApiProperty({ description: 'Transaction size in bytes' })
  size: number;

  @ApiProperty({ description: 'Transaction fee in FIRO', required: false })
  fee?: number;

  @ApiProperty({ description: 'Number of confirmations' })
  confirmations: number;

  @ApiProperty({ description: 'Unix timestamp' })
  time: number;

  @ApiProperty({ description: 'Block hash containing this transaction' })
  blockHash: string;

  @ApiProperty({ description: 'Block height containing this transaction' })
  blockHeight: number;

  @ApiProperty({ description: 'Whether the block is chainlocked' })
  chainlock: boolean;

  @ApiProperty({
    description: 'Whether the transaction has an InstantSend lock',
  })
  instantlock: boolean;

  @ApiProperty({ description: 'Transaction inputs', type: [TxVinDto] })
  vin: TxVinDto[];

  @ApiProperty({ description: 'Transaction outputs', type: [TxVoutDto] })
  vout: TxVoutDto[];
}
