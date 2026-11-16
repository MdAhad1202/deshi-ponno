import { useEffect, useState } from 'react';
import axios from 'axios';

interface Order {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  totalPrice: number;
  status: string;
  items: any[];
  createdAt: string;
  paymentMethod: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export default function AdminPanel() {
  // পাসওয়ার্ড সুরক্ষার স্টেট
  
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [checkingSession, setCheckingSession] = useState(true);
const [username, setUsername] = useState('admin');
const [password, setPassword] = useState('');
const [loginLoading, setLoginLoading] = useState(false);
const [loginError, setLoginError] = useState('');


  const [activeTab, setActiveTab] = useState('orders'); 
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // নতুন পণ্য যোগ করার স্টেট
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('50');
  const [newDescription, setNewDescription] = useState(''); // নতুন
  const [newImage, setNewImage] = useState(''); // নতুন


  useEffect(() => {
    let active = true;

    axios.get('/api/auth/me')
      .then(() => {
        if (active) setIsAuthenticated(true);
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          error.config?.url !== '/api/auth/login'
        ) {
          setIsAuthenticated(false);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);


  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get('/api/orders'),
        axios.get('/api/products')
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // লগইন হ্যান্ডেলার

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginError('');

    try {
      await axios.post('/api/auth/login', {
        username: username.trim(),
        password,
      });

      setPassword('');
      setIsAuthenticated(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          setLoginError(
            'অনেকবার ভুল লগইন হয়েছে। ১৫ মিনিট পরে চেষ্টা করুন।'
          );
        } else if (error.response?.status === 401) {
          setLoginError('ভুল ইউজারনেম অথবা পাসওয়ার্ড।');
        } else {
          setLoginError('লগইন করা যাচ্ছে না। আবার চেষ্টা করুন।');
        }
      } else {
        setLoginError('লগইন করা যাচ্ছে না।');
      }

      setPassword('');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');

      setIsAuthenticated(false);
      setOrders([]);
      setProducts([]);
      setPassword('');
    } catch (error) {
      console.error(error);
      alert('লগআউট করা যাচ্ছে না। আবার চেষ্টা করুন।');
    }
  };


  // অর্ডারের স্ট্যাটাস আপডেট
  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'স্ট্যাটাস আপডেট করা যায়নি।');
      }
    }
  };

  // পণ্যের দাম আপডেট
  const updateProductPrice = async (id: string, newPrice: number) => {
    try {
      await axios.patch(`/api/products/${id}`, { price: newPrice });
      fetchData();
      alert('দাম আপডেট হয়েছে!');
    } catch (error) {
      console.error(error);
    }
  };

  // পণ্যের স্টক আপডেট
  const updateProductStock = async (id: string, newStock: number) => {
    try {
      await axios.patch(`/api/products/${id}`, { 
        stock: newStock,
        inStock: newStock > 0 
      });
      fetchData();
      alert('স্টক আপডেট হয়েছে!');
    } catch (error) {
      console.error(error);
    }
  };

  // পণ্য ডিলিট
  const deleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি সত্যিই এই পণ্যটি ডিলিট করতে চান?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // নতুন পণ্য যোগ করা
  const addNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    try {
      await axios.post('/api/products', {
        name: newName,
        price: Number(newPrice),
        stock: Number(newStock),
        inStock: Number(newStock) > 0,
        category: 'সাধারণ',
        unit: 'কেজি',
        description: newDescription || 'নতুন পণ্য', // নতুন যোগ হলো
        imageUrl: newImage // নতুন যোগ হলো
      });
      setNewName('');
      setNewPrice('');
      setNewStock('50');
      setNewDescription(''); // ফর্ম খালি করা
      setNewImage('');       // ফর্ম খালি করা
      fetchData();
      alert('পণ্য যোগ হয়েছে!');
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================================
  // লগইন ফর্ম (যদি পাসওয়ার্ড না দেওয়া থাকে)
  // ==========================================
 

    if (checkingSession) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600 font-medium">
            অ্যাডমিন সেশন যাচাই হচ্ছে...
          </p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-2xl font-bold text-gray-800">
                অ্যাডমিন লগইন
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Deshi Ponno Management
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ইউজারনেম
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin username"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>

              {loginError && (
                <p
                  role="alert"
                  className="text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                >
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#2f6b3f] disabled:opacity-60 text-white py-3 rounded-lg font-bold hover:bg-green-800 transition"
              >
                {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>

            <a
              href="/"
              className="block text-center mt-5 text-sm text-gray-500 hover:text-gray-800"
            >
              দোকানে ফিরুন
            </a>
          </div>
        </div>
      );
    }

  // ==========================================
  // মূল অ্যাডমিন ড্যাশবোর্ড
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* হেডার ও ট্যাব */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-gray-500 text-sm">দেশীয় পণ্য ম্যানেজমেন্ট সিস্টেম</p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">দোকানে ফিরুন</a>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              লগআউট
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-4 font-semibold ${activeTab === 'orders' ? 'text-[#2f6b3f] border-b-2 border-[#2f6b3f]' : 'text-gray-500'}`}
          >
            অর্ডার তালিকা
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-2 px-4 font-semibold ${activeTab === 'products' ? 'text-[#2f6b3f] border-b-2 border-[#2f6b3f]' : 'text-gray-500'}`}
          >
            পণ্য ম্যানেজমেন্ট
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">লোড হচ্ছে...</div>
        ) : activeTab === 'orders' ? (
          
          /* ================= অর্ডার ট্যাব ================= */
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4">কাস্টমার</th>
                  <th className="p-4">পেমেন্ট</th>
                  <th className="p-4">মোট বিল</th>
                  <th className="p-4">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center">কোনো অর্ডার নেই</td></tr>
                )}
                {orders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleDateString('bn-BD')}</td>
                    <td className="p-4">
                      <div className="font-bold">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.phone}</div>
                      <div className="text-xs text-gray-400 max-w-[150px] truncate" title={order.address}>{order.address}</div>
                    </td>
                    <td className="p-4 text-sm font-medium">{order.paymentMethod || 'COD'}</td>
                    <td className="p-4 font-bold text-green-700">৳{order.totalPrice}</td>
                    <td className="p-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="border p-2 rounded bg-white text-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        ) : (

          /* ================= পণ্য ট্যাব ================= */
          <div className="space-y-6">
            {/* নতুন পণ্য যোগ করার ফর্ম */}
            <div className="bg-white p-5 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4">নতুন পণ্য যোগ করুন</h2>
              <form onSubmit={addNewProduct} className="flex flex-wrap gap-4 items-end">
                
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-gray-600 mb-1">পণ্যের নাম</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border p-2 rounded focus:outline-none focus:border-[#2f6b3f]" placeholder="যেমন: খাঁটি মধু" required />
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm text-gray-600 mb-1">দাম (৳)</label>
                  <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full border p-2 rounded focus:outline-none focus:border-[#2f6b3f]" placeholder="যেমন: 850" required />
                </div>
                
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-sm text-gray-600 mb-1">স্টক (পিস)</label>
                  <input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full border p-2 rounded focus:outline-none focus:border-[#2f6b3f]" placeholder="৫০" />
                </div>

                {/* নতুন: বিবরণ (Description) */}
                <div className="w-full mt-2">
                  <label className="block text-sm text-gray-600 mb-1">পণ্যের বিবরণ</label>
                  <textarea 
                    value={newDescription} 
                    onChange={e => setNewDescription(e.target.value)} 
                    className="w-full border p-2 rounded focus:outline-none focus:border-[#2f6b3f]" 
                    placeholder="যেমন: খাঁটি ও প্রাকৃতিক, সরাসরি খামার থেকে সংগ্রহ করা..." 
                    rows={2}
                  />
                </div>

                {/* নতুন: ছবির লিংক (Image URL) */}
                <div className="w-full mt-2">
                  <label className="block text-sm text-gray-600 mb-1">ছবির লিংক (URL)</label>
                  <input 
                    type="text" 
                    value={newImage} 
                    onChange={e => setNewImage(e.target.value)} 
                    className="w-full border p-2 rounded focus:outline-none focus:border-[#2f6b3f]" 
                    placeholder="https://example.com/image.jpg" 
                  />
                </div>

                <button type="submit" className="bg-[#2f6b3f] text-white px-6 py-2 rounded h-10 mt-2 hover:bg-green-800 transition">যোগ করুন</button>
              </form>
            </div>

            {/* পণ্যের তালিকা */}
            <div className="bg-white rounded-xl shadow-md overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-4">ছবি</th>
                    <th className="p-4">পণ্যের নাম</th>
                    <th className="p-4">দাম (৳)</th>
                    <th className="p-4">স্টক</th>
                    <th className="p-4">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">N/A</div>
                        )}
                      </td>
                      <td className="p-4 font-medium">
                        {product.name}
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          defaultValue={product.price}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== product.price) updateProductPrice(product._id, val);
                          }}
                          className="border p-1 w-24 rounded focus:outline-none focus:border-[#2f6b3f]"
                        />
                      </td>
                      <td className="p-4">
                        <div className="mb-1 font-bold text-[#2f6b3f]">
                          মজুত: {product.stock ?? 0} {product.stock === 0 ? '(স্টক শেষ)' : 'টি'}
                        </div>
                        <input 
                          key={`${product._id}-${product.stock}`}
                          type="number" 
                          min="0"
                          defaultValue={product.stock ?? 0}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== product.stock) updateProductStock(product._id, val);
                          }}
                          className="border p-1 w-20 rounded focus:outline-none focus:border-[#2f6b3f]"
                        />
                      </td>
                      <td className="p-4">
                        <button onClick={() => deleteProduct(product._id)} className="text-red-500 hover:text-red-700 text-sm font-medium">ডিলিট</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}