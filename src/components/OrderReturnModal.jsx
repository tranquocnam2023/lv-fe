/**
 * =========================================================================
 *   COMPONENT DÙNG CHUNG: OrderReturnModal.jsx
 * - CHỨC NĂNG: Xử lý Đổi trả & Hoàn tiền cho cả 2 phía:
 *   + mode="user": Khách chọn sản phẩm trong đơn, nhập lý do & tải ảnh minh chứng.
 *   + mode="admin": Admin xem thông tin sản phẩm khiếu nại, ảnh minh chứng & bấm duyệt 1-Click (OrderStatusId = 7).
 * =========================================================================
 */
import React, { useState, useEffect } from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2, X, Upload, Image as ImageIcon, AlertCircle, Clock } from 'lucide-react';
import { returnService } from '../services/returnService';

export default function OrderReturnModal({ isOpen, onClose, order, mode = 'user', onSuccess }) {
  // State phía User
  const [selectedItems, setSelectedItems] = useState({});
  // State: itemReasons - Quản lý trạng thái và dữ liệu của itemReasons trong giao diện
  const [itemReasons, setItemReasons] = useState({});
  // State: itemImages - Quản lý trạng thái và dữ liệu của itemImages trong giao diện
  const [itemImages, setItemImages] = useState({});
  // State: generalNote - Quản lý trạng thái và dữ liệu của generalNote trong giao diện
  const [generalNote, setGeneralNote] = useState('');
  // State: submitting - Quản lý trạng thái và dữ liệu của submitting trong giao diện
  const [submitting, setSubmitting] = useState(false);
  // State: successMsg - Quản lý trạng thái và dữ liệu của successMsg trong giao diện
  const [successMsg, setSuccessMsg] = useState('');

  // State phía Admin
  const [adminNote, setAdminNote] = useState('');

  // Yêu cầu đổi trả hiện có của đơn, đọc từ back-end (GET /Return/order/{orderId}).
  // Trước đây đọc localStorage nên đổi máy/xoá cache là mất, và admin không thấy gì.
  const [existingReturnData, setExistingReturnData] = useState(null);

  const currentOrderId = order?.id ?? order?.Id ?? null;

  useEffect(() => {
    if (!isOpen || !currentOrderId) return;
    let cancelled = false;
    returnService.getReturnRequestByOrder(currentOrderId)
      .then(res => {
        if (cancelled) return;
        setExistingReturnData(res?.data ?? res ?? null);
      })
      .catch(() => {
        // 404 = đơn chưa có yêu cầu đổi trả nào, đây là trường hợp bình thường
        if (!cancelled) setExistingReturnData(null);
      });
    return () => { cancelled = true; };
  }, [isOpen, currentOrderId]);

  useEffect(() => {
    if (order && order.items) {
      // Khai báo biến/hằng số: initialSelected - Dùng trong logic xử lý của component
      const initialSelected = {};
      // Khai báo biến/hằng số: initialReasons - Dùng trong logic xử lý của component
      const initialReasons = {};
      // Khai báo biến/hằng số: initialImages - Dùng trong logic xử lý của component
      const initialImages = {};

      order.items.forEach(item => {
        // Khai báo biến/hằng số: itemId - Dùng trong logic xử lý của component
        const itemId = item.id || item.Id || item.orderItemId;
        initialSelected[itemId] = true;
        initialReasons[itemId] = 'Sản phẩm lỗi kỹ thuật / Không hoạt động';
        initialImages[itemId] = [];
      });

      setSelectedItems(initialSelected);
      setItemReasons(initialReasons);
      setItemImages(initialImages);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Khai báo biến/hằng số: orderId - Dùng trong logic xử lý của component
  const orderId = order.id || order.Id;
  // Khai báo biến/hằng số: items - Dùng trong logic xử lý của component
  const items = order.items || order.orderItems || order.OrderItems || [];

  // Tính hạn đổi trả 30 ngày
  const getReturnDeadline = (createdDate) => {
    // Khai báo biến/hằng số: d - Dùng trong logic xử lý của component
    const d = new Date(createdDate || Date.now());
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 31);
    return d.toLocaleDateString('vi-VN');
  };

  // Toggle chọn sản phẩm
  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Thay đổi lý do đổi trả cho sản phẩm
  const handleReasonChange = (itemId, reason) => {
    setItemReasons(prev => ({ ...prev, [itemId]: reason }));
  };

  // Giả lập upload ảnh minh chứng
  const handleImageUpload = (itemId, e) => {
    // Khai báo biến/hằng số: files - Dùng trong logic xử lý của component
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Hàm thực thi logic: newUrls
    const newUrls = files.map(file => URL.createObjectURL(file));
    setItemImages(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...newUrls]
    }));
  };

  // Xóa ảnh minh chứng
  const handleRemoveImage = (itemId, index) => {
    setItemImages(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter((_, i) => i !== index)
    }));
  };

  // User gửi yêu cầu đổi trả
  const handleUserSubmit = async (e) => {
    if (e) e.preventDefault();

    // Hàm thực thi logic: selectedIds
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm bạn muốn đổi trả.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Gửi yêu cầu đổi trả về BE. Đây là NGUỒN DỮ LIỆU CHÍNH: bản ghi nằm ở bảng
      //    ReturnRequests để admin (máy khác, trình duyệt khác) đọc được qua API /Return.
      //    Trước đây lỗi API bị nuốt bằng console.warn nên yêu cầu chỉ tồn tại trong
      //    localStorage của chính máy khách - admin không bao giờ thấy.
      const createdReq = await returnService.createReturnRequest({
        orderId: Number(orderId),
        reason: Object.values(itemReasons).join('; ') || 'Sản phẩm lỗi kỹ thuật',
        note: generalNote,
        items: selectedIds.map(itemId => ({
          orderItemId: Number(itemId),
          quantity: 1,
          reason: itemReasons[itemId] || 'Sản phẩm lỗi kỹ thuật',
          proofImages: (itemImages[itemId] || []).join(';')
        }))
      });

      // 2. KHÔNG đổi trạng thái đơn hàng ở đây.
      //    Đơn phải giữ nguyên trạng thái 4 (Đã giao) trong lúc chờ duyệt; chỉ khi admin duyệt
      //    thì ReturnController mới chuyển đơn sang 7 (Refunded) trong cùng transaction hoàn
      //    kho - hoàn tiền. Lệnh updateStatus(...,'return_requested') cũ map sang Id 6, mà 6
      //    trong CSDL là "Giao hàng thất bại", đồng thời chuyển 4 -> 6 bị BE chặn thẳng.

      // 3. Khai báo biến/hằng số: returnPayload - Dùng trong logic xử lý của component
      const createdData = createdReq?.data ?? createdReq;
      const returnPayload = {
        // Id thật do back-end cấp, dùng khi admin gọi duyệt/từ chối
        returnRequestId: createdData?.id ?? `REQ-${orderId}-${Date.now()}`,
        orderId: orderId,
        userId: order.userId || order.UserId,
        status: 'Pending',
        totalRefundAmount: order.totalPrice || order.TotalPrice || order.amount,
        createdAt: new Date().toISOString(),
        returnItems: selectedIds.map(itemId => {
          // Hàm thực thi logic: item
          const item = items.find(i => String(i.id || i.Id || i.orderItemId) === String(itemId));
          return {
            orderItemId: itemId,
            productName: item?.productName || item?.ProductName || 'Sản phẩm',
            quantity: item?.quantity || item?.Quantity || 1,
            priceAtPurchase: item?.price || item?.Price || 0,
            reason: itemReasons[itemId] || 'Sản phẩm không vừa ý',
            proofImages: itemImages[itemId] || []
          };
        }),
        generalNote: generalNote
      };

      // Không còn ghi vào localStorage: yêu cầu đã nằm trong bảng ReturnRequests và mọi màn hình
      // (giỏ theo dõi đơn của khách, danh sách đơn + chuông thông báo của admin) đều đọc qua API.
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('return_request_updated'));

      setSuccessMsg('Đã gửi yêu cầu đổi trả thành công! Đang chuyển trạng thái...');
      setTimeout(() => {
        setSubmitting(false);
        setSuccessMsg('');
        onClose();
        if (onSuccess) onSuccess(returnPayload);
      }, 1200);
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu đổi trả:', err);
      alert('Đã xảy ra lỗi khi gửi yêu cầu đổi trả.');
      setSubmitting(false);
    }
  };

  // Admin phê duyệt hoàn tiền (StatusId = 7)
  // Lấy Id thật của yêu cầu đổi trả. Ưu tiên Id đã có sẵn trên object order (admin lấy từ
  // API /Return), nếu không có thì hỏi lại back-end theo orderId.
  const resolveReturnRequestId = async () => {
    const known = order?.returnRequest?.id ?? order?.returnRequestId;
    if (known) return known;
    try {
      const res = await returnService.getReturnRequestByOrder(orderId);
      const data = res?.data ?? res;
      return data?.id ?? null;
    } catch (err) {
      console.error('Không đọc được yêu cầu đổi trả của đơn:', err);
      return null;
    }
  };

  const handleAdminApprove = async () => {
    setSubmitting(true);
    try {
      // Route back-end là PUT /Return/{id}/approve với id = ReturnRequests.Id,
      // KHÔNG phải OrderId. Truyền nhầm orderId thì API trả 404, rơi vào catch rỗng và
      // fallback updateStatus(...,'refunded') - tức đổi trạng thái đơn mà bỏ qua toàn bộ
      // transaction 7 bước của BE: không hoàn kho, không ghi nhận hoàn tiền.
      const returnRequestId = await resolveReturnRequestId();
      if (!returnRequestId) {
        throw new Error('Không tìm thấy yêu cầu đổi trả của đơn hàng này trên hệ thống.');
      }
      await returnService.approveReturnRequest(returnRequestId, adminNote);

      // Lưu log kiểm toán
      try {
        // Khai báo biến/hằng số: currentLogs - Dùng trong logic xử lý của component
        const currentLogs = JSON.parse(localStorage.getItem('PROJECT_AUDIT_LOGS') || '[]');
        currentLogs.unshift({
          id: Date.now(),
          action: 'APPROVE_RETURN_REFUND',
          userEmail: 'admin@phoneshop.com',
          targetTable: 'ReturnRequests',
          targetId: `ORDER-#PS${orderId}`,
          newValues: `Admin đã duyệt đổi trả & hoàn tiền cho đơn hàng #PS${orderId}. Ghi chú: ${adminNote || 'Chấp nhận hoàn tiền'}`,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('PROJECT_AUDIT_LOGS', JSON.stringify(currentLogs));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Lỗi ghi audit log FE:', e);
      }

      alert(`Đã phê duyệt Đổi trả & Hoàn tiền cho đơn hàng #PS${orderId} thành công!`);
      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Lỗi khi duyệt hoàn tiền:', err);
      alert(err?.message || 'Không thể cập nhật trạng thái hoàn tiền. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  // Admin từ chối yêu cầu
  const handleAdminReject = async () => {
    setSubmitting(true);
    try {
      const returnRequestId = await resolveReturnRequestId();
      if (!returnRequestId) {
        throw new Error('Không tìm thấy yêu cầu đổi trả của đơn hàng này trên hệ thống.');
      }
      await returnService.rejectReturnRequest(returnRequestId, adminNote);

      // Lưu log kiểm toán từ chối
      try {
        // Khai báo biến/hằng số: currentLogs - Dùng trong logic xử lý của component
        const currentLogs = JSON.parse(localStorage.getItem('PROJECT_AUDIT_LOGS') || '[]');
        currentLogs.unshift({
          id: Date.now(),
          action: 'REJECT_RETURN_REQUEST',
          userEmail: 'admin@phoneshop.com',
          targetTable: 'ReturnRequests',
          targetId: `ORDER-#PS${orderId}`,
          newValues: `Admin đã từ chối yêu cầu đổi trả cho đơn hàng #PS${orderId}. Lý do: ${adminNote || 'Không đủ điều kiện'}`,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('PROJECT_AUDIT_LOGS', JSON.stringify(currentLogs));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Lỗi ghi audit log FE:', e);
      }

      alert(`Đã từ chối yêu cầu đổi trả cho đơn hàng #PS${orderId}.`);
      setSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Lỗi khi từ chối đổi trả:', err);
      alert('Không thể từ chối yêu cầu đổi trả. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };


  // Kiểm tra đã hết thời hạn 30 ngày chưa (Ngày tạo đơn + 30 ngày)
  const isExpired = (() => {
    if (!order?.createdAt) return false;
    // Khai báo biến/hằng số: deadline - Dùng trong logic xử lý của component
    const deadline = new Date(order.createdAt);
    deadline.setDate(deadline.getDate() + 30);
    return new Date() > deadline;
  })();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-150 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 uppercase">
                {mode === 'admin' ? 'Kiểm Duyệt Yêu Cầu Đổi Trả' : 'Tạo Yêu Cầu Đổi Trả Sản Phẩm'}
              </h3>
              <p className="text-xs text-gray-500 font-bold">Mã đơn hàng: #PS{orderId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer border-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thông báo chính sách 30 ngày */}
        <div className={`p-3.5 border rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs ${isExpired ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50/80 border-blue-200 text-blue-900'
          }`}>
          <ShieldAlert size={18} className={isExpired ? 'text-red-600 shrink-0' : 'text-blue-600 shrink-0'} />
          <span>
            Chính sách đổi trả 1 đổi 1 trong <strong>30 ngày</strong> (Thời hạn đến ngày <strong>{getReturnDeadline(order.createdAt)}</strong>).
          </span>
        </div>

        {/* ================= GIAO DIỆN USER (MODE = USER) ================= */}
        {mode === 'user' && isExpired && !existingReturnData ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2.5 text-red-900 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-red-700 uppercase text-sm">
                <AlertCircle size={18} />
                <span>Đã hết thời gian đổi trả sản phẩm</span>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                Rất tiếc, đơn hàng <strong>#PS{orderId}</strong> của quý khách đã <strong>vượt quá thời hạn 30 ngày đổi trả</strong> (Hạn chót là ngày <strong>{getReturnDeadline(order.createdAt)}</strong>).
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-red-150 text-[11px] text-red-800 space-y-1">
                <p className="font-bold">⚠️ Quy định áp dụng chính sách đổi trả 1 đổi 1:</p>
                <p>• Yêu cầu đổi trả chỉ có hiệu lực trong vòng <strong>30 ngày</strong> kể từ khi đặt/giao hàng thành công.</p>
                <p>• Nếu sản phẩm phát sinh sự cố kỹ thuật sau 30 ngày, quý khách vui lòng liên hệ Trung tâm bảo hành chính hãng hoặc hotline CSKH để được hỗ trợ.</p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition cursor-pointer border border-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : mode === 'user' && existingReturnData ? (
          <div className="space-y-4 text-xs">
            {/* THÔNG BÁO TRẠNG THÁI ĐƠN */}
            {existingReturnData.status === 'Pending' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-amber-800 uppercase">
                  <Clock size={16} />
                  <span>Yêu cầu đổi trả đang được xét duyệt</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Yêu cầu đổi trả của bạn cho đơn hàng <strong>#PS{orderId}</strong> đã được gửi thành công. Nhân viên CSKH sẽ xem xét và phản hồi cho bạn trong vòng 24 giờ.
                </p>
              </div>
            )}

            {existingReturnData.status === 'Approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-1 text-green-900 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-green-800 uppercase">
                  <CheckCircle2 size={16} />
                  <span>Yêu cầu đổi trả đã được phê duyệt & Hoàn tiền</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Đơn hàng của bạn đã được chấp nhận đổi trả và hoàn tiền thành công.
                </p>
              </div>
            )}

            {existingReturnData.status === 'Rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-900 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-red-800 uppercase">
                  <AlertCircle size={16} />
                  <span>Yêu cầu đổi trả bị từ chối</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  Ghi chú từ Admin: {existingReturnData.adminNote || 'Không đủ điều kiện đổi trả theo quy định.'}
                </p>
              </div>
            )}

            {/* THÔNG TIN SẢN PHẨM KHÁCH ĐÃ CHỌN TRẢ */}
            <div className="space-y-2">
              <h4 className="font-black uppercase text-gray-800 tracking-wider text-[11px]">
                Sản phẩm bạn đã chọn đổi trả:
              </h4>
              <div className="space-y-2">
                {(existingReturnData.returnItems || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-xs">
                    <p className="font-black text-gray-900">{item.productName}</p>
                    <p className="text-gray-600 font-medium">Lý do khiếu nại: <span className="text-purple-700 font-bold">{item.reason}</span></p>
                    {item.proofImages && item.proofImages.length > 0 && (
                      <div className="flex gap-2 items-center pt-1">
                        <span className="text-[10px] font-bold text-gray-500">Ảnh minh chứng:</span>
                        {item.proofImages.map((img, i) => (
                          <img key={i} src={img} alt="Minh chứng" className="w-10 h-10 object-cover rounded border border-gray-300" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION: CHỈ CÓ NÚT ĐÓNG */}
            <div className="flex items-center justify-end pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition cursor-pointer border border-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : mode === 'user' ? (
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-gray-700 tracking-wider">
                1. Chọn sản phẩm cần đổi trả <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {items.map(item => {
                  // Khai báo biến/hằng số: itemId - Dùng trong logic xử lý của component
                  const itemId = item.id || item.Id || item.orderItemId;
                  // Khai báo biến/hằng số: isChecked - Dùng trong logic xử lý của component
                  const isChecked = !!selectedItems[itemId];

                  return (
                    <div
                      key={itemId}
                      className={`p-3.5 rounded-xl border transition-all relative ${isChecked ? 'bg-purple-50/40 border-purple-300' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(itemId)}
                            className="mt-1 w-4 h-4 text-purple-600 rounded cursor-pointer"
                          />
                          <div className="flex-1 space-y-1 text-xs">
                            <p className="font-bold text-gray-900">{item.productName || item.ProductName || 'Sản phẩm'}</p>
                            <p className="text-gray-500 font-medium">
                              Số lượng mua: <span className="font-black text-gray-800">{item.quantity || item.Quantity || 1}</span> | Giá mua: <span className="font-black text-red-600">{(item.priceAtPurchase ?? item.PriceAtPurchase ?? item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? item.productVariant?.price ?? item.ProductVariant?.price ?? 0).toLocaleString('vi-VN')}₫</span>
                            </p>
                          </div>
                        </div>
                      </div>

                          {/* Chọn lý do nếu sản phẩm được tích */}
                          {isChecked && (
                            <div className="pt-2 space-y-2">
                              <label className="block text-[11px] font-bold text-gray-700">Lý do đổi trả sản phẩm này:</label>
                              <select
                                value={itemReasons[itemId] || ''}
                                onChange={(e) => handleReasonChange(itemId, e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold outline-none focus:border-purple-500"
                              >
                                <option value="Sản phẩm lỗi kỹ thuật / Không hoạt động">Sản phẩm bị lỗi kỹ thuật / Không hoạt động</option>
                                <option value="Giao sai màu sắc / dung lượng / thông số">Giao sai màu sắc / dung lượng / thông số</option>
                                <option value="Sản phẩm bị trầy xước / hư hỏng vận chuyển">Sản phẩm bị trầy xước / hư hỏng do vận chuyển</option>
                                <option value="Không vừa ý / Muốn đổi sang dòng khác">Không vừa ý / Muốn đổi sang dòng khác</option>
                              </select>

                              {/* Tải ảnh minh chứng */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Ảnh minh chứng (nếu có):
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {(itemImages[itemId] || []).map((imgUrl, imgIdx) => (
                                    <div key={imgIdx} className="relative w-12 h-12 rounded-lg border overflow-hidden group">
                                      <img src={imgUrl} alt="minh chứng" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImage(itemId, imgIdx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="w-12 h-12 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-600 cursor-pointer transition">
                                    <Upload size={14} />
                                    <span className="text-[9px] font-bold mt-0.5">Tải ảnh</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => handleImageUpload(itemId, e)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                  );
                })}
              </div>
            </div>

            {/* Ghi chú chung */}
            <div>
              <label className="block text-xs font-black uppercase text-gray-700 tracking-wider mb-1">
                2. Ghi chú thêm cho bộ phận CSKH
              </label>
              <textarea
                rows="2"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="Nhập chi tiết thông tin yêu cầu của bạn..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Thông báo thành công */}
            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer border border-gray-250"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer border-0 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Đổi Trả'}</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* ================= GIAO DIỆN ADMIN (MODE = ADMIN) ================= */}
        {mode === 'admin' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-purple-900 uppercase">Yêu cầu Đổi trả từ Khách hàng</span>
                <span className="px-2.5 py-0.5 bg-purple-200 text-purple-800 rounded-full font-bold text-[10px]">
                  {existingReturnData ? existingReturnData.status : 'Chờ xử lý'}
                </span>
              </div>
              {(() => {
                const customerName = order.customer || order.receiverName || order.ReceiverName || order.fullName || 'Khách hàng';
                const customerPhone = order.phone || order.receiverPhone || order.ReceiverPhone || '';
                const orderTotal = order.amount || order.totalPrice || order.TotalPrice || 0;
                const refundAmount = existingReturnData?.totalRefund || orderTotal;

                return (
                  <>
                    <p className="text-gray-700 font-bold">
                      Khách hàng: <span className="text-gray-900 font-black">{customerName}</span> {customerPhone ? `(${customerPhone})` : ''}
                    </p>
                    <p className="text-gray-700 font-bold">
                      Số tiền cần hoàn trả: <span className="text-red-600 font-black">{refundAmount.toLocaleString('vi-VN')}₫</span> (Tổng giá trị đơn: {orderTotal.toLocaleString('vi-VN')}₫)
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Sản phẩm khiếu nại */}
            <div className="space-y-2">
              <h4 className="font-black uppercase text-gray-800 tracking-wider text-[11px]">
                Chi tiết sản phẩm khách muốn đổi trả:
              </h4>

              {existingReturnData && existingReturnData.returnItems ? (
                <div className="space-y-2">
                  {existingReturnData.returnItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      <p className="font-black text-gray-900">{item.productName}</p>
                      <p className="text-gray-600 font-medium">Lý do: <span className="text-purple-700 font-bold">{item.reason}</span></p>
                      {item.proofImages && item.proofImages.length > 0 && (
                        <div className="flex gap-2 items-center pt-1">
                          <span className="text-[10px] font-bold text-gray-500">Ảnh minh chứng:</span>
                          {item.proofImages.map((img, i) => (
                            <img key={i} src={img} alt="Bằng chứng" className="w-10 h-10 object-cover rounded border border-gray-300" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id || item.Id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="font-black text-gray-900">{item.productName || item.ProductName}</p>
                      <p className="text-gray-600 font-medium">Số lượng: {item.quantity || 1} | Giá: {(item.price || 0).toLocaleString('vi-VN')}₫</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin ghi chú */}
            <div>
              <label className="block font-black uppercase text-gray-800 tracking-wider text-[11px] mb-1">
                Ghi chú của Admin khi duyệt / từ chối
              </label>
              <textarea
                rows="2"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú phản hồi cho khách hàng..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Actions Admin */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={handleAdminReject}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Từ Chối Yêu Cầu
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer border border-gray-250"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleAdminApprove}
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition cursor-pointer border-0 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
                >
                  <span>{submitting ? 'Đang duyệt...' : 'Duyệt Đổi Trả & Hoàn Tiền'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
