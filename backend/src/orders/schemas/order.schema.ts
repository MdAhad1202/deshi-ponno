import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  items: any[]; // [{ name, qty, price }]

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: 'Pending' })
  status: string;

    @Prop({ default: 'inside' })
  deliveryArea: string;

  @Prop({ default: 'COD' })
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);