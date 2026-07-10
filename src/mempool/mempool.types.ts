import { ApiProperty } from '@nestjs/swagger';

// ─── RPC raw shapes ───────────────────────────────────────────────────────────
export interface FiroMempoolInfo {
  size: number;
  bytes: number;
  usage: number;
  maxmempool: number;
  mempoolminfee: number;
  instantsendlocks: number;
}

export type FiroRawMempool = string[];

export interface FiroMempoolEntry {
  size: number;
  fee: number;
  modifiedfee: number;
  time: number;
  height: number;
  descendantcount: number;
  descendantsize: number;
  descendantfees: number;
  ancestorcount: number;
  ancestorsize: number;
  ancestorfees: number;
  depends: string[];
}

export type FiroRawMempoolVerbose = Record<string, FiroMempoolEntry>;

// ─── REST response DTOs ───────────────────────────────────────────────────────
export class MempoolEntryDto {
  @ApiProperty()
  txid: string;

  @ApiProperty()
  fee: number;

  @ApiProperty()
  size: number;

  @ApiProperty({ description: 'Fee rate in FIRO/kB' })
  feeRate: number;

  @ApiProperty({ description: 'Unix timestamp of entry' })
  time: number;
}

export class MempoolDto {
  @ApiProperty({ description: 'Number of pending transactions' })
  pendingCount: number;

  @ApiProperty({ description: 'Total size of mempool in bytes' })
  bytes: number;

  @ApiProperty({ description: 'Memory usage of the mempool' })
  usage: number;

  @ApiProperty({ description: 'Maximum mempool size in bytes' })
  maxMempool: number;

  @ApiProperty({ description: 'Minimum fee rate for mempool acceptance' })
  minFee: number;

  @ApiProperty({ description: 'Number of InstantSend locks' })
  instantSendLocks: number;

  @ApiProperty({ description: 'Pending transactions', type: [MempoolEntryDto] })
  transactions: MempoolEntryDto[];
}
