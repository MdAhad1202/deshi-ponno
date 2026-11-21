import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from './types';
import AdminPanel from './AdminPanel';
import SuccessPage from './SuccessPage';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // লোকাল স্টোরেজ থেকে কার্ট লোড করা
  const [cart, setCart] = useState<{ [key: string]: number }>(() => {
    const savedCart = localStorage.getItem('deshiPonnoCart');
    return savedCart ? JSON.parse(savedCart) : {};
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // কাস্টমারের তথ্য
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // ডেলিভারি ও পেমেন্ট স্টেট (আপাতত ডেলিভারি বন্ধ, তাই ডিফল্ট ভ্যালু থাকলেও ব্যবহার হবে না)
  const [deliveryArea, setDeliveryArea] = useState('inside');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // পণ্য লোড করা
  useEffect(() => {
    axios.get('/api/products')
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("এরর হয়েছে:", err);
        setLoading(false);
      });
  }, []);

  // কার্ট সেভ করা
  useEffect(() => {
    localStorage.setItem('deshiPonnoCart', JSON.stringify(cart));
  }, [cart]);

  // Admin order confirm করার পর সব ক্রেতার পেজে নতুন stock দেখাতে নিয়মিত refresh
  useEffect(() => {
    const refreshProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data);
      } catch (err) {
        console.error('স্টক আপডেট লোড করা যায়নি:', err);
      }
    };

    const intervalId = window.setInterval(refreshProducts, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  // স্টক চেক করে কার্টে যোগ করা
  const addToCart = (product: Product) => {
    const currentQty = cart[product._id] || 0;
    if (currentQty >= product.stock) {
      alert('দুঃখিত, এই পণ্যটির স্টক শেষ হয়ে গেছে!');
      return;
    }
    setCart((prev) => ({ ...prev, [product._id]: (prev[product._id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
    const product = products.find((p) => p._id === id);
    return total + (product ? product.price * qty : 0);
  }, 0);

  // ডেলিভারি চার্জ আপাতত বন্ধ (০ টাকা)
  //const deliveryCharge = 0;
  const finalTotalPrice = totalItems > 0 ? totalPrice : 0;

  // অর্ডার কনফার্ম
  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      alert('দয়া করে নাম, ফোন নম্বর এবং ঠিকানা দিন');
      return;
    }

    setIsSubmitting(true);

    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const p = products.find((p) => p._id === id);
      return { 
        productId: id, 
        name: p?.name, 
        qty, 
        price: p?.price 
      };
    });

    try {
      const response = await axios.post('/api/orders', {
        customerName,
        phone: customerPhone,
        address: customerAddress,
        items: orderItems,
        totalPrice: finalTotalPrice,
        deliveryArea,
        paymentMethod
      });

      const generatedOrderNumber = response.data._id.slice(-6).toUpperCase();
      setOrderNumber(generatedOrderNumber);
      
      setCart({});
      localStorage.removeItem('deshiPonnoCart');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setDeliveryArea('inside');
      setPaymentMethod('COD');
      setIsCartOpen(false);
    } catch (error) {
      console.error(error);
      alert('অর্ডার দিতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // রাউটিং কন্ডিশন
  if (window.location.pathname === '/admin') {
    return <AdminPanel />;
  }

  if (orderNumber) {
    return <SuccessPage orderNumber={orderNumber} />;
  }

  // সার্চ ফিল্টার লজিক
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafaf6] text-[#2b1a10] flex flex-col">
      
      {/* আধুনিক হেডার */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img src="/logo.png" alt="দেশীয় পণ্য" className="h-14 w-auto object-contain" />
            <h1 className="text-2xl font-bold text-[#2f6b3f] hidden sm:block">দেশীয় পণ্য</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#2f6b3f] hidden sm:block">মোট: ৳{finalTotalPrice}</span>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-[#2f6b3f] text-white px-5 py-2.5 rounded-full font-medium hover:bg-green-800 transition flex items-center gap-2 shadow-sm"
            >
              <span>কার্ট</span>
              <span className="bg-white text-[#2f6b3f] w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-10 text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-3 text-[#4a2511]">আজকের রেট</h2>
          <p className="text-gray-500 mb-6">সরাসরি খামার থেকে খাঁটি খাবার, আজকের দামে।</p>
          
          <div className="w-full max-w-md relative">
            <input 
              type="text" 
              placeholder="পণ্য খুঁজুন (যেমন: মধু, তেল...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-[#2f6b3f] focus:ring-2 focus:ring-[#2f6b3f]/20 shadow-sm transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl text-gray-500">পণ্য লোড হচ্ছে...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500">কোনো পণ্য পাওয়া যায়নি।</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              // কার্টে থাকা বর্তমান পণ্যের সংখ্যা
              const cartQty = cart[product._id] || 0;
              
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col relative"
                >
                  {/* স্টক নেই ট্যাগ */}
                  {product.stock === 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold">
                      স্টক নেই
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl h-40 mb-4 flex items-center justify-center overflow-hidden relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 font-medium">[ছবি নেই]</span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-[#4a2511]">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 flex-1">{product.description}</p>
                  <p className={`text-xs font-semibold mb-3 ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {product.stock > 0 ? `স্টকে আছে: ${product.stock} ${product.unit}` : 'স্টক শেষ'}
                  </p>
                  <div className="flex items-end justify-between mt-auto">
                    <div className="text-xl font-bold text-[#2f6b3f]">
                      ৳{product.price}
                      <span className="text-sm font-normal text-gray-500"> / {product.unit}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0 || cartQty >= product.stock}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition active:scale-95 shadow-sm ${
                        product.stock > 0 && cartQty < product.stock
                          ? 'bg-[#2f6b3f] text-white hover:bg-green-800' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.stock === 0 ? 'স্টক নেই' : cartQty >= product.stock ? 'লিমিট শেষ' : 'যোগ করুন'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ফুটার */}
      <footer className="bg-[#2b1a10] text-[#f6e7c4] mt-auto py-10 border-t-4 border-[#2f6b3f]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src="/logo.png" alt="দেশীয় পণ্য" className="h-16 w-auto object-contain mb-4 bg-white p-2 rounded-lg" />
            <p className="text-sm opacity-80 leading-relaxed">
              সরাসরি খামার থেকে খাঁটি খাবার, আজকের দামে। কোনো ভেজাল নেই, শুধু খাঁটি স্বাদ।
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">যোগাযোগ</h3>
            <p className="text-sm opacity-80 mb-2">ফোন: +৮৮০ ১৫৭৫ ৮২৭১০৮</p>
            <p className="text-sm opacity-80 mb-4">ইমেইল: deshiponno94@gmail.com</p>
            
            {/* সোশ্যাল মিডিয়া লিংক */}
            <div className="flex flex-wrap gap-3">
              {/* হোয়াটসঅ্যাপ */}
              <a 
                href="https://wa.me/8801575827108" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                হোয়াটসঅ্যাপ
              </a>

              {/* ফেসবুক পেজ */}
              <a 
                href="https://www.facebook.com/profile.php?id=61596724382920" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                ফেসবুক
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">লিংক</h3>
            <ul className="text-sm opacity-80 space-y-2">
              <li><a href="/admin" className="hover:text-white transition">অ্যাডমিন প্যানেল</a></li>
              <li><a href="#" className="hover:text-white transition">শর্তাবলী</a></li>
              <li><a href="#" className="hover:text-white transition">প্রাইভেসি পলিসি</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs opacity-60 mt-8 border-t border-gray-700 pt-4">
          &copy; 2026 দেশীয় পণ্য. All rights reserved.
        </div>
      </footer>

      {/* কার্ট সাইডবার (Drawer) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-[#4a2511]">আপনার কার্ট</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {Object.entries(cart).length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">কার্ট খালি</p>
                ) : (
                  Object.entries(cart).map(([id, qty]) => {
                    const product = products.find((p) => p._id === id);
                    if (!product) return null;
                    return (
                      <div key={id} className="flex gap-4 border-b pb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-[#4a2511]">{product.name}</h4>
                          <p className="text-sm text-gray-500">৳{product.price} / {product.unit}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => removeFromCart(id)} className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100">-</button>
                            <span className="text-sm w-4 text-center font-medium">{qty}</span>
                            <button 
                              onClick={() => addToCart(product)} 
                              disabled={qty >= product.stock}
                              className={`w-6 h-6 border rounded flex items-center justify-center ${
                                qty >= product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-5 border-t bg-gray-50">
                {/* ডেলিভারি এবং পেমেন্ট অপশন (আপাতত বন্ধ) */}
                {/* 
                {totalItems > 0 && (
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ডেলিভারি এরিয়া</label>
                      <select 
                        value={deliveryArea}
                        onChange={(e) => setDeliveryArea(e.target.value)}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-[#2f6b3f]"
                      >
                        <option value="inside">ঢাকার ভেতরে (৳৬০)</option>
                        <option value="outside">ঢাকার বাইরে (৳১২০)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">পেমেন্ট মেথড</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-[#2f6b3f]"
                      >
                        <option value="COD">ক্যাশ অন ডেলিভারি</option>
                        <option value="Bkash">বিকাশ</option>
                        <option value="Nagad">নগদ</option>
                      </select>
                    </div>
                  </div>
                )}
                */}

                {/* বিলের হিসাব */}
                <div className="flex justify-between mb-2 text-gray-600 text-sm">
                  <span>সাব-টোটাল</span>
                  <span>৳{totalPrice}</span>
                </div>
                {/* ডেলিভারি চার্জ লাইনটি আপাতত কমেন্ট করা হলো */}
                {/* 
                <div className="flex justify-between mb-4 text-gray-600 text-sm">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{totalItems > 0 ? deliveryCharge : 0}</span>
                </div>
                */}
                <div className="flex justify-between mb-4 font-bold text-lg text-[#4a2511] border-t pt-2">
                  <span>সর্বমোট</span>
                  <span>৳{finalTotalPrice}</span>
                </div>
                
                {totalItems > 0 && (
                  <div className="space-y-3 mb-4">
                    <input 
                      type="text" 
                      placeholder="আপনার নাম" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-[#2f6b3f] focus:ring-1 focus:ring-[#2f6b3f]" 
                    />
                    <input 
                      type="text" 
                      placeholder="মোবাইল নম্বর" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-[#2f6b3f] focus:ring-1 focus:ring-[#2f6b3f]" 
                    />
                    <textarea 
                      placeholder="ডেলিভারি ঠিকানা" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-[#2f6b3f] focus:ring-1 focus:ring-[#2f6b3f]" 
                      rows={2}
                    />
                  </div>
                )}

                <button 
                  onClick={handleCheckout}
                  disabled={isSubmitting || totalItems === 0}
                  className="w-full bg-[#2f6b3f] text-white py-3.5 rounded-xl font-bold hover:bg-green-800 transition disabled:bg-gray-400 shadow-md"
                >
                  {isSubmitting ? 'অর্ডার হচ্ছে...' : `৳${finalTotalPrice} অর্ডার নিশ্চিত করুন`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;