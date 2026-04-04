import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import { AppService } from './app.service';
import cors from 'cors';

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
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cors({
          origin: ['http://localhost:5173', 'https://firoblocks.app'],
          methods: ['*'],
          allowedHeaders: ['Authorization', 'Content-Type'],
        }),
      )
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'metrics', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
