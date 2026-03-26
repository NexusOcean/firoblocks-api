import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { NetworkStatsDto } from './network.types';

@ApiTags('network')
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get network stats — hashrate, difficulty, supply, and more',
  })
  @ApiResponse({ status: 200, type: NetworkStatsDto })
  @ApiResponse({
    status: 503,
    description: 'Scheduler has not written stats yet',
  })
  getStats(): Promise<NetworkStatsDto> {
    return this.networkService.getStats();
  }
}
