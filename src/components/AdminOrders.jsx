import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, CheckCircle, Truck, XCircle, Clock, ShoppingCart } from 'lucide-react';
// import { MOCK_ORDERS } from '../utils/mockData'; // Removed mock data
import { orderService } from '../services/orderService';
import { usePagination } from '../hooks/usePagination';
import { useFormat } from '../hooks/useFormat';

const STATUS_TABS = [
  { id: 'all', name: 'Tất cả', count: 0 },
  { id: 'pending', name: 'Chờ xác nhận', count: 0, icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10' },
  { id: 'confirmed', name: 'Đã xác nhận', count: 0, icon: CheckCircle, color: 'text-info', bgColor: 'bg-info/10' },
  { id: 'shipping', name: 'Đang giao', count: 0, icon: Truck, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'delivered', name: 'Đã giao', count: 0, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' },
  { id: 'cancelled', name: 'Đã hủy', count: 0, icon: XCircle, color: 'text-admin-danger', bgColor: 'bg-admin-danger/10' },
];

const ORDER_STATS_CONFIG = [
  { label: 'Tổng đơn hàng', countKey: 'all', icon: ShoppingCart, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-primary)' },
  { label: 'Chờ xác nhận', countKey: 'pending', icon: Clock, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-warning)' },
  { label: 'Đang giao', countKey: 'shipping', icon: Truck, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-info)' },
  { label: 'Đã hoàn thành', countKey: 'delivered', icon: CheckCircle, bgColor: '#FFFFFF', textColor: 'var(--color-admin-text-main)', iconColor: 'var(--color-success)' },
];

// ánh xạ tên phương thức thanh toán
const getPaymentMethodLabel = (method) => {
  if (!method) return 'N/A';
  switch (method.toLowerCase()) {
    case 'cod': return 'Tiền mặt (COD)';
    case 'transfer': return 'Chuyển khoản';
    case 'momo': return 'Ví MoMo';
    case 'stripe': return 'Thẻ Stripe';
    default: return method;
  }
};

const getPaymentMethodStyle = (method) => {
  switch (method?.toLowerCase()) {
    case 'cod': return 'bg-orange-50 text-orange-600 border-orange-100';
    case 'transfer': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'momo': return 'bg-pink-50 text-pink-600 border-pink-100';
    case 'stripe': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    default: return 'bg-gray-50 text-gray-600 border-gray-100';
  }
};


export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: null, newStatus: null });

  // Khởi tạo các hook
  const { formatCurrency, formatDate } = useFormat();

  useEffect(() => {
    console.log("AdminOrders: Bắt đầu tải danh sách đơn hàng...");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    orderService.getAll()
      .then(data => {
        // móc data sql server
        console.log("AdminOrders: Đã tải dữ liệu thành công từ API:", data);
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const mappedOrders = data.map(order => {
              const statusMap = {
                1: 'pending',
                2: 'confirmed',
                3: 'shipping',
                4: 'delivered',
                5: 'cancelled',
                6: 'shipping_failed',
                7: 'refunded'
              };
              const statusStr = statusMap[order.statusId] || 'pending';
              return {
                id: order.id,
                customer: order.receiverName || 'Khách hàng',
                phone: order.receiverPhone || 'N/A',
                date: order.createdAt,
                payment: order.statusId === 2 || order.statusId === 3 || order.statusId === 4 ? 'Đã thanh toán' : 'Chờ thanh toán',
                amount: order.totalPrice,
                status: statusStr,
                paymentMethod: order.paymentMethod || 'cod',
                failedDeliveryCount: order.failedDeliveryCount || 0,
                items: order.items || []
              };
            });
            console.log("AdminOrders: Mapped orders:", mappedOrders);
            setOrders(mappedOrders);
          } else {
            console.log("AdminOrders: Không có đơn hàng nào trong database.");
            setOrders([]);
          }
        } else {
          console.error("AdminOrders: Dữ liệu trả về không phải là mảng!", data);
          setError("Dữ liệu trả về không phải là mảng: " + JSON.stringify(data));
          setOrders([]);
        }
      })
      .catch(err => {
        console.error("AdminOrders: Lỗi tải đơn hàng:", err);
        let errorMsg = "Lỗi không xác định";
        if (err?.response?.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err?.message) {
          errorMsg = err.message;
        } else if (typeof err === 'string' && err.trim() !== '') {
          errorMsg = err;
        } else if (typeof err === 'object') {
          errorMsg = JSON.stringify(err);
        }
        setError(errorMsg);
        setOrders([]);
      });
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'shipping' && (order.status === 'shipping' || order.status === 'shipping_failed')) ||
      order.status === activeTab;
    const matchesSearch = String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const {
    currentData: paginatedOrders,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    startIndex,
    endIndex,
    totalItems
  } = usePagination(filteredOrders, 5); // Hiển thị 5 đơn hàng mỗi trang

  const getStatusName = (status) => {
    return STATUS_TABS.find(t => t.id === status)?.name || status;
  };

  const getOrderStatus = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'preparing': return 'confirmed'; // Ánh xạ về confirmed nếu có
      case 'shipping': return 'confirmed'; // Giữ nguyên trạng thái shop
      case 'delivered': return 'confirmed'; // Giữ nguyên trạng thái shop
      case 'shipping_failed': return 'confirmed'; // Đơn hàng vẫn Đã xác nhận khi giao thất bại
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  const getShippingStatus = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Chưa tạo vận đơn', style: 'bg-gray-100 text-gray-400 font-medium' };
      case 'confirmed':
      case 'preparing':
        return { label: 'Chờ lấy hàng', style: 'bg-blue-50 text-blue-600' };
      case 'shipping':
        return { label: 'Đang giao hàng', style: 'bg-primary/10 text-primary' };
      case 'delivered':
        return { label: 'Đã giao thành công', style: 'bg-success/10 text-success' };
      case 'shipping_failed':
        return { label: 'Giao thất bại', style: 'bg-red-50 text-red-500 font-bold' };
      case 'cancelled':
        return { label: 'Đã hủy', style: 'bg-red-100 text-red-700' };
      default:
        return { label: 'Chưa tạo vận đơn', style: 'bg-gray-100 text-gray-400 font-medium' };
    }
  };

  const isTransitionAllowed = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return true;
    if (currentStatus === 'cancelled' || currentStatus === 'delivered') return false;

    if (currentStatus === 'pending') {
      return newStatus === 'confirmed' || newStatus === 'cancelled';
    }
    if (currentStatus === 'confirmed' || currentStatus === 'preparing') {
      // Đã xác nhận có thể bàn giao vận chuyển (shipping) hoặc hủy
      return newStatus === 'shipping' || newStatus === 'cancelled';
    }
    if (currentStatus === 'shipping') {
      // Đang giao có thể giao thành công hoặc báo giao thất bại
      return newStatus === 'delivered' || newStatus === 'shipping_failed';
    }
    if (currentStatus === 'shipping_failed') {
      // Giao thất bại có thể hủy đơn trực tiếp hoặc giao lại (shipping)
      return newStatus === 'shipping' || newStatus === 'cancelled';
    }
    return false;
  };

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentStatus = order.status;

    // Kiểm tra tính hợp lệ của luồng chuyển đổi trạng thái
    if (!isTransitionAllowed(currentStatus, newStatus)) {
      if (newStatus === 'cancelled' && (currentStatus === 'shipping' || currentStatus === 'shipping_failed')) {
        alert(`⚠️ Đơn hàng giao thất bại mới được ${order.failedDeliveryCount}/3 lần. Phải giao thất bại đủ 3 lần mới được hủy đơn!`);
      } else {
        alert(`⚠️ Không thể chuyển đổi trạng thái từ "${getStatusName(currentStatus)}" sang "${getStatusName(newStatus)}"!`);
      }
      return;
    }

    // Nếu muốn hủy đơn, hiển thị Modal xác nhận
    if (newStatus === 'cancelled') {
      setCancelModal({ isOpen: true, orderId, newStatus });
    } else {
      executeStatusChange(orderId, newStatus, currentStatus);
    }
  };

  const executeStatusChange = (orderId, newStatus, currentStatus) => {
    // Ràng buộc trừ kho:
    // - Đơn hàng khi ở trạng thái xác nhận (confirmed) thì trừ hàng luôn.
    // - Đơn hàng ở trạng thái chờ (pending) thì không được trừ hàng trong kho.
    let stockMessage = "";
    if (currentStatus === 'pending' && (newStatus === 'confirmed' || newStatus === 'shipping' || newStatus === 'delivered')) {
      stockMessage = "\n Đơn hàng đã được xác nhận: Thực hiện trừ số lượng hàng trong kho!";
    } else if ((currentStatus === 'confirmed' || currentStatus === 'shipping' || currentStatus === 'preparing' || currentStatus === 'shipping_failed') && newStatus === 'cancelled') {
      stockMessage = "\n Đơn hàng đã hủy: Thực hiện hoàn lại số lượng hàng vào kho!";
    }

    orderService.updateStatus(orderId, newStatus)
      .then((res) => {
        alert(`Cập nhật trạng thái đơn hàng thành công!${stockMessage}`);
        const data = res?.data || res;
        const nextFailedCount = (data && typeof data.failedDeliveryCount === 'number')
          ? data.failedDeliveryCount
          : (newStatus === 'shipping_failed'
            ? (orders.find(o => o.id === orderId)?.failedDeliveryCount || 0) + 1
            : (orders.find(o => o.id === orderId)?.failedDeliveryCount || 0));

        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o,
          status: newStatus,
          failedDeliveryCount: nextFailedCount
        } : o));
      })
      .catch(err => {
        console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
        const errorMsg = err.response?.data?.message || err.response?.data || err.message;
        alert(`Cập nhật trạng thái đơn hàng thất bại: ${errorMsg}`);
      });
  };

  const confirmCancelOrder = () => {
    const { orderId, newStatus } = cancelModal;
    const order = orders.find(o => o.id === orderId);
    const currentStatus = order ? order.status : 'pending';

    setCancelModal({ isOpen: false, orderId: null, newStatus: null });
    executeStatusChange(orderId, newStatus, currentStatus);
  };

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length,
    shipping: orders.filter(o => o.status === 'shipping' || o.status === 'shipping_failed').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {error && (
        <div className="p-5 bg-admin-danger/10 border border-admin-danger/20 text-admin-danger rounded-md font-bold text-sm">
           Có lỗi xảy ra khi tải dữ liệu đơn hàng: {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-text-main">Danh sách đơn hàng</h2>
          <p className="text-sm text-admin-text-muted font-medium mt-1">Quản lý và cập nhật trạng thái đơn hàng của khách</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-admin-text-muted group-focus-within:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Mã đơn, tên khách hàng..."
            className="w-full pl-11 pr-4 py-3 border border-admin-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white font-medium text-admin-text-main placeholder-admin-text-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview - MISA Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ORDER_STATS_CONFIG.map((item, i) => {
          const Icon = item.icon;
          const count = counts[item.countKey];
          return (
            <div
              key={i}
              className="p-5 rounded-md transition-all flex items-center justify-between h-28 bg-white"
            >
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-admin-text-muted mb-1">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-admin-text-main leading-none">
                  {count.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div className="w-14 h-14 rounded-full bg-admin-bg flex items-center justify-center flex-shrink-0">
                <Icon size={24} style={{ color: item.iconColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-md text-sm font-bold transition-all whitespace-nowrap border ${isActive
                  ? 'bg-primary text-white border-primary shadow-md scale-[1.02]'
                  : 'bg-white text-admin-text-muted border-admin-border hover:border-primary hover:text-primary'
                }`}
            >
              {Icon && <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : tab.color}`} />}
              {tab.name}
              <span className={`ml-3 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tighter ${isActive ? 'bg-white/20 text-white' : 'bg-admin-bg text-admin-text-main'}`}>
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Đơn hàng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Khách hàng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Ngày đặt</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Trạng thái</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Hình thức TT</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Tổng cộng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted">Tình trạng đơn hàng</th>
                <th className="px-6 py-4 text-[12px] font-bold text-admin-text-muted text-center">Trạng thái đơn hàng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border text-sm">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-admin-bg transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold group-hover:underline cursor-pointer">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-admin-text-main">{order.customer}</span>
                        <span className="text-[12px] text-admin-text-muted font-medium">{order.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-admin-text-main">{formatDate(order.date)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${order.payment === 'Đã thanh toán' ? 'bg-success/10 text-success' : 'bg-admin-bg text-admin-text-muted'
                        }`}>
                        {order.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getPaymentMethodStyle(order.paymentMethod)}`}>
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-admin-text-main">
                      {formatCurrency(order.amount)}
                    </td>
                    {/* Cột 1: Trạng thái đơn hàng (Order Status) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <select
                          className="text-xs font-bold bg-admin-bg text-admin-text-main rounded-md px-3 py-2 border-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-admin-border transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                          value={getOrderStatus(order.status)}
                          disabled={order.status === 'shipping' || order.status === 'shipping_failed' || order.status === 'delivered' || order.status === 'cancelled'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending" disabled={order.status !== 'pending'}>Chờ xác nhận</option>
                          <option value="confirmed" disabled={!isTransitionAllowed(order.status, 'confirmed', order.failedDeliveryCount)}>Đã xác nhận</option>
                          <option value="cancelled" disabled={!isTransitionAllowed(order.status, 'cancelled', order.failedDeliveryCount)}>Đã hủy</option>
                        </select>
                      </div>
                    </td>

                    {/* Cột 2: Trạng thái vận chuyển (Shipping Status) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center flex-wrap gap-1">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold inline-block ${getShippingStatus(order.status).style}`}>
                          {order.status === 'shipping_failed'
                            ? `Giao thất bại (${order.failedDeliveryCount}/3 lần)`
                            : getShippingStatus(order.status).label}
                        </span>

                        {/* Nút giả lập hành động vận chuyển */}
                        {(order.status === 'confirmed' || order.status === 'preparing') && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'shipping')}
                            className="text-[10px] font-extrabold text-primary hover:underline px-2 py-1 bg-primary/5 rounded-md border border-primary/10 transition-all hover:bg-primary/10 active:scale-95 whitespace-nowrap"
                            title="Mô phỏng: Bên vận chuyển đến lấy hàng và bắt đầu giao"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'delivered')}
                              className="text-[10px] font-extrabold text-success hover:underline px-2 py-1 bg-success/5 rounded-md border border-success/10 transition-all hover:bg-success/10 active:scale-95 whitespace-nowrap"
                              title="Mô phỏng: Bên vận chuyển cập nhật giao hàng thành công"
                            >
                              Xác nhận đã giao
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'shipping_failed')}
                              className="text-[10px] font-extrabold text-admin-danger hover:underline px-2 py-1 bg-admin-danger/5 rounded-md border border-admin-danger/10 transition-all hover:bg-admin-danger/10 active:scale-95 whitespace-nowrap ml-1"
                              title="Mô phỏng: Giao hàng thất bại"
                            >
                              Giao thất bại
                            </button>
                          </>
                        )}

                        {order.status === 'shipping_failed' && (
                          <div className="flex gap-1.5 items-center">
                            <button
                              onClick={() => handleStatusChange(order.id, 'shipping')}
                              className="text-[10px] font-extrabold text-info hover:underline px-2 py-1 bg-info/5 rounded-md border border-info/10 transition-all hover:bg-info/10 active:scale-95 whitespace-nowrap"
                              title="Mô phỏng: Giao hàng lại lần tiếp theo"
                            >
                              Giao lại
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="text-[10px] font-extrabold px-2 py-1 rounded-md border transition-all whitespace-nowrap text-admin-danger hover:underline bg-admin-danger/5 border-admin-danger/10 hover:bg-admin-danger/10 active:scale-95"
                              title="Hủy đơn hàng"
                            >
                              Hủy đơn
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-admin-text-muted">
                      <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-50" />
                      <p className="text-lg font-bold text-admin-text-main">Không tìm thấy đơn hàng nào</p>
                      <p className="text-sm font-medium mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-admin-text-muted">
            Hiển thị {startIndex}-{endIndex} trên {totalItems} đơn hàng
          </span>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-colors disabled:opacity-50"
            >
              TRƯỚC
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md' : 'bg-transparent text-admin-text-muted hover:bg-admin-bg'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-admin-bg text-admin-text-main rounded-md text-sm font-bold hover:bg-admin-border transition-colors disabled:opacity-50"
            >
              SAU
            </button>
          </div>
        </div>
      </div>

      {/* Custom Confirm Cancel Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-admin-text-main/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-md border border-admin-border w-full max-w-sm mx-4 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-admin-text-main mb-2 flex items-center gap-2">
              ⚠️ Xác nhận hủy đơn hàng
            </h3>
            <p className="text-sm text-admin-text-muted font-medium mb-6">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này sẽ cập nhật lại trạng thái và thực hiện hoàn lại hàng vào kho.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModal({ isOpen: false, orderId: null, newStatus: null })}
                className="px-5 py-2.5 bg-admin-bg text-admin-text-muted font-bold rounded-md text-xs hover:bg-admin-border transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCancelOrder}
                className="px-5 py-2.5 bg-admin-danger text-white font-bold rounded-md text-xs hover:bg-admin-danger/90 transition-colors"
              >
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
