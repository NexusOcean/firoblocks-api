import { ApiProperty } from '@nestjs/swagger';

// ─── REST response DTOs ───────────────────────────────────────────────────────

export class NetworkStatsDto {
  @ApiProperty({ description: 'Current block height' })
  height: number;

  @ApiProperty({ description: 'Total number of transactions on chain' })
  transactions: number;

  @ApiProperty({ description: 'Total circulating supply in FIRO' })
  totalSupply: number;

  @ApiProperty({ description: 'Current mining difficulty' })
  difficulty: number;

  @ApiProperty({ description: 'Current network hashrate in H/s' })
  hashrate: number;

  @ApiProperty({ description: 'Hash of the current best block' })
  bestBlockHash: string;

  @ApiProperty({
    description: 'Timestamp of when stats were last updated by the scheduler',
  })
  updatedAt: Date;
}
