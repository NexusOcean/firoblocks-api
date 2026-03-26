import { Injectable, NotFoundException } from '@nestjs/common';
import { BlocksService } from '../blocks/blocks.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AddressesService } from '../addresses/addresses.service';
import { SearchResult } from './search.types';

@Injectable()
export class SearchService {
  constructor(
    private readonly blocksService: BlocksService,
    private readonly txService: TransactionsService,
    private readonly addressesService: AddressesService,
  ) {}

  async search(query: string): Promise<SearchResult> {
    const trimmed = query.trim();

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      try {
        const data = await this.txService.getTransaction(trimmed);
        return { type: 'transaction', data };
      } catch {
        // Could be a block hash — try that before giving up
        try {
          const data = await this.blocksService.getBlockByHash(trimmed);
          return { type: 'block', data };
        } catch {
          throw new NotFoundException(`No transaction or block found for hash: ${trimmed}`);
        }
      }
    }

    if (/^\d+$/.test(trimmed)) {
      const data = await this.blocksService.getBlockByHeight(parseInt(trimmed, 10));
      return { type: 'block', data };
    }

    if (/^[a-zA-Z0-9]{26,34}$/.test(trimmed)) {
      const data = await this.addressesService.getAddress(trimmed);
      return { type: 'address', data };
    }

    throw new NotFoundException(`No results found for query: ${trimmed}`);
  }
}
