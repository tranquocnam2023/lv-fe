import React, { useState } from 'react';
import api from '../services/api';
import OrderDetailsTracker from '../components/OrderDetailsTracker';
import Breadcrumb from '../components/Breadcrumb';
import { Search, FileSearch, ArrowLeft, AlertCircle } from 'lucide-react';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ mã đơn hàng và số điện thoại.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Gọi API tra cứu không cần đăng nhập
      const res = await api.get(`/Order/track?orderId=${orderId.trim()}&phoneNumber=${phone.trim()}`);
      if (res) {
        setOrder(res);
      } else {
        setError('Không tìm thấy thông tin đơn hàng.');
      }
    } catch (err) {
      console.error('Lỗi tra cứu đơn hàng:', err);
      setError(
        typeof err === 'string' 
          ? err 
          : err.message || 'Mã đơn hàng không tồn tại hoặc số điện thoại không khớp.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setOrderId('');
    setPhone('');
    setError('');
  };

  const handleRefresh = async () => {
    try {
      const res = await api.get(`/Order/track?orderId=${orderId.trim()}&phoneNumber=${phone.trim()}`);
      if (res) {
        setOrder(res);
      }
    } catch (err) {
      console.error('Lỗi khi tải lại thông tin đơn hàng:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Tra cứu đơn hàng' }]} />

      {order ? (
        // Đã tìm thấy đơn hàng: Hiển thị giao diện Theo dõi chi tiết
        <div className="space-y-4">
          <div className="flex justify-start">
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors uppercase"
            >
              <ArrowLeft size={14} />
              Tra cứu đơn hàng khác
            </button>
          </div>
          <OrderDetailsTracker order={order} onOrderCancelled={handleRefresh} />
        </div>
      ) : (
        // Chưa tra cứu: Hiển thị Form nhập liệu tra cứu
        <div className="bg-white border border-bordercustom p-8 rounded-md w-full max-w-md mx-auto space-y-4 animate-in zoom-in duration-300">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-md flex items-center justify-center mx-auto">
              <FileSearch size={32} />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2 text-center">Tra cứu trạng thái đơn hàng</h2>
            <p className="text-xs text-gray-500 font-semibold max-w-xs mx-auto text-center">
              Dành cho khách hàng vãng lai không có mật khẩu. Vui lòng nhập Mã đơn hàng và Số điện thoại để tra cứu nhanh.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded text-sm font-medium flex items-center gap-2 animate-in shake duration-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã đơn hàng *</label>
              <input 
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ví dụ: 12"
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại mua hàng *</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại đã dùng đặt hàng..."
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800 placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-2.5 rounded mt-4 transition uppercase flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? 'ĐANG TÌM KIẾM...' : 'TRA CỨU NGAY'}
              {!loading && <Search size={16} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
