import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(createProductDto: any): Promise<Product> {
    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  // নতুন পণ্য আপডেট করার জন্য
  async update(id: string, updateData: any): Promise<Product> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) {
      throw new NotFoundException('পণ্যটি খুঁজে পাওয়া যায়নি');
    }
    return updatedProduct;
  }

  // পণ্য ডিলিট করার জন্য
  async remove(id: string): Promise<any> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id);
    if (!deletedProduct) {
      throw new NotFoundException('পণ্যটি খুঁজে পাওয়া যায়নি');
    }
    return deletedProduct;
  }
}