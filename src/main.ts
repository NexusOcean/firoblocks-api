import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PORT = process.env.PORT ?? 3000;
const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });

  app.setGlobalPrefix('v1');

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Firo Explorer API')
      .setDescription('Block explorer REST API for the Firo blockchain')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('v1/docs', app, document);

    writeFileSync(join(process.cwd(), 'test', 'swagger.json'), JSON.stringify(document, null, 2));
  }

  app.enableCors({
    origin: ['http://localhost:5173', 'https://firoblocks.app'],
    methods: ['*'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  await app.listen(PORT);
  console.log(`NestJS listening on: http://localhost:${PORT}`);
  console.log(`Firo docs at: http://localhost:${PORT}/v1/docs`);
}

void bootstrap();
