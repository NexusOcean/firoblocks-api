import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MasternodeService } from './masternode.service';
import { MasternodeStats } from './masternode.types';

@ApiTags('masternodes')
@Controller('masternodes')
export class MasternodeController {
  constructor(private readonly masternodeService: MasternodeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'List all valid masternodes' })
  async lookup(): Promise<MasternodeStats> {
    return await this.masternodeService.stats();
  }
}
