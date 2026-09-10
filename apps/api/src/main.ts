import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { optionalEnv } from '@sp2036/utils';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(optionalEnv('API_PORT', '3001'));
  const websitePort = optionalEnv('WEBSITE_PORT', '3000');
  const adminPort = optionalEnv('ADMIN_PORT', '3002');

  app.enableCors({
    origin: [`http://localhost:${websitePort}`, `http://localhost:${adminPort}`],
  });

  await app.listen(port, optionalEnv('API_HOST', '0.0.0.0'));
  Logger.log(`SP2036 API listening on http://localhost:${port}`);
}

void bootstrap();
