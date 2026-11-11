import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  async create(orderData: any): Promise<Order> {
    const newOrder = new this.orderModel(orderData);
    return newOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  // নতুন যোগ করা হলো: স্ট্যাটাস আপডেট করার জন্য
  async updateStatus(id: string, status: string): Promise<Order> {
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      throw new NotFoundException('অর্ডারটি খুঁজে পাওয়া যায়নি');
    }
    return updatedOrder;
  }
}