import React, { useState } from 'react';
import { Clock, Package, Truck, Smile, Calendar, MapPin, CreditCard, AlertTriangle } from 'lucide-react';
import api from '../services/api';

// Subcomponents
import OrderTimeline from './order-tracker/OrderTimeline';
import OrderCancelModal from './order-tracker/OrderCancelModal';

const getPaymentMethodLabel = (method) => {
  if (!method) return 'Chưa xác định';
  switch (method.toLowerCase()) {
    case 'cod': return 'Thanh toán khi nhận hàng (COD)';
    case 'transfer': return 'Chuyển khoản ngân hàng trực tuyến';
    case 'vnpay': return 'Thanh toán qua VNPAY';
    case 'stripe': return 'Thanh toán qua Stripe';
    default: return method;
  }
};

export default function OrderDetailsTracker({ order, onOrderCancelled, isGuest = false }) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (!order) return null;

  // Trích xuất gói bảo hành (nếu có) từ chi tiết đơn hàng
  const warrantyItem = order.items?.find(item => item.warrantyId);
  const inspectionStatus = warrantyItem?.inspectionStatus;

  const cancelReasons = [
    "Tôi muốn đổi địa chỉ / thông tin nhận hàng",
    "Tôi muốn chọn mua sản phẩm khác",
    "Tìm thấy nơi khác bán giá rẻ hơn",
    "Tôi đặt nhầm số lượng / màu sắc / biến thể",
    "Tôi đổi ý không muốn mua nữa",
    "Lý do khác"
  ];

  // Lấy statusId từ backend trả về (thường là statusId hoặc StatusId)
  const statusId = order.statusId || order.StatusId || 1;

  // Bản đồ trạng thái API sang thứ tự timeline (1-4)
  const getStatusStep = (id) => {
    if (id === 1) return 1; // Pending
    if (id === 2) return 2; // Confirmed/Processing
    if (id === 3) return 3; // Shipping
    if (id === 4) return 4; // Completed/Delivered
    return 1;
  };

  const currentStep = getStatusStep(statusId);

  // Cho phép hủy nếu đơn hàng ở trạng thái Pending (1)
  const canCancel = statusId === 1;

  // Helper định dạng thời gian giả lập chính xác theo mốc
  const getStepTime = (createdAtStr, stepIndex) => {
    const baseDate = new Date(createdAtStr);
    if (isNaN(baseDate.getTime())) return '';

    let stepDate = new Date(baseDate);
    if (stepIndex === 1) {
      // Đúng lúc tạo đơn
    } else if (stepIndex === 2) {
      // 15 phút sau
      stepDate.setMinutes(baseDate.getMinutes() + 15);
    } else if (stepIndex === 3) {
      // 2 giờ 30 phút sau
      stepDate.setMinutes(baseDate.getMinutes() + 150);
    } else if (stepIndex === 4) {
      // 1 ngày sau
      stepDate.setDate(baseDate.getDate() + 1);
    }

    // Nếu bước hiện tại chưa đạt tới mốc thời gian đó (trong thực tế)
    // Hoặc đơn hàng chưa có trạng thái đó
    if (stepIndex > currentStep) return null;

    return stepDate.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      setCancelError('Vui lòng chọn một lý do hủy đơn hàng.');
      return;
    }
    if (cancelReason === 'Lý do khác' && !customReason.trim()) {
      setCancelError('Vui lòng nhập lý do cụ thể.');
      return;
    }

    setCancelling(true);
    setCancelError('');
    try {
      const phoneParam = order.receiverPhone || order.customerPhone || '';
      await api.put(`/Order/${order.id}/cancel?phoneNumber=${encodeURIComponent(phoneParam)}`);
      
      alert('Đơn hàng đã được hủy thành công.');
      setIsCancelModalOpen(false);
      setCancelReason('');
      setCustomReason('');
      
      if (onOrderCancelled) {
        onOrderCancelled();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err);
      setCancelError(
        err.response?.data || err.message || 'Không thể hủy đơn hàng này. Vui lòng thử lại.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentRetry = async () => {
    try {
      const provider = (order.paymentMethod || order.PaymentMethod || 'stripe').toLowerCase();
      const response = await api.post(`/Payment/create-checkout-session/${order.id}?provider=${provider}`);
      
      const data = response?.data || response;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Không thể khởi tạo phiên thanh toán mới.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo phiên thanh toán:", err);
      alert("Đã xảy ra lỗi khi kết nối cổng thanh toán. Vui lòng thử lại.");
    }
  };

  // Các mốc trạng thái
  const steps = [
    {
      title: 'Đặt hàng thành công',
      desc: 'Đơn hàng mới đã được ghi nhận trên hệ thống.',
      icon: Clock,
    },
    {
      title: 'Đã xác nhận & Đóng gói',
      desc: 'Nhân viên cửa hàng đã xác nhận đơn và bàn giao cho kho đóng gói.',
      icon: Package,
    },
    {
      title: 'Đang vận chuyển',
      desc: 'Đơn hàng đã bàn giao cho đối tác vận chuyển Giao Hàng Nhanh (GHN).',
      icon: Truck,
      hasTracking: true,
    },
    {
      title: 'Giao hàng thành công',
      desc: 'Người nhận đã kiểm tra, nhận hàng và hoàn tất thanh toán.',
      icon: Smile,
    }
  ];

  // Helper hiển thị tên trạng thái tiếng Việt
  const getStatusText = (id) => {
    switch (id) {
      case 1: return 'Chờ xác nhận';
      case 2: return 'Đã xác nhận';
      case 3: return 'Đang giao hàng';
      case 4: return 'Đã giao hàng';
      case 5: return 'Đã hủy';
      case 6: return 'Giao thất bại';
      case 7: return 'Đổi trả hoàn tiền';
      default: return order.statusName || order.status || 'Chờ xác nhận';
    }
  };

  return (
    <div className="w-full bg-white rounded-md p-6 md:p-8 border border-gray-100 space-y-8 animate-in fade-in duration-300 font-sans shadow-sm">
      {/* Header đơn hàng */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-50 pb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            Đơn hàng <span className="text-blue-600">#PS{order.id}</span>
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1 flex items-center gap-1">
            <Calendar size={12} />
            Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center gap-3 select-none">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
            statusId === 5
              ? 'bg-red-50 border-red-200 text-red-500'
              : statusId === 7
              ? 'bg-purple-50 border-purple-200 text-purple-600'
              : currentStep === 4
              ? 'bg-green-50 border-green-200 text-green-600'
              : currentStep === 3
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-orange-50 border-orange-200 text-orange-500'
          }`}>
            {getStatusText(statusId)}
          </span>
          {/* PHÂN QUYỀN: Cho phép thanh toán khi đơn hàng ở trạng thái 1 */}
          {statusId === 1 && (order.paymentMethod?.toLowerCase() === 'stripe' || order.paymentMethod?.toLowerCase() === 'vnpay' || order.paymentMethod?.toLowerCase() === 'momo') && (!warrantyItem || inspectionStatus === 'PASSED') && (
            <button
              onClick={handlePaymentRetry}
              className="px-4 py-1.5 bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 text-xs font-black uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              Thanh toán ngay
            </button>
          )}
          {/* PHÂN QUYỀN: Ẩn nút "Hủy đơn hàng" nếu đây là giao diện tra cứu của khách vãng lai (!isGuest) */}
          {!isGuest && canCancel && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 text-xs font-black uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer bg-white"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* TRẠNG THÁI THẨM ĐỊNH BẢO HÀNH */}
      {warrantyItem && (
        <div className={`p-5 rounded-md border animate-in zoom-in-95 space-y-2 ${
          inspectionStatus === 'WAITING_CHECK'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : inspectionStatus === 'PASSED'
            ? 'bg-green-50 border-green-200 text-green-800'
            : inspectionStatus === 'FAILED'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-gray-50 border-gray-250 text-gray-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <h4 className="text-xs font-black uppercase tracking-wider">
              Trạng thái thẩm định thiết bị bảo hành
            </h4>
          </div>
          <p className="text-xs font-bold leading-relaxed">
            {inspectionStatus === 'WAITING_CHECK' && (
              <span>🟡 Cần thẩm định tại cửa hàng: Vui lòng mang thiết bị đến cửa hàng gần nhất và đọc mã đơn #PS{order.id} cho Kỹ thuật viên kiểm tra máy.</span>
            )}
            {inspectionStatus === 'PASSED' && (
              <span>🟢 Máy đủ điều kiện bảo hành: Thẩm định thành công! Vui lòng tiến hành thanh toán để kích hoạt gói bảo hành.</span>
            )}
            {inspectionStatus === 'FAILED' && (
              <span>🔴 Thẩm định thất bại: Thiết bị không đủ điều kiện tham gia gói bảo hành (Cấn móp/Nứt vỡ/Trầy xước nặng). Đơn hàng đã bị hủy.</span>
            )}
            {inspectionStatus === 'NOT_REQUIRED' && (
              <span>🟢 Máy mua mới tại cửa hàng: Gói bảo hành được áp dụng trực tiếp mà không cần qua thẩm định lại.</span>
            )}
          </p>
        </div>
      )}

      {/* TIMELINE / STEPPER TRẠNG THÁI */}
      {statusId === 5 ? (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-md flex items-center gap-3 animate-in zoom-in-95">
          <AlertTriangle className="stroke-[2.5]" />
          <div>
            <h4 className="text-sm font-black">Đơn hàng này đã bị hủy</h4>
            <p className="text-xs opacity-80 mt-0.5 font-medium">Không còn hiển thị tiến trình giao nhận vận chuyển.</p>
          </div>
        </div>
      ) : statusId === 7 ? (
        <div className="bg-purple-50 border border-purple-100 text-purple-700 p-4 rounded-md flex items-center gap-3 animate-in zoom-in-95">
          <CreditCard className="stroke-[2.5] text-purple-600" />
          <div>
            <h4 className="text-sm font-black">Đơn hàng đã được Đổi trả / Hoàn tiền thành công</h4>
            <p className="text-xs opacity-80 mt-0.5 font-medium">
              Hệ thống đã thực hiện hoàn trả số tiền {order.totalPrice.toLocaleString('vi-VN')}₫ cho bạn. Tiền hoàn sẽ được cập nhật trong tài khoản của bạn tùy theo chính sách ngân hàng.
            </p>
          </div>
        </div>
      ) : (
        <OrderTimeline
          order={order}
          currentStep={currentStep}
          steps={steps}
          getStepTime={getStepTime}
        />
      )}

      {/* CHI TIẾT SẢN PHẨM MUA */}
      <div className="border-t border-gray-50 pt-6 space-y-4">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest pl-1">Sản phẩm trong đơn hàng</h3>
        <div className="space-y-4">
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-gray-50 rounded-md p-1.5 border border-gray-100 shrink-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{item.productName}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 italic">
                  {item.variantName} | Số lượng: {item.quantity}
                </p>
                {item.warrantyId && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 bg-blue-50/75 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                    <span>🛡️ Gói bảo hành: {item.warrantyName} (+{item.warrantyPrice?.toLocaleString('vi-VN')}₫)</span>
                    {item.imeiOrSerial && <span className="bg-blue-100 px-1 py-0.2 rounded text-[9px] text-blue-800">IMEI: {item.imeiOrSerial}</span>}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-blue-600">
                  {((item.priceAtPurchase + (item.warrantyPrice || 0)) * item.quantity).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THÔNG TIN NGƯỜI NHẬN & PHƯƠNG THỨC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-50 pt-6">
        <div className="space-y-3 bg-gray-50/50 p-5 rounded-md border border-gray-100 shadow-inner">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin size={14} className="text-blue-500" />
            Thông tin nhận hàng
          </h4>
          <div className="space-y-1.5 text-xs text-gray-600 font-medium">
            <p className="font-bold text-gray-800 text-sm">{order.receiverName || order.customerName}</p>
            <p>SĐT: <strong className="text-gray-800">{order.receiverPhone || order.customerPhone}</strong></p>
            <p className="leading-relaxed">Địa chỉ: {order.shippingAddress || order.addressLine}</p>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50/50 p-5 rounded-md border border-gray-100 shadow-inner">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={14} className="text-blue-500" />
            Thanh toán chi tiết
          </h4>
          <div className="space-y-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">
            <div className="flex justify-between">
              <span>Phương thức thanh toán:</span>
              <span className="text-gray-800 font-black">{getPaymentMethodLabel(order.paymentMethod || order.PaymentMethod)}</span>
            </div>
            {order.promotionCode && (
              <div className="flex justify-between text-green-600">
                <span>Voucher đã dùng:</span>
                <span className="font-black">{order.promotionCode}</span>
              </div>
            )}
            {(order.pointsRedeemed || order.PointsRedeemed) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Dùng điểm Quà Tặng VIP:</span>
                <span className="font-black">-{order.pointsRedeemed || order.PointsRedeemed} điểm (-{(order.discountFromPoints || order.DiscountFromPoints || 0).toLocaleString('vi-VN')}₫)</span>
              </div>
            )}
            {(order.pointsEarned || order.PointsEarned) > 0 && (
              <div className="flex justify-between text-yellow-600">
                <span>Điểm tích lũy nhận được:</span>
                <span className="font-black">+{(order.pointsEarned || order.PointsEarned).toLocaleString('vi-VN')} điểm</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200/50 text-sm font-black text-gray-900 normal-case tracking-normal">
              <span>Tổng cộng thanh toán:</span>
              <span className="text-red-600 font-black text-base">{order.totalPrice.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>
        </div>
      </div>

      {/* TGDĐ-STYLE CANCEL REASON MODAL */}
      {isCancelModalOpen && (
        <OrderCancelModal
          order={order}
          setIsCancelModalOpen={setIsCancelModalOpen}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          customReason={customReason}
          setCustomReason={setCustomReason}
          cancelling={cancelling}
          cancelError={cancelError}
          setCancelError={setCancelError}
          handleCancelOrder={handleCancelOrder}
          cancelReasons={cancelReasons}
        />
      )}
    </div>
  );
}
