import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() orderData: any) {
    return this.ordersService.create(orderData);
  }

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  // নতুন যোগ করা হলো: স্ট্যাটাস আপডেট করার API (PATCH /orders/:id/status)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }
}