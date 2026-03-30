import { ApiProperty } from '@nestjs/swagger';

// ─── RPC raw shapes ───────────────────────────────────────────────────────────
export interface FiroBlock {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  cbTx: {
    version: number;
    height: number;
    merkleRootMNList: string;
    merkleRootQuorums: string;
  };
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  previousblockhash?: string;
  nextblockhash?: string;
  chainlock: boolean;
}

// ─── REST response DTOs ───────────────────────────────────────────────────────
export class BlockDto {
  @ApiProperty({ description: 'Block hash (64 char hex)' })
  hash: string;

  @ApiProperty({ description: 'Block height' })
  height: number;

  @ApiProperty({ description: 'Number of confirmations' })
  confirmations: number;

  @ApiProperty({ description: 'Unix timestamp' })
  time: number;

  @ApiProperty({ description: 'Median time of the block' })
  medianTime: number;

  @ApiProperty({ description: 'Block size in bytes' })
  size: number;

  @ApiProperty({ description: 'Block weight' })
  weight: number;

  @ApiProperty({ description: 'Mining difficulty' })
  difficulty: number;

  @ApiProperty({ description: 'Whether the block is chainlocked' })
  chainlock: boolean;

  @ApiProperty({ description: 'Number of transactions in the block' })
  nTx: number;

  @ApiProperty({ description: 'Previous block by height', required: false })
  previousBlockHeight?: number;

  @ApiProperty({ description: 'Next block by height', required: false })
  nextBlockHeight?: number;

  @ApiProperty({ description: 'Transaction IDs in the block', type: [String] })
  txids: string[];
}

export class BlockSummaryDto {
  @ApiProperty({ description: 'Block hash (64 char hex)' })
  hash: string;

  @ApiProperty({ description: 'Block height' })
  height: number;

  @ApiProperty({ description: 'Unix timestamp' })
  time: number;

  @ApiProperty({ description: 'Number of transactions' })
  nTx: number;

  @ApiProperty({ description: 'Block size in bytes' })
  size: number;

  @ApiProperty({ description: 'Mining difficulty' })
  difficulty: number;

  @ApiProperty({ description: 'Whether the block is chainlocked' })
  chainlock: boolean;
}

export class BlockListDto {
  @ApiProperty({ type: [BlockSummaryDto], description: 'List of blocks' })
  blocks: BlockSummaryDto[];

  @ApiProperty({ description: 'Current chain tip height' })
  tip: number;

  @ApiProperty({
    description: 'Cursor for next page, null if no more',
    nullable: true,
  })
  nextCursor: number | null;
}
