import React from 'react';
import { Heart, Coffee, QrCode, Copy, Check, Home } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const DonatePage = () => {
  const [copied, setCopied] = useState(false);
  const accountNo = "1234567890"; // Example account number

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white rounded-md overflow-hidden border border-gray-100">
        {/* Header Decor */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-primary flex items-center justify-center relative">
          <div className="absolute -bottom-10 bg-white p-4 rounded-md border border-gray-50">
            <Heart className="w-12 h-12 text-primary fill-primary/10" />
          </div>
        </div>

        <div className="pt-16 pb-10 px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Donate ủng hộ cho thằng thiết kế Frontend</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Cảm ơn nhiều!
          </p>

          {/* QR Code Container */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-md blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-4 rounded-md border-2 border-dashed border-gray-200 flex flex-col items-center">
              {/* Image Placeholder */}
              <div className="w-64 h-64 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border border-gray-100">
                <img
                  src="/src/assets/qr-donation.jpg"
                  alt="QR Ngân Hàng"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/400x400?text=Vui+lòng+tải+ảnh+lên\nqr-donation.jpg";
                  }}
                />
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-gray-600">
                <QrCode className="w-4 h-4 mr-2 text-primary" />
                Tùy lòng hảo tâm
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-md border border-gray-100">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ngân hàng</label>
              <p className="font-bold text-gray-700">MOMO</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Số tài khoản</label>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-700 text-lg tracking-wider">{accountNo}</p>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-white rounded-md transition-colors text-primary active:scale-95"
                  title="Sao chép số tài khoản"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chủ tài khoản</label>
              <p className="font-bold text-gray-700">TRẦN QUỐC NAM</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center text-gray-400 text-sm">
            <Coffee className="w-4 h-4 mr-2" />
            <span>Cảm ơn sự đóng góp của bạn!</span>
          </div>
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold hover:-translate-y-1 transition-all duration-300 flex items-center group"
      >
        <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Trở về Trang chủ
      </Link>
    </div>
  );
};

export default DonatePage;
