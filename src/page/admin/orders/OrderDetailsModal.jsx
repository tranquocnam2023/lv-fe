import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { useFormat } from '../../../hooks/useFormat';

// ánh xạ tên phương thức thanh toán
const getPaymentMethodLabel = (method) => {
  if (!method) return 'N/A';
  switch (method.toLowerCase()) {
    case 'cod': return 'Tiền mặt (COD)';
    case 'transfer': return 'Chuyển khoản';
    case 'stripe': return 'Thẻ Stripe';
    default: return method;
  }
};

// Hàm xử lý logic/sự kiện: getShippingStatus
const getShippingStatus = (status) => {
  switch (status) {
    case 'pending':
      return { label: '-', style: 'text-gray-400 font-bold text-center w-full block' };
    case 'confirmed':
    case 'preparing':
      return { label: 'Chờ lấy hàng', style: 'bg-blue-50 text-blue-600' };
    case 'shipping':
      return { label: 'Đang giao hàng', style: 'bg-primary/10 text-primary' };
    case 'delivered':
      return { label: 'Đã giao thành công', style: 'bg-success/10 text-success' };
    case 'shipping_failed':
      return { label: 'Giao thất bại', style: 'bg-red-50 text-red-500 font-bold' };
    case 'refunded':
      return { label: 'Đổi trả / Hoàn tiền', style: 'bg-purple-100 text-purple-700 font-bold border border-purple-200' };
    case 'cancelled':
      return { label: 'Đã hủy', style: 'bg-red-100 text-red-700' };
    default:
      return { label: '-', style: 'text-gray-400 font-bold text-center w-full block' };
  }
};

export default function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  onShipWithAhamove,
  onOpenReturnModal,
  getReturnRequestInfo
}) {
  // Khai báo giải nén các thuộc tính/hàm (formatCurrency, formatDate) từ Hook / Context / Props
  const { formatCurrency, formatDate } = useFormat();

  if (!order) return null;

  // Hàm thực thi logic: subTotal
  const subTotal = order.items?.reduce((sum, i) => sum + (i.quantity * (i.priceAtPurchase + (i.warrantyPrice || 0))), 0) || 0;
  // Khai báo biến/hằng số: discountFromPoints - Dùng trong logic xử lý của component
  const discountFromPoints = order.discountFromPoints || 0;
  // Khai báo biến/hằng số: totalPaid - Dùng trong logic xử lý của component
  const totalPaid = order.amount || 0;
  // Khai báo biến/hằng số: diff - Dùng trong logic xử lý của component
  const diff = totalPaid - subTotal + discountFromPoints;
  // Khai báo biến/hằng số: shippingFee - Dùng trong logic xử lý của component
  const shippingFee = diff > 0 ? diff : 0;
  // Khai báo biến/hằng số: promoDiscount - Dùng trong logic xử lý của component
  const promoDiscount = diff < 0 ? -diff : 0;

  return (
    <div className="fixed inset-0 bg-admin-text-main/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-lg border border-admin-border w-full max-w-3xl mx-4 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-admin-bg border-b border-admin-border flex-shrink-0">
          <h3 className="text-lg font-bold text-admin-text-main flex items-center gap-2">
            <span>Chi tiết đơn hàng #{order.id}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-admin-text-muted hover:text-admin-text-main rounded-full hover:bg-admin-border transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Shipping Info */}
            <div className="bg-admin-bg/30 p-4 rounded-md border border-admin-border/55 space-y-2">
              <h4 className="font-bold text-admin-text-main text-xs uppercase tracking-wider mb-3">Thông tin giao nhận</h4>
              <p className="text-admin-text-muted font-bold text-xs">
                Người nhận: <span className="text-admin-text-main font-semibold ml-1">{order.customer}</span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs">
                Số điện thoại: <span className="text-admin-text-main font-semibold ml-1">{order.phone}</span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs">
                Địa chỉ giao: <span className="text-admin-text-main font-medium block mt-1 leading-relaxed">{order.shippingAddress}</span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs mt-2">
                Đơn vị vận chuyển: <span className="text-admin-text-main font-semibold ml-1">{order.shippingCarrier || 'Không xác định'}</span>
              </p>
              {order.deliveryLatitude && order.deliveryLongitude && (
                <p className="text-admin-text-muted font-bold text-xs">
                  Tọa độ giao hàng: <span className="text-admin-text-main font-semibold ml-1">{order.deliveryLatitude.toFixed(6)}, {order.deliveryLongitude.toFixed(6)}</span>
                </p>
              )}
              {order.note && (
                <p className="text-admin-text-muted font-bold text-xs">
                  Ghi chú từ khách: <span className="text-admin-text-main font-medium block mt-1 italic leading-relaxed bg-white p-2.5 rounded border border-admin-border/50">{order.note}</span>
                </p>
              )}
            </div>

            {/* Right: Payment & Status Info */}
            <div className="bg-admin-bg/30 p-4 rounded-md border border-admin-border/55 space-y-2.5">
              <h4 className="font-bold text-admin-text-main text-xs uppercase tracking-wider mb-3">Thanh toán & Trạng thái</h4>
              <p className="text-admin-text-muted font-bold text-xs flex justify-between">
                <span>Ngày đặt đơn:</span>
                <span className="text-admin-text-main font-semibold">{formatDate(order.date)}</span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs flex justify-between">
                <span>Hình thức thanh toán:</span>
                <span className="text-admin-text-main font-semibold">{getPaymentMethodLabel(order.paymentMethod)}</span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs flex justify-between items-center">
                <span>Trạng thái thanh toán:</span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${order.payment === 'Đã thanh toán' ? 'bg-success/10 text-success' : 'bg-admin-bg text-admin-text-muted border border-admin-border/40'}`}>
                  {order.payment}
                </span>
              </p>
              <p className="text-admin-text-muted font-bold text-xs flex justify-between items-center">
                <span>Tình trạng đơn hàng:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${getShippingStatus(order.status).style}`}>
                  {order.status === 'shipping_failed'
                    ? `Giao thất bại (${order.failedDeliveryCount}/3 lần)`
                    : getShippingStatus(order.status).label}
                </span>
              </p>
            </div>
          </div>

          {/* Section: Ahamove Shipping Info */}
          {order.ahamoveOrderId && (
            <div className="bg-primary/5 p-4 rounded-md border border-primary/20 space-y-2">
              <h4 className="font-bold text-primary text-xs uppercase tracking-wider mb-2">Thông tin vận chuyển Ahamove</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <p className="text-admin-text-muted font-bold">
                  Mã vận đơn: <span className="text-admin-text-main font-semibold ml-1">{order.ahamoveOrderId}</span>
                </p>
                <p className="text-admin-text-muted font-bold">
                  Trạng thái Ahamove: <span className="text-primary font-extrabold ml-1">{order.ahamoveStatus || 'Đang xử lý'}</span>
                </p>
                {order.actualShippingFee > 0 && (
                  <p className="text-admin-text-muted font-bold">
                    Cước phí thực tế: <span className="text-admin-text-main font-semibold ml-1">{formatCurrency(order.actualShippingFee)}</span>
                  </p>
                )}
                {order.ahamoveSharedLink && (
                  <p className="text-admin-text-muted font-bold col-span-1 sm:col-span-2">
                    Theo dõi thời gian thực:
                    <a
                      href={
                        order.ahamoveSharedLink.includes('mock-tracking-link') || order.ahamoveSharedLink.includes('mock')
                          ? `/order-tracking?id=${order.id}`
                          : order.ahamoveSharedLink
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-extrabold ml-1 hover:underline inline-flex items-center gap-0.5"
                    >
                      Bấm vào đây để theo dõi hành trình tài xế ↗
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section: Points & Discounts */}
          {(order.pointsEarned > 0 || order.pointsRedeemed > 0 || order.promotionCode) && (
            <div className="bg-admin-bg/30 p-4 rounded-md border border-admin-border/55">
              <h4 className="font-bold text-admin-text-main text-xs uppercase tracking-wider mb-3">Điểm thưởng & Khuyến mãi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {order.pointsEarned > 0 && (
                  <p className="text-admin-text-muted font-bold">
                    Điểm tích lũy nhận được: <span className="text-success font-bold ml-1">+{order.pointsEarned} điểm</span>
                  </p>
                )}
                {order.pointsRedeemed > 0 && (
                  <p className="text-admin-text-muted font-bold">
                    Điểm tích lũy đã quy đổi: <span className="text-admin-danger font-bold ml-1">-{order.pointsRedeemed} điểm (-{formatCurrency(order.discountFromPoints)})</span>
                  </p>
                )}
                {order.promotionCode && (
                  <p className="text-admin-text-muted font-bold col-span-1 sm:col-span-2">
                    Mã giảm giá đã áp dụng: <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-extrabold ml-1">{order.promotionCode}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section: Products Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-admin-text-main text-xs uppercase tracking-wider">Danh sách sản phẩm đã mua</h4>
            <div className="border border-admin-border rounded-md overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-admin-bg border-b border-admin-border text-xs text-admin-text-muted">
                    <th className="px-4 py-3 font-bold">Sản phẩm</th>
                    <th className="px-4 py-3 font-bold text-right">Đơn giá</th>
                    <th className="px-4 py-3 font-bold text-center">Số lượng</th>
                    <th className="px-4 py-3 font-bold text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border text-xs">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-admin-bg/30">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-admin-text-main">{item.productName}</span>
                          {item.variantName && item.variantName !== 'Mặc định' && (
                            <span className="text-[11px] text-admin-text-muted font-medium mt-0.5">Biến thể: {item.variantName}</span>
                          )}
                          {item.warrantyId && (
                            <span className="text-[11px] text-blue-600 font-extrabold mt-1">
                              Bảo hành mở rộng: {item.warrantyName} (+{formatCurrency(item.warrantyPrice)})
                            </span>
                          )}
                          {/* HIỂN THỊ IMEI & TRẠNG THÁI THẨM ĐỊNH MÁY TRONG MODAL BẢO HÀNH ADMIN */}
                          {item.imeiOrSerial && (
                            <span className="text-[10px] text-gray-500 font-bold mt-0.5">
                              IMEI/Serial: {item.imeiOrSerial} (
                              {/* 
                                Logic so khớp nhãn trạng thái thẩm định:
                                1. WAITING_CHECK -> 'Chờ kiểm tra'
                                2. PASSED / Approved -> 'Đã duyệt'
                                3. NOT_REQUIRED -> 'Máy mới (Không cần kiểm tra)' (Tránh bị nhảy nhầm vào nhánh Từ chối cũ)
                                4. FAILED / Rejected -> 'Từ chối'
                              */}
                              {item.inspectionStatus === 'WAITING_CHECK'
                                ? 'Chờ kiểm tra'
                                : (item.inspectionStatus === 'PASSED' || item.inspectionStatus === 'Approved' || item.inspectionStatus === 'Approved_Passed' || item.inspectionStatus === 'ĐÃ DUYỆT')
                                  ? 'Đã duyệt'
                                  : (item.inspectionStatus === 'NOT_REQUIRED')
                                    ? 'Máy mới (Không cần kiểm tra)'
                                    : (item.inspectionStatus === 'FAILED' || item.inspectionStatus === 'Rejected' || item.inspectionStatus === 'Rejected_Failed' || item.inspectionStatus === 'TỪ CHỐI')
                                      ? 'Từ chối'
                                      : item.inspectionStatus || 'Đã duyệt'
                              }
                              )
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-admin-text-main">
                        {formatCurrency(item.priceAtPurchase)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-admin-text-main">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-admin-text-main">
                        {formatCurrency(item.quantity * (item.priceAtPurchase + (item.warrantyPrice || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Total calculation */}
          <div className="flex flex-col items-end gap-2 border-t border-admin-border pt-4 text-xs font-semibold">
            <div className="flex justify-between w-64 text-admin-text-muted font-bold">
              <span>Tổng tiền hàng:</span>
              <span className="text-admin-text-main font-semibold">{formatCurrency(subTotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between w-64 text-admin-text-muted font-bold">
                <span>Giảm giá khuyến mãi:</span>
                <span className="text-admin-danger font-bold">-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            {discountFromPoints > 0 && (
              <div className="flex justify-between w-64 text-admin-text-muted font-bold">
                <span>Giảm giá tích lũy:</span>
                <span className="text-admin-danger font-bold">-{formatCurrency(discountFromPoints)}</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between w-64 text-admin-text-muted font-bold">
                <span>Phí vận chuyển:</span>
                <span className="text-admin-text-main font-semibold">+{formatCurrency(shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-sm font-extrabold text-admin-text-muted border-t border-admin-border/50 pt-2 mt-1">
              <span className="text-admin-text-main">Tổng thanh toán:</span>
              <span className="text-lg font-extrabold text-primary">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-admin-bg border-t border-admin-border flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 
              GHI CHÚ HỆ THỐNG: TẠO VÀ CHUYỂN TẤT CẢ CÁC NÚT THAO TÁC ĐƠN HÀNG VÀO MODAL CHI TIẾT
              - Mục đích thiết kế UI/UX: Rút gọn bảng danh sách đơn hàng ngoài AdminOrders.jsx giúp giao diện gọn gàng.
              - Logic hoạt động: Tùy thuộc vào trạng thái hiện tại của đơn hàng (`order.status`), modal footer sẽ tự động 
                hiển thị các nút thao tác tương ứng:
                + 'pending': Duyệt & Giao hàng (Manual), Hủy đơn
                + 'confirmed' / 'preparing': Gửi giao hàng qua Ahamove (nếu carrier là Ahamove) hoặc Giao hàng (Manual)
                + 'shipping': Xác nhận đã giao, Giao thất bại
                + 'delivered': Duyệt Đổi trả (nếu có yêu cầu Pending)
                + 'shipping_failed': Giao lại
            */}
            {order.status === 'pending' && onStatusChange && (
              <>
                <button
                  onClick={() => onStatusChange(order.id, 'shipping')}
                  className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="1-Click: Duyệt đơn hàng và chuyển ngay sang Đang giao"
                >
                  Duyệt & Giao hàng (Manual)
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'cancelled')}
                  className="px-4 py-2 bg-admin-danger/10 text-admin-danger border border-admin-danger/20 hover:bg-admin-danger/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="Hủy đơn hàng"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {(order.status === 'confirmed' || order.status === 'preparing') && (
              <>
                {order.shippingCarrier && order.shippingCarrier.toLowerCase().includes('ahamove') ? (
                  onShipWithAhamove && (
                    <button
                      onClick={() => onShipWithAhamove(order.id)}
                      className="px-5 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-primary/90 transition-colors text-xs cursor-pointer shadow-sm animate-pulse active:scale-95"
                      title="Gửi đơn hàng sang hệ thống Ahamove"
                    >
                      Gửi giao hàng qua Ahamove
                    </button>
                  )
                ) : (
                  onStatusChange && (
                    <button
                      onClick={() => onStatusChange(order.id, 'shipping')}
                      className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                      title="Bên vận chuyển đến lấy hàng và bắt đầu giao"
                    >
                      Giao hàng (Manual)
                    </button>
                  )
                )}
              </>
            )}

            {order.status === 'shipping' && onStatusChange && (
              <>
                <button
                  onClick={() => onStatusChange(order.id, 'delivered')}
                  className="px-4 py-2 bg-success/10 text-success border border-success/20 hover:bg-success/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="Xác nhận khách đã nhận hàng thành công"
                >
                  Xác nhận đã giao
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'shipping_failed')}
                  className="px-4 py-2 bg-admin-danger/10 text-admin-danger border border-admin-danger/20 hover:bg-admin-danger/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="Báo giao hàng thất bại"
                >
                  Giao thất bại
                </button>
              </>
            )}

            {(order.status === 'return_requested' || order.statusId === 6) && (
              <button
                onClick={() => onOpenReturnModal && onOpenReturnModal(order)}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                title="Khách vừa gửi yêu cầu đổi trả! Nhấp để xem và duyệt ngay"
              >
                <RotateCcw size={14} />
                <span>Duyệt Đổi Trả &amp; Hoàn Tiền</span>
              </button>
            )}

            {order.status === 'refunded' && (
              <span className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-md flex items-center gap-1">
                <RotateCcw size={12} />
                <span>Đã hoàn tiền</span>
              </span>
            )}

            {order.status === 'shipping_failed' && onStatusChange && (
              <>
                <button
                  onClick={() => onStatusChange(order.id, 'shipping')}
                  className="px-4 py-2 bg-info/10 text-info border border-info/20 hover:bg-info/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="Giao hàng lại lần tiếp theo"
                >
                  Giao lại
                </button>
                <button
                  onClick={() => onStatusChange(order.id, 'cancelled')}
                  className="px-4 py-2 bg-admin-danger/10 text-admin-danger border border-admin-danger/20 hover:bg-admin-danger/20 rounded-md font-extrabold text-xs cursor-pointer transition-all active:scale-95"
                  title="Hủy đơn hàng"
                >
                  Hủy đơn
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-admin-border text-admin-text-main rounded-md font-bold hover:bg-admin-bg transition-colors text-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
