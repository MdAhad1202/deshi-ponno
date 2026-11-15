
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/deshi-ponno',
    ),
    AuthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
