import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { BlockDto, BlockListDto } from './blocks.types';

@ApiTags('blocks')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get a paginated list of blocks' })
  @ApiQuery({
    name: 'before',
    required: false,
    description: 'Return blocks before this height (cursor)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of blocks to return (1-100, default 25)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated block list',
    type: BlockListDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid before or limit parameter',
  })
  getList(@Query('before') before?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 25;
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new BadRequestException('limit must be a number between 1 and 100');
    }
    let parsedBefore: number | undefined;
    if (before !== undefined) {
      parsedBefore = parseInt(before, 10);
      if (isNaN(parsedBefore) || parsedBefore < 0) {
        throw new BadRequestException('before must be a non-negative integer');
      }
    }
    return this.blocksService.getBlockList(parsedBefore, parsedLimit);
  }

  @Get(':hashOrHeight')
  @ApiOperation({ summary: 'Get a block by hash or height' })
  @ApiParam({
    name: 'hashOrHeight',
    description: 'Block hash (64 char hex) or block height (integer)',
  })
  @ApiResponse({ status: 200, description: 'Block details', type: BlockDto })
  @ApiResponse({ status: 400, description: 'Invalid block hash or height' })
  getBlock(@Param('hashOrHeight') hashOrHeight: string) {
    if (/^[0-9a-fA-F]{64}$/.test(hashOrHeight)) {
      return this.blocksService.getBlockByHash(hashOrHeight);
    }
    const height = parseInt(hashOrHeight, 10);
    if (isNaN(height) || height < 0) {
      throw new BadRequestException('Invalid block hash or height');
    }
    return this.blocksService.getBlockByHeight(height);
  }
}
