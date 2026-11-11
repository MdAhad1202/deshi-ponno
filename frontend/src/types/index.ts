export interface Product {
  _id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  previousPrice: number;
  inStock: boolean;
  description: string;
  stock: number;       // নতুন যোগ হলো
  imageUrl?: string;   // নতুন যোগ হলো (ঐচ্ছিক)
}