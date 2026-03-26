import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { SearchModule } from './search/search.module';
import { BlocksModule } from './blocks/blocks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AddressesModule } from './addresses/addresses.module';
import { MempoolModule } from './mempool/mempool.module';
import { NetworkModule } from './network/network.module';
import { RpcModule } from './rpc/rpc.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        dbName: 'firo_explorer',
      }),
    }),
    SearchModule,
    BlocksModule,
    TransactionsModule,
    AddressesModule,
    MempoolModule,
    NetworkModule,
    RpcModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
