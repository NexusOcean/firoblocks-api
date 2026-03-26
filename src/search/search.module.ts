import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { BlocksModule } from '../blocks/blocks.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [BlocksModule, TransactionsModule, AddressesModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
