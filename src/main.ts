import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { HttpMetricsInterceptor, mongooseMetricsPlugin } from './utils/metrics';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import '@fastify/cookie';

const PORT = process.env.PORT ?? 3000;
const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  mongoose.plugin(mongooseMetricsPlugin);

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ['debug', 'warn', 'error'],
  });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  await app.register(require('@fastify/cookie'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new HttpMetricsInterceptor());

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });

  app.enableCors({
    origin: ['https://firoblocks.app', 'http://localhost:5173'],
    methods: ['*'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Firo Explorer API')
      .setDescription('Block explorer REST API for the Firo blockchain')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    writeFileSync(join(process.cwd(), 'test', 'swagger.json'), JSON.stringify(document, null, 2));
  }

  await app.listen(PORT, '0.0.0.0');
  console.log(`\n\nExplorer docs at: http://localhost:${PORT}/docs\n`);
}

void bootstrap();
