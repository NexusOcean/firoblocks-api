import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionDto } from './transactions.types';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Get recent transactions from the latest block' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of transactions to return (default: 10)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of recent transactions',
    type: [TransactionDto],
  })
  getRecentTransactions(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<TransactionDto[]> {
    return this.txService.getRecentTransactions(limit);
  }

  @Get(':txid')
  @ApiOperation({ summary: 'Get a transaction by txid' })
  @ApiParam({
    name: 'txid',
    description: 'Transaction ID (64 char hex)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
    type: TransactionDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid txid format' })
  getTransaction(@Param('txid') txid: string): Promise<TransactionDto> {
    if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
      throw new BadRequestException('Invalid txid');
    }
    return this.txService.getTransaction(txid);
  }
}
