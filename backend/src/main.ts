import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS এনাবল করা (এটি ছাড়া ফ্রন্টএন্ড ডেটা পাবে না)
  app.enableCors(); 

  await app.listen(3000);
  console.log('🚀 ব্যাকএন্ড চলছে: http://localhost:3000');
}
bootstrap();