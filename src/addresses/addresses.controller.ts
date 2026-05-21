import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { AddressDto } from './addresses.types';

@ApiTags('addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get(':address')
  @ApiOperation({
    summary: 'Get address balance and paginated transaction history',
  })
  @ApiParam({
    name: 'address',
    description: 'Firo base58 address',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Address details with paginated transactions',
    type: AddressDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid address format' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  getAddress(
    @Param('address') address: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<AddressDto> {
    if (!/^[aZ34][1-9A-HJ-NP-Za-km-z]{25,40}$/.test(address)) {
      throw new BadRequestException('Invalid address');
    }
    return this.addressesService.getAddress(address, page, limit);
  }
}
