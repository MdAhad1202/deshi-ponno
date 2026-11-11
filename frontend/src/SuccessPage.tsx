import { motion } from 'framer-motion';

export default function SuccessPage({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">অর্ডার সফল হয়েছে!</h2>
        <p className="text-gray-600 mb-4">আপনার অর্ডার নম্বর: <span className="font-bold text-[#4a2511]">#{orderNumber}</span></p>
        <p className="text-sm text-gray-500 mb-8">আমরা শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করব।</p>
        <a 
          href="/" 
          className="inline-block bg-[#4a2511] text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition"
        >
          আরও কেনাকাটা করুন
        </a>
      </motion.div>
    </div>
  );
}