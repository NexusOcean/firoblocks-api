import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { CachedAddress, CachedAddressSchema } from './addresses.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { RpcModule } from '../rpc/rpc.module';

@Module({
  imports: [
    RpcModule,
    TransactionsModule,
    MongooseModule.forFeature([{ name: CachedAddress.name, schema: CachedAddressSchema }]),
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
