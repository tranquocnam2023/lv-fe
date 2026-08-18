import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { orderService } from '../services/orderService';
import OrderDetailsTracker from '../components/OrderDetailsTracker';
import Breadcrumb from '../components/Breadcrumb';
import { Search, FileSearch, AlertCircle, RefreshCw, Eye, X, Filter, ShoppingBag } from 'lucide-react';
import { useLoading } from '../context/LoadingContext';
import { usePagination } from '../hooks/usePagination';

export default function OrderTrackingPage() {
  // Khai báo giải nén các thuộc tính/hàm (stopLoading) từ Hook / Context / Props
  const { stopLoading } = useLoading();
  // Khai báo biến/hằng số: isLoggedIn - Dùng trong logic xử lý của component
  const isLoggedIn = !!localStorage.getItem('token');

  // Input tra cứu
  const [searchOrderId, setSearchOrderId] = useState('');
  // State: searchPhone - Quản lý trạng thái và dữ liệu của searchPhone trong giao diện
  const [searchPhone, setSearchPhone] = useState('');
  // State: selectedStatusFilter - Quản lý trạng thái và dữ liệu của selectedStatusFilter trong giao diện
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Dữ liệu bảng
  const [orders, setOrders] = useState([]);
  // State: loading - Quản lý trạng thái và dữ liệu của loading trong giao diện
  const [loading, setLoading] = useState(false);
  // State: error - Quản lý trạng thái và dữ liệu của error trong giao diện
  const [error, setError] = useState('');

  // Đơn hàng đang được xem chi tiết
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    stopLoading();
    if (isLoggedIn) {
      loadMyOrders();
    }
  }, [isLoggedIn, stopLoading]);

  // Hàm thực thi logic: loadMyOrders
  const loadMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
      const res = await orderService.getMyOrders();
      // Cấu hình/Hằng số/Dịch vụ dữ liệu: data
      const data = Array.isArray(res) ? res : res?.data || [];
      setOrders(data);
    } catch (err) {
      console.error("Lỗi tải đơn hàng của tôi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý logic/sự kiện: handleTrackSubmit
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
        // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
        const res = await api.get(`/Order/track?orderId=${searchOrderId.trim()}&phoneNumber=${searchPhone.trim()}`);
        // Cấu hình/Hằng số/Dịch vụ dữ liệu: data
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

  /**
   * =========================================================================
   * 📌 HÀM CHUẨN HÓA TRẠNG THÁI ĐƠN HÀNG (ORDER STATUS MAPPER):
   * - MỤC ĐÍCH: Ánh xạ chuẩn xác mã trạng thái đơn hàng (1-8) từ CSDL / API Backend sang UI.
   * - LOGIC XỬ LÝ: Ưu tiên nhận diện bản ghi đổi trả đang Pending (Mã 6) hoặc Approved (Mã 7)
   *   từ CSDL/localStorage trước khi fallback đọc các chuỗi status text của API.
   * =========================================================================
   */
  const getOrderStatusId = (ord) => {
    if (!ord) return 0;
    const ordId = String(ord.id || ord.Id || '');
    
    // Đọc trạng thái đổi trả đã ghi nhận từ localStorage
    const savedRequests = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
    const existingReq = savedRequests[ordId];

    // Ưu tiên đọc ID trạng thái trực tiếp từ DB nếu có
    let id = ord.statusId ?? ord.StatusId ?? ord.orderStatusId ?? ord.OrderStatusId;
    if (id !== undefined && id !== null && !isNaN(Number(id))) {
      const numId = Number(id);
      // Nếu khách đã gửi yêu cầu đổi trả đang chờ duyệt -> Chuyển sang mã 6 (Đang yêu cầu đổi trả)
      if (existingReq && existingReq.status === 'Pending') return 6;
      // Nếu yêu cầu đổi trả đã được Admin chấp nhận -> Chuyển sang mã 7 (Đã đổi trả & Hoàn tiền)
      if (existingReq && existingReq.status === 'Approved') return 7;
      return numId;
    }

    // Nếu không đọc được ID số, kiểm tra theo yêu cầu đổi trả
    if (existingReq && existingReq.status === 'Pending') return 6;
    if (existingReq && existingReq.status === 'Approved') return 7;

    // Phân tích chuỗi chữ ký tự tiếng Việt / tiếng Anh để ép kiểu về mã số chuẩn (Xắp xếp theo thứ tự 1-8)
    const st = String(ord.statusName || ord.StatusName || ord.status || '').toLowerCase();
    
    // Mã 1: Chờ xác nhận (Pending)
    if (st.includes('pending') || st.includes('chờ xác nhận') || (st.includes('chờ') && !st.includes('duyệt'))) return 1;
    
    // Mã 2: Đã xác nhận / Đang xử lý (Confirmed / Processing)
    if (st.includes('process') || st.includes('confirm') || st.includes('xử lý') || st.includes('chuẩn')) return 2;
    
    // Mã 3: Đang giao hàng (Shipping)
    if ((st.includes('ship') || st.includes('giao')) && !st.includes('thất bại') && !st.includes('thành công')) return 3;
    
    // Mã 4: Đã hoàn thành (Delivered)
    if (st.includes('complete') || st.includes('deliver') || st.includes('thành công') || st.includes('hoàn thành')) return 4;
    
    // Mã 5: Đã hủy (Cancelled)
    if (st.includes('cancel') || st.includes('hủy')) return 5;
    
    // Mã 6: Đang yêu cầu đổi trả (Pending Return Request)
    if (st.includes('yêu cầu đổi trả') || st.includes('chờ duyệt đổi trả') || st.includes('chờ xét duyệt') || st.includes('đang đổi trả')) return 6;
    
    // Mã 7: Đã đổi trả & Hoàn tiền (Refunded)
    if (st.includes('refund') || st.includes('hoàn tiền') || st.includes('đã đổi trả')) return 7;
    
    // Mã 8: Giao thất bại (Shipping Failed)
    if (st.includes('thất bại') || st.includes('failed')) return 8;

    return 1;
  };

  // Lọc dữ liệu đơn hàng hiển thị ở bảng
  const filteredOrders = orders.filter(ord => {
    // Khai báo biến/hằng số: ordId - Dùng trong logic xử lý của component
    const ordId = String(ord.id || ord.Id || '');
    // Khai báo biến/hằng số: phoneNum - Dùng trong logic xử lý của component
    const phoneNum = String(ord.receiverPhone || ord.ReceiverPhone || '');
    // Khai báo biến/hằng số: name - Dùng trong logic xử lý của component
    const name = String(ord.receiverName || ord.ReceiverName || '').toLowerCase();

    // Khai báo biến/hằng số: cleanOrderId - Dùng trong logic xử lý của component
    const cleanOrderId = searchOrderId.trim().replace('#', '').toLowerCase();
    // Khai báo biến/hằng số: cleanPhone - Dùng trong logic xử lý của component
    const cleanPhone = searchPhone.trim().toLowerCase();

    // Khai báo biến/hằng số: matchesOrderId - Dùng trong logic xử lý của component
    const matchesOrderId = !cleanOrderId || ordId.toLowerCase().includes(cleanOrderId);
    // Khai báo biến/hằng số: matchesPhone - Dùng trong logic xử lý của component
    const matchesPhone = !cleanPhone || phoneNum.toLowerCase().includes(cleanPhone) || name.includes(cleanPhone);

    let matchesStatus = true;
    if (selectedStatusFilter !== 'ALL') {
      // Khai báo biến/hằng số: targetStId - Dùng trong logic xử lý của component
      const targetStId = parseInt(selectedStatusFilter);
      // Khai báo biến/hằng số: currentStId - Dùng trong logic xử lý của component
      const currentStId = getOrderStatusId(ord);
      matchesStatus = currentStId === targetStId;
    }

    return matchesOrderId && matchesPhone && matchesStatus;
  });

  const {
    currentPage,
    totalPages,
    currentData: paginatedOrders,
    goToPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredOrders, 5);

  // Hàm xử lý logic/sự kiện: getStatusBadge
  const getStatusBadge = (ord) => {
    // Khai báo biến/hằng số: stId - Dùng trong logic xử lý của component
    const stId = getOrderStatusId(ord);
    // Khai báo biến/hằng số: stName - Dùng trong logic xử lý của component
    const stName = ord.statusName || ord.StatusName || ord.orderStatusName || ord.OrderStatus?.Name || ord.status;
    switch (stId) {
      case 1:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-amber-700 bg-amber-50 rounded-full border border-amber-200">Chờ xác nhận</span>;
      case 2:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 bg-blue-50 rounded-full border border-blue-200">Đang xử lý</span>;
      case 3:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">Đang giao hàng</span>;
      case 4:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Đã hoàn thành</span>;
      case 5:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-red-700 bg-red-50 rounded-full border border-red-200">Đã hủy</span>;
      case 6:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-orange-800 bg-orange-100 rounded-full border border-orange-300 animate-pulse">Đang yêu cầu đổi trả</span>;
      case 7:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-purple-700 bg-purple-50 rounded-full border border-purple-200">Đổi trả / Hoàn tiền</span>;
      case 8:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-rose-700 bg-rose-50 rounded-full border border-rose-200">Giao thất bại</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-gray-700 bg-gray-50 rounded-full border border-gray-200">{stName || 'Khác'}</span>;
    }
  };

  // Khai báo biến/hằng số: isInitialLoading - Dùng trong logic xử lý của component
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
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Mã đơn hàng (VD: 12)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-primary transition-colors"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            </div>

            {/* Dropdown Lọc trạng thái */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="1">Chờ xác nhận</option>
                <option value="2">Đang xử lý</option>
                <option value="3">Đang giao hàng</option>
                <option value="4">Đã hoàn thành</option>
                <option value="6">Đang yêu cầu đổi trả</option>
                <option value="7">Hoàn tiền / Đổi trả</option>
                <option value="8">Giao thất bại</option>
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
            {loading ? 'Đang tìm...' : 'Tra cứu'}
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
                  {paginatedOrders.map(ord => {
                    // Khai báo biến/hằng số: ordId - Dùng trong logic xử lý của component
                    const ordId = ord.id || ord.Id;
                    // Khai báo biến/hằng số: name - Dùng trong logic xử lý của component
                    const name = ord.receiverName || ord.ReceiverName || 'Khách hàng';
                    // Khai báo biến/hằng số: phone - Dùng trong logic xử lý của component
                    const phone = ord.receiverPhone || ord.ReceiverPhone || '';
                    // Khai báo biến/hằng số: addr - Dùng trong logic xử lý của component
                    const addr = ord.shippingAddressLine || ord.ShippingAddressLine || 'N/A';
                    // Khai báo biến/hằng số: total - Dùng trong logic xử lý của component
                    const total = ord.totalPrice || ord.TotalPrice || 0;
                    // Khai báo biến/hằng số: date - Dùng trong logic xử lý của component
                    const date = ord.createdAt || ord.CreatedAt;
                    // Khai báo biến/hằng số: stId - Dùng trong logic xử lý của component
                    const stId = ord.orderStatusId || ord.OrderStatusId;
                    // Khai báo biến/hằng số: stName - Dùng trong logic xử lý của component
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
                          {getStatusBadge(ord)}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer border-0 inline-flex items-center gap-1"
                          >
                            <Eye size={14} />
                            <span>Xem chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PHẦN THANH PHÂN TRANG (PAGINATION FOOTER) */}
          {filteredOrders.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
              <span className="text-gray-500">
                Hiển thị <span className="text-gray-900">{startIndex}-{endIndex}</span> trên <span className="text-gray-900">{totalItems}</span> đơn hàng
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition cursor-pointer ${currentPage === i + 1
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              )}
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
