import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { orderService } from '../services/orderService';
import OrderDetailsTracker from '../components/OrderDetailsTracker';
import Breadcrumb from '../components/Breadcrumb';
import { Search, FileSearch, AlertCircle, RefreshCw, Eye, X, Filter, ShoppingBag } from 'lucide-react';
import { useLoading } from '../context/LoadingContext';

export default function OrderTrackingPage() {
  const { stopLoading } = useLoading();
  const isLoggedIn = !!localStorage.getItem('token');

  // Input tra cứu
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Dữ liệu bảng
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Đơn hàng đang được xem chi tiết
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    stopLoading();
    if (isLoggedIn) {
      loadMyOrders();
    }
  }, [isLoggedIn, stopLoading]);

  const loadMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderService.getMyOrders();
      const data = Array.isArray(res) ? res : res?.data || [];
      setOrders(data);
    } catch (err) {
      console.error("Lỗi tải đơn hàng của tôi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchOrderId.trim() && !searchPhone.trim() && !isLoggedIn) {
      setError('Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (searchOrderId.trim() && searchPhone.trim()) {
        const res = await api.get(`/Order/track?orderId=${searchOrderId.trim()}&phoneNumber=${searchPhone.trim()}`);
        const data = res?.data || res;
        if (data && data.id) {
          setOrders([data]);
          setSelectedOrderDetails(data);
        } else {
          setError('Không tìm thấy đơn hàng khớp với mã và số điện thoại này.');
        }
      } else if (isLoggedIn) {
        await loadMyOrders();
      } else {
        setError('Vui lòng nhập đầy đủ cả Mã đơn hàng và Số điện thoại.');
      }
    } catch (err) {
      console.error('Lỗi tra cứu đơn hàng:', err);
      setError(
        typeof err === 'string'
          ? err
          : err.response?.data?.message || err.message || 'Mã đơn hàng không tồn tại hoặc số điện thoại không khớp.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Lọc dữ liệu đơn hàng hiển thị ở bảng
  const filteredOrders = orders.filter(ord => {
    const ordId = String(ord.id || ord.Id || '');
    const phoneNum = String(ord.receiverPhone || ord.ReceiverPhone || '');
    const name = String(ord.receiverName || ord.ReceiverName || '').toLowerCase();

    const cleanOrderId = searchOrderId.trim().replace('#', '').toLowerCase();
    const cleanPhone = searchPhone.trim().toLowerCase();

    const matchesOrderId = !cleanOrderId || ordId.toLowerCase().includes(cleanOrderId);
    const matchesPhone = !cleanPhone || phoneNum.toLowerCase().includes(cleanPhone) || name.includes(cleanPhone);

    let matchesStatus = true;
    if (selectedStatusFilter !== 'ALL') {
      const stId = parseInt(selectedStatusFilter);
      matchesStatus = (ord.orderStatusId || ord.OrderStatusId) === stId;
    }

    return matchesOrderId && matchesPhone && matchesStatus;
  });

  const getStatusBadge = (statusId, statusName) => {
    switch (statusId) {
      case 1:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 rounded-full border border-amber-200">Chờ thanh toán</span>;
      case 2:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 bg-blue-50 rounded-full border border-blue-200">Đang xử lý</span>;
      case 3:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">Đang giao hàng</span>;
      case 4:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Đã hoàn thành</span>;
      case 5:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-red-700 bg-red-50 rounded-full border border-red-200">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-gray-700 bg-gray-50 rounded-full border border-gray-200">{statusName || 'N/A'}</span>;
    }
  };

  const isInitialLoading = loading && orders.length === 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans py-4">
      <Breadcrumb items={[{ label: 'Trang chủ', link: '/' }, { label: 'Tra cứu & Lịch sử đơn hàng' }]} />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="text-primary" size={24} />
              <span>Tra Cứu &amp; Theo Dõi Đơn Hàng</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Tra cứu tiến độ giao hàng, trạng thái xử lý đơn hàng của bạn theo thời gian thực.
            </p>
          </div>
          {isLoggedIn && (
            <button
              type="button"
              disabled={loading}
              onClick={loadMyOrders}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shrink-0 select-none"
            >
              <RefreshCw className={loading ? "animate-spin text-primary" : ""} size={14} />
              <span>{loading ? 'Đang làm mới...' : 'Làm mới danh sách'}</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* INLINE FILTER BAR - 1 HÀNG DUY NHẤT */}
        <form onSubmit={handleTrackSubmit} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input Mã đơn */}
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="text"
                placeholder="Mã đơn hàng (VD: 12)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-primary transition-colors"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            </div>

            {/* Input SĐT */}
            <div className="relative flex-1 min-w-[160px]">
              <input
                type="text"
                placeholder="Số điện thoại mua hàng..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-primary transition-colors"
              />
              <FileSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
            </div>

            {/* Dropdown Lọc trạng thái */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="1">Chờ thanh toán</option>
                <option value="2">Đang xử lý</option>
                <option value="3">Đang giao hàng</option>
                <option value="4">Đã hoàn thành</option>
                <option value="5">Đã hủy</option>
              </select>
              <Filter className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary hover:bg-secondary disabled:bg-gray-400 text-white rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer border-0 shadow shrink-0 flex items-center justify-center gap-1.5 select-none"
          >
            {loading ? 'Đang tìm...' : 'Tra cứu ngay'}
            <Search size={14} />
          </button>
        </form>

        {/* BẢNG DANH SÁCH ĐƠN HÀNG - KHÔNG HUỶ BẢNG KHI TẢI LẠI ĐỂ CHỐNG GIẬT 100% */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[320px] relative flex flex-col justify-between">
          {isInitialLoading ? (
            <div className="flex-1 py-20 text-center flex flex-col items-center justify-center gap-3 text-xs font-bold text-gray-400">
              <RefreshCw className="animate-spin text-primary" size={24} />
              <span>Đang tra cứu dữ liệu đơn hàng...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex-1 py-20 text-center text-xs font-bold text-gray-400 bg-gray-50/50 flex flex-col items-center justify-center space-y-2">
              <FileSearch size={36} className="text-gray-300" />
              <p className="text-gray-600 font-bold">Chưa có dữ liệu đơn hàng nào được tìm thấy.</p>
              <p className="text-[11px] text-gray-400">
                Hãy nhập Mã đơn và Số điện thoại ở thanh lọc trên để tra cứu đơn hàng của bạn.
              </p>
            </div>
          ) : (
            <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <table className="w-full text-left border-collapse text-xs font-semibold text-gray-700">
                <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="p-3.5">Mã đơn</th>
                    <th className="p-3.5">Người nhận &amp; SĐT</th>
                    <th className="p-3.5">Địa chỉ giao hàng</th>
                    <th className="p-3.5">Tổng thanh toán</th>
                    <th className="p-3.5">Thời gian đặt</th>
                    <th className="p-3.5">Trạng thái</th>
                    <th className="p-3.5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredOrders.map(ord => {
                    const ordId = ord.id || ord.Id;
                    const name = ord.receiverName || ord.ReceiverName || 'Khách hàng';
                    const phone = ord.receiverPhone || ord.ReceiverPhone || '';
                    const addr = ord.shippingAddressLine || ord.ShippingAddressLine || 'N/A';
                    const total = ord.totalPrice || ord.TotalPrice || 0;
                    const date = ord.createdAt || ord.CreatedAt;
                    const stId = ord.orderStatusId || ord.OrderStatusId;
                    const stName = ord.orderStatusName || ord.OrderStatus?.Name;

                    return (
                      <tr key={ordId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3.5 font-black text-gray-900 whitespace-nowrap">
                          #PS{ordId}
                        </td>
                        <td className="p-3.5 space-y-0.5">
                          <span className="block font-bold text-gray-900">{name}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">SĐT: {phone}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="block text-gray-600 line-clamp-1 max-w-xs">{addr}</span>
                        </td>
                        <td className="p-3.5 font-black text-red-600 whitespace-nowrap">
                          {total?.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-gray-500 text-[11px]">
                          {date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {getStatusBadge(stId, stName)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer border-0 inline-flex items-center gap-1"
                          >
                            <Eye size={14} />
                            <span>Theo dõi chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT VÀ TIẾN ĐỘ THEO DÕI ĐƠN HÀNG */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <h3 className="text-base font-black text-gray-900 uppercase">
                Chi Tiết Đơn Hàng #PS{selectedOrderDetails.id || selectedOrderDetails.Id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer border-0"
              >
                <X size={20} />
              </button>
            </div>

            <OrderDetailsTracker
              order={selectedOrderDetails}
              onOrderCancelled={() => {
                setSelectedOrderDetails(null);
                if (isLoggedIn) loadMyOrders();
              }}
              isGuest={!isLoggedIn}
            />
          </div>
        </div>
      )}
    </div>
  );
}
