import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module'; // নতুন

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/deshi-ponno'),
    ProductsModule,
    OrdersModule, // নতুন
  ],
})
export class AppModule {}