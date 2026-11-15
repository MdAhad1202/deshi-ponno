
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  // Public: customers can place an order
  @Post()
  async create(@Body() orderData: any) {
    return this.ordersService.create(orderData);
  }

  // Admin only: view customer orders
  @UseGuards(AdminJwtGuard)
  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }

  // Admin only: update order status
  @UseGuards(AdminJwtGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
