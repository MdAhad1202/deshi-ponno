import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() createProductDto: any) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  // পণ্য আপডেট (PATCH /products/:id)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.productsService.update(id, updateData);
  }

  // পণ্য ডিলিট (DELETE /products/:id)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}