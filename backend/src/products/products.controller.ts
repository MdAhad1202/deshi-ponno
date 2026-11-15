
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // Public: customers can view products
  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  // Admin only: add a product
  @UseGuards(AdminJwtGuard)
  @Post()
  async create(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  // Admin only: update a product
  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.productsService.update(id, updateData);
  }

  // Admin only: delete a product
  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
