import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get health and uptime',
  })
  @ApiResponse({
    status: 200,
    description: 'Current health status results',
  })
  getHello() {
    return this.appService.healthCheck();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get MongoDB metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Live feed of query results for Prometheus',
  })
  @Header('Content-Type', register.contentType)
  async getMetrics() {
    return register.metrics();
  }
}
