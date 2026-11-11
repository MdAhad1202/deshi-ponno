import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  previousPrice: number;

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ default: 50 })
  stock: number;

  @Prop()
  description: string;

  @Prop()
  imageUrl: string; // (আপনার আগের কোডে যদি থাকে)
}

export const ProductSchema = SchemaFactory.createForClass(Product);