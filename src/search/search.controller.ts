import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchResult } from './search.types';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({
    summary: 'Search by block height, block hash, txid, or address',
  })
  @ApiQuery({
    name: 'q',
    description: 'Block height, block hash (64 char hex), txid (64 char hex), or address',
  })
  @ApiResponse({
    status: 200,
    description: 'Search result',
    type: SearchResult,
  })
  @ApiResponse({ status: 400, description: 'Missing or empty query parameter' })
  search(@Query('q') q: string): Promise<SearchResult> {
    if (!q || !q.trim()) {
      throw new BadRequestException('Query parameter q is required');
    }
    return this.searchService.search(q);
  }
}
