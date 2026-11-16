import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(orderData: any): Promise<Order> {
    const newOrder = new this.orderModel(orderData);
    return newOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Stock is deducted only when an order first becomes Confirmed.
   * Repeating the same status update will not deduct stock again.
   * Cancelling a confirmed order returns its quantities to stock.
   */
  async updateStatus(id: string, status: string): Promise<Order> {
    const allowedStatuses = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('অর্ডারের স্ট্যাটাস সঠিক নয়');
    }

    const currentOrder = await this.orderModel.findById(id).exec();
    if (!currentOrder) {
      throw new NotFoundException('অর্ডারটি খুঁজে পাওয়া যায়নি');
    }

    if (currentOrder.status === status) {
      return currentOrder;
    }

    // Claim the status transition atomically so simultaneous admin requests
    // cannot deduct or restore the same order's stock twice.
    const updatedOrder = await this.orderModel.findOneAndUpdate(
      { _id: id, status: currentOrder.status },
      { $set: { status } },
      { new: true },
    ).exec();

    if (!updatedOrder) {
      throw new ConflictException('অর্ডারটি ইতিমধ্যে অন্যভাবে আপডেট হয়েছে। রিফ্রেশ করে দেখুন।');
    }

    const shouldDeduct = status === 'Confirmed' && currentOrder.status !== 'Confirmed';
    const shouldRestock = status === 'Cancelled' && currentOrder.status === 'Confirmed';

    if (!shouldDeduct && !shouldRestock) {
      return updatedOrder;
    }

    const appliedChanges: Array<{ productId: string; qty: number; deducted: boolean }> = [];

    try {
      if (!Array.isArray(currentOrder.items) || currentOrder.items.length === 0) {
        throw new BadRequestException('এই অর্ডারে কোনো পণ্য পাওয়া যায়নি');
      }

      for (const item of currentOrder.items) {
        const productId = String(item.productId || '');
        const qty = Number(item.qty);

        if (!productId || !Number.isFinite(qty) || qty <= 0) {
          throw new BadRequestException('অর্ডারের পণ্যের ID অথবা পরিমাণ সঠিক নয়');
        }

        if (shouldDeduct) {
          const product = await this.productModel.findOneAndUpdate(
            { _id: productId, stock: { $gte: qty } },
            { $inc: { stock: -qty } },
            { new: true },
          ).exec();

          if (!product) {
            throw new BadRequestException(
              `"${item.name || 'একটি পণ্য'}" পর্যাপ্ত স্টকে নেই। স্টক যাচাই করে আবার চেষ্টা করুন।`,
            );
          }

          await this.productModel.updateOne(
            { _id: productId },
            { $set: { inStock: product.stock > 0 } },
          ).exec();

          appliedChanges.push({ productId, qty, deducted: true });
        } else {
          const product = await this.productModel.findByIdAndUpdate(
            productId,
            { $inc: { stock: qty }, $set: { inStock: true } },
            { new: true },
          ).exec();

          if (!product) {
            throw new NotFoundException('অর্ডারের একটি পণ্য আর পাওয়া যাচ্ছে না');
          }

          appliedChanges.push({ productId, qty, deducted: false });
        }
      }

      return updatedOrder;
    } catch (error) {
      // Compensate any stock changes if one item could not be processed.
      for (const change of appliedChanges.reverse()) {
        if (change.deducted) {
          await this.productModel.updateOne(
            { _id: change.productId },
            { $inc: { stock: change.qty }, $set: { inStock: true } },
          ).exec();
        } else {
          const restored = await this.productModel.findByIdAndUpdate(
            change.productId,
            { $inc: { stock: -change.qty } },
            { new: true },
          ).exec();

          if (restored) {
            await this.productModel.updateOne(
              { _id: change.productId },
              { $set: { inStock: restored.stock > 0 } },
            ).exec();
          }
        }
      }

      await this.orderModel.updateOne(
        { _id: id, status },
        { $set: { status: currentOrder.status } },
      ).exec();

      throw error;
    }
  }
}
