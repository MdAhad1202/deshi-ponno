
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const port = Number(process.env.PORT || 4101);

  await app.listen(port, '127.0.0.1');

  console.log(`Deshi Ponno API running on port ${port}`);
}

bootstrap();
