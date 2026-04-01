import { ApiProperty } from '@nestjs/swagger';

// ─── RPC raw shapes ───────────────────────────────────────────────────────────
export interface FiroAddressBalance {
  balance: number;
  received: number;
}

export type FiroAddressTxIds = string[];

// ─── REST response DTOs ───────────────────────────────────────────────────────
export class AddressTxSummaryDto {
  @ApiProperty({ description: 'Transaction ID (64 char hex)' })
  txid: string;

  @ApiProperty({ description: 'Transaction type' })
  type: string;

  @ApiProperty({ description: 'Unix timestamp' })
  time: number;

  @ApiProperty({ description: 'Block height containing this transaction' })
  blockHeight: number;

  @ApiProperty({ description: 'Number of confirmations' })
  confirmations: number;

  @ApiProperty({
    description: 'Net value change for this address in FIRO (positive = received, negative = sent)',
    required: false,
  })
  valueDelta?: number;
}

export class AddressDto {
  @ApiProperty({ description: 'Firo base58 address' })
  address: string;

  @ApiProperty({ description: 'Current balance in FIRO' })
  balance: number;

  @ApiProperty({ description: 'Total received in FIRO' })
  received: number;

  @ApiProperty({ description: 'Total number of transactions for this address' })
  totalTxCount: number;

  @ApiProperty({
    type: [AddressTxSummaryDto],
    description: 'Paginated transaction list',
  })
  transactions: AddressTxSummaryDto[];

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({
    description: 'Whether background transaction hydration is still in progress',
    required: false,
  })
  hydrating?: boolean;

  @ApiProperty({
    description: 'Full list of txids for this address (newest first)',
    required: false,
  })
  allTxIds?: string[];
}
