import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { MempoolService } from './mempool.service';
import { MempoolDto } from './mempool.types';

@ApiTags('mempool')
@Controller('mempool')
export class MempoolController {
  constructor(private readonly mempoolService: MempoolService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current mempool status and pending transaction ids',
  })
  @ApiResponse({
    status: 200,
    description: 'Current mempool status',
    type: MempoolDto,
  })
  getMempool(): Promise<MempoolDto> {
    return this.mempoolService.getMempool();
  }
}
