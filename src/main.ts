import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import { HttpMetricsInterceptor, mongooseMetricsPlugin } from './utils/metrics';
import { RequestMethod } from '@nestjs/common';

const PORT = process.env.PORT ?? 3000;
const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  mongoose.plugin(mongooseMetricsPlugin);

  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });

  app.useGlobalInterceptors(new HttpMetricsInterceptor());

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });

  const config = new DocumentBuilder()
    .setTitle('Firo Explorer API')
    .setDescription('Block explorer REST API for the Firo blockchain')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  if (!isProd) {
    writeFileSync(join(process.cwd(), 'test', 'swagger.json'), JSON.stringify(document, null, 2));
  }

  await app.listen(PORT);
  console.log(`\nExplorer docs at: http://localhost:${PORT}/docs`);
}

void bootstrap();
