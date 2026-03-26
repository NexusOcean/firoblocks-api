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

// ─── REST response DTOs ───────────────────────────────────────────────────────
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

  @ApiProperty({ description: 'Pending transaction IDs', type: [String] })
  txids: string[];
}
