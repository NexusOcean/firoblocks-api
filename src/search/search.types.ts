import { ApiProperty } from '@nestjs/swagger';
import { BlockDto } from '../blocks/blocks.types';
import { TransactionDto } from '../transactions/transactions.types';
import { AddressDto } from '../addresses/addresses.types';

export class SearchResult {
  @ApiProperty({
    description: 'Type of result found',
    enum: ['block', 'transaction', 'address'],
  })
  type: 'block' | 'transaction' | 'address';

  @ApiProperty({
    description: 'Result data matching the search query',
    oneOf: [
      { $ref: '#/components/schemas/BlockDto' },
      { $ref: '#/components/schemas/TransactionDto' },
      { $ref: '#/components/schemas/AddressDto' },
    ],
  })
  data: BlockDto | TransactionDto | AddressDto;
}
