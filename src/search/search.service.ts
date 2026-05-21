import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlocksService } from '../blocks/blocks.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AddressesService } from '../addresses/addresses.service';
import { SearchResult } from './search.types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly blocksService: BlocksService,
    private readonly txService: TransactionsService,
    private readonly addressesService: AddressesService,
  ) {}

  async search(query: string): Promise<SearchResult> {
    const trimmed = query.trim();

    this.logger.debug('Searching for', trimmed);

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      try {
        const data = await this.txService.getTransaction(trimmed);
        return { type: 'transaction', data };
      } catch {
        throw new NotFoundException(`No transaction found for hash: ${trimmed}`);
      }
    }

    if (/^\d+$/.test(trimmed)) {
      const data = await this.blocksService.getBlockByHeight(parseInt(trimmed, 10));
      return { type: 'block', data };
    }

    if (/^[a4][1-9A-HJ-NP-Za-km-z]{25,40}$/.test(trimmed)) {
      const data = await this.addressesService.getAddress(trimmed);
      return { type: 'address', data };
    }

    throw new NotFoundException(`No results found for query: ${trimmed}`);
  }
}
