import React, { useState } from 'react';
import { CheckCircle2, Clock, Package, Truck, Smile, ExternalLink, Calendar, MapPin, CreditCard, Tag, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const getPaymentMethodLabel = (method) => {
  if (!method) return 'Chưa xác định';
  switch (method.toLowerCase()) {
    case 'cod': return 'Thanh toán khi nhận hàng (COD)';
    case 'transfer': return 'Chuyển khoản ngân hàng trực tuyến';
    case 'momo': return 'Ví điện tử MoMo';
    case 'stripe': return 'Thanh toán qua Stripe';
    default: return method;
  }
};

export default function OrderDetailsTracker({ order, onOrderCancelled }) {
  if (!order) return null;

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

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
    <div className="w-full bg-white rounded-md p-6 md:p-8 border border-gray-100 space-y-8 animate-in fade-in duration-300">
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
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
            statusId === 5
              ? 'bg-red-50 border-red-200 text-red-500'
              : currentStep === 4
              ? 'bg-green-50 border-green-200 text-green-600'
              : currentStep === 3
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-orange-50 border-orange-200 text-orange-500'
          }`}>
            {getStatusText(statusId)}
          </span>
          {canCancel && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-4 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 text-xs font-black uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center gap-1.5"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE / STEPPER TRẠNG THÁI (Green theme kiểu TGDĐ/ĐMX) */}
      {statusId !== 5 ? (
        <div className="space-y-6 pt-2">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest pl-1">Trạng thái đơn hàng</h3>
          
          <div className="relative pl-8 md:pl-10 space-y-8">
            {/* Đường thẳng chạy dọc kết nối */}
            <div className="absolute left-4 top-4 bottom-4 w-1 bg-gray-100 rounded-full">
              <div 
                className="w-full bg-green-500 rounded-full transition-all duration-700"
                style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>

            {/* Render các bước trong Timeline */}
            {steps.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep >= stepNum;
              const StepIcon = step.icon;
              const stepTime = getStepTime(order.createdAt, stepNum);

              return (
                <div key={idx} className="relative flex gap-4 md:gap-6 animate-in slide-in-from-left duration-300">
                  {/* Node hình tròn ở cột bên trái */}
                  <div className={`absolute -left-7 md:-left-[1.875rem] w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-green-500 border-green-100 text-white scale-110 shadow-md shadow-green-100' 
                      : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={10} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>}
                  </div>

                  {/* Nội dung text */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h4 className={`text-sm font-black ${isCompleted ? 'text-gray-900 font-black' : 'text-gray-400'}`}>
                        {step.title}
                      </h4>
                      {stepTime && (
                        <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-500 shrink-0">
                          {stepTime}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isCompleted ? 'text-gray-600' : 'text-gray-400 opacity-60'}`}>
                      {step.desc}
                    </p>

                    {/* Bài toán Đơn vị vận chuyển thứ 3: GHN tracking code */}
                    {step.hasTracking && isCompleted && (
                      <div className="mt-3 bg-gray-50 p-4 rounded-md border border-gray-100 flex flex-wrap items-center justify-between gap-4 animate-in zoom-in-95">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Đối tác giao nhận</span>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs text-orange-600 font-extrabold uppercase">Giao Hàng Nhanh</strong>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded">
                              Mã vận đơn: GHN-PS{order.id}128
                            </span>
                          </div>
                        </div>
                        <a 
                          href="https://giaohangnhanh.vn" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-md text-[11px] font-black text-gray-700 flex items-center gap-1 transition-all"
                        >
                          Tra cứu trang GHN
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-md flex items-center gap-3 animate-in zoom-in-95">
          <AlertTriangle className="stroke-[2.5]" />
          <div>
            <h4 className="text-sm font-black">Đơn hàng này đã bị hủy</h4>
            <p className="text-xs opacity-80 mt-0.5">Không còn hiển thị tiến trình giao nhận vận chuyển.</p>
          </div>
        </div>
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
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-black text-blue-600">
                  {(item.priceAtPurchase * item.quantity).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THÔNG TIN NGƯỜI NHẬN & PHƯƠNG THỨC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-50 pt-6">
        <div className="space-y-3 bg-gray-50/50 p-5 rounded-md border border-gray-100">
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

        <div className="space-y-3 bg-gray-50/50 p-5 rounded-md border border-gray-100">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-md border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-50 p-6 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-gray-900">Yêu cầu hủy đơn hàng</h3>
                <p className="text-xs text-gray-500 font-bold tracking-tight">Đơn hàng #PS{order.id}</p>
              </div>
              <button 
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason('');
                  setCustomReason('');
                  setCancelError('');
                }}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Vui lòng chọn lý do hủy đơn:</p>
              
              {cancelError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-md text-xs font-bold flex items-center gap-2 animate-in shake">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="space-y-3">
                {cancelReasons.map((reason, idx) => (
                  <label 
                    key={idx} 
                    className={`flex items-center gap-3 p-3.5 rounded-md border transition-all cursor-pointer ${
                      cancelReason === reason 
                        ? 'border-red-500 bg-red-50/30' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="cancel_reason" 
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => {
                        setCancelReason(e.target.value);
                        setCancelError('');
                      }}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-xs font-bold text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              {cancelReason === 'Lý do khác' && (
                <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                  <textarea
                    placeholder="Vui lòng nhập lý do cụ thể..."
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setCancelError('');
                    }}
                    rows={3}
                    className="w-full border border-gray-200 p-3 rounded-md text-xs font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  ></textarea>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-50 p-6 flex gap-3 bg-gray-50/30">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason('');
                  setCustomReason('');
                  setCancelError('');
                }}
                disabled={cancelling}
                className="flex-1 py-3 border border-gray-200 rounded-md text-xs font-black text-gray-700 hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
              >
                ĐÓNG
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-black transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelling ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN HỦY ĐƠN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
