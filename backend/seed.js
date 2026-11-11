const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/deshi-ponno')
  .then(async () => {
    const ProductSchema = new mongoose.Schema({
      name: String, category: String, unit: String, price: Number, 
      previousPrice: Number, description: String, inStock: Boolean
    });
    
    // আগের ডেটা মুছে ফেলা
    await mongoose.connection.db.dropCollection('products').catch(() => console.log('No collection to drop'));

    const Product = mongoose.model('Product', ProductSchema);

    // নতুন ৬টি পণ্য যোগ করা
        await Product.insertMany([
      { name: "খেজুরের গুড়", category: "গুড়", unit: "কেজি", price: 400, previousPrice: 380, description: "শীতের খাঁটি রস থেকে তৈরি", inStock: true, imageUrl: "https://images.unsplash.com/photo-1587049352847-4d4b1a6d2b0f?w=500&q=80" },
      { name: "সরিষার তেল", category: "তেল", unit: "লিটার", price: 260, previousPrice: 260, description: "ঘানি ভাঙা খাঁটি সরিষার তেল", inStock: true, imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80" },
      { name: "গাওয়া ঘি", category: "ঘি", unit: "কেজি", price: 1250, previousPrice: 1300, description: "দুধের সর থেকে তৈরি সুগন্ধি ঘি", inStock: true, imageUrl: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=500&q=80" },
      { name: "সুন্দরবনের মধু", category: "মধু", unit: "কেজি", price: 850, previousPrice: 850, description: "১০০% খাঁটি ও প্রাকৃতিক মধু", inStock: true, imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&q=80" },
      { name: "মিষ্টি দই", category: "দই", unit: "কেজি", price: 240, previousPrice: 220, description: "মাটির ভাঁড়ে পাতা ঘন মিষ্টি দই", inStock: true, imageUrl: "https://www.google.com/search?sca_esv=8b9727547dc98b1b&sxsrf=AKL5yDgqJOc6F7wDluPplefcdqCrn7e1pA:1794194078805&udm=2&fbs=ACAhTvwdifjn2dKXmjtOfBxVFl_koHVe5RLSnJlTH2QYaq_YVfnwA0k4pzZ9d-ZbRA0e6tww_WM0IOMLGL1GAIRO4RsbevOqq8OGDuHYzDoEj6iR6JD9QbDV_GVFlvlw_1aP_Fp9m3rZvF7DOHb48oS1GMmZAyniTvQhGx9FjWXSBj0Be2F2DYaV_qOezpfp4qUeIFq5o-FYczbqhGFgI4jCyHPqaeC7Vw&q=doi&sa=X&ved=2ahUKEwig9eXl9fmXAxUXkeEIHVPlALQQtKgLegQIFxAB&biw=653&bih=600&dpr=1#sv=CAMSURoyKhBlLTdGZUx3dGhQb2NvZkVNMg43RmVMd3RoUG9jb2ZFTToOQzRPejc0dDZSd1IxRU0gBCoXCgFzEhBlLTdGZUx3dGhQb2NvZkVNGAEwARgHIOu35uUMSggQAhgBIAIoAQ" },
      { name: "হলুদ গুঁড়া", category: "মসলা", unit: "কেজি", price: 420, previousPrice: 420, description: "বাছাই করা খাঁটি হলুদের গুঁড়া", inStock: true, imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&q=80" },
    ]);
    console.log("সব পণ্য সফলভাবে যোগ করা হয়েছে!");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit();
  });