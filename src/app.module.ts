import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { SearchModule } from './search/search.module';
import { BlocksModule } from './blocks/blocks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AddressesModule } from './addresses/addresses.module';
import { NetworkModule } from './network/network.module';
import { RpcModule } from './rpc/rpc.module';
import { AppService } from './app.service';
import { MasternodeModule } from './masternode/masternode.module';
import cors from 'cors';
import { SwapModule } from './swap/swap.module';
import { MempoolModule } from './mempool/mempool.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        dbName: 'firo_blocks',
        minPoolSize: 5,
        maxPoolSize: 50,
        socketTimeoutMS: 45_000,
        waitQueueTimeoutMS: 5_000,
        serverSelectionTimeoutMS: 10_000,
      }),
    }),
    SearchModule,
    BlocksModule,
    TransactionsModule,
    AddressesModule,
    NetworkModule,
    MempoolModule,
    RpcModule,
    MasternodeModule,
    SwapModule,
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cors({
          origin: ['https://firoblocks.app', 'http://localhost:5173'],
          methods: ['*'],
          allowedHeaders: ['Authorization', 'Content-Type'],
          credentials: true,
        }),
      )
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
