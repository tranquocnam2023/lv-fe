/**
 * =========================================================================
 * 📌 COMPONENT DÙNG CHUNG: OrderReturnModal.jsx
 * - CHỨC NĂNG: Xử lý Đổi trả & Hoàn tiền cho cả 2 phía:
 *   + mode="user": Khách chọn sản phẩm trong đơn, nhập lý do & tải ảnh minh chứng.
 *   + mode="admin": Admin xem thông tin sản phẩm khiếu nại, ảnh minh chứng & bấm duyệt 1-Click (OrderStatusId = 7).
 * =========================================================================
 */
import React, { useState, useEffect } from 'react';
import { RotateCcw, ShieldAlert, CheckCircle2, X, Upload, Image as ImageIcon, AlertCircle, Clock } from 'lucide-react';
import { orderService } from '../services/orderService';

export default function OrderReturnModal({ isOpen, onClose, order, mode = 'user', onSuccess }) {
  // State phía User
  const [selectedItems, setSelectedItems] = useState({});
  const [itemReasons, setItemReasons] = useState({});
  const [itemImages, setItemImages] = useState({});
  const [generalNote, setGeneralNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // State phía Admin
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (order && order.items) {
      const initialSelected = {};
      const initialReasons = {};
      const initialImages = {};

      order.items.forEach(item => {
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

  const orderId = order.id || order.Id;
  const items = order.items || [];

  // Tính hạn đổi trả 7 ngày
  const getReturnDeadline = (createdDate) => {
    const d = new Date(createdDate || Date.now());
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 8);
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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

    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm bạn muốn đổi trả.');
      return;
    }

    setSubmitting(true);

    try {
      const returnPayload = {
        returnRequestId: `REQ-${orderId}-${Date.now()}`,
        orderId: orderId,
        userId: order.userId || order.UserId,
        status: 'Pending',
        totalRefundAmount: order.totalPrice || order.TotalPrice,
        createdAt: new Date().toISOString(),
        returnItems: selectedIds.map(itemId => {
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

      const existingReqs = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
      existingReqs[orderId] = returnPayload;
      localStorage.setItem('PROJECT_RETURN_REQUESTS', JSON.stringify(existingReqs));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('return_request_updated'));

      setSuccessMsg('Đã gửi yêu cầu đổi trả thành công! Đang chờ Admin phê duyệt.');
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
  const handleAdminApprove = async () => {
    setSubmitting(true);
    try {
      try {
        await orderService.approveReturnRequest(orderId, adminNote);
      } catch {
        await orderService.updateStatus(orderId, 'refunded');
      }

      const existingReqs = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
      if (existingReqs[orderId]) {
        existingReqs[orderId].status = 'Approved';
        existingReqs[orderId].adminNote = adminNote || 'Đã phê duyệt hoàn tiền';
        localStorage.setItem('PROJECT_RETURN_REQUESTS', JSON.stringify(existingReqs));
      }

      // Lưu log kiểm toán
      try {
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
      alert('Không thể cập nhật trạng thái hoàn tiền. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  // Admin từ chối yêu cầu
  const handleAdminReject = async () => {
    try {
      await orderService.rejectReturnRequest(orderId, adminNote);
    } catch {
      // Fallback local
    }

    const existingReqs = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
    if (existingReqs[orderId]) {
      existingReqs[orderId].status = 'Rejected';
      existingReqs[orderId].adminNote = adminNote || 'Từ chối yêu cầu đổi trả';
      localStorage.setItem('PROJECT_RETURN_REQUESTS', JSON.stringify(existingReqs));
    }

    // Lưu log kiểm toán từ chối
    try {
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
    onClose();
    if (onSuccess) onSuccess();
  };

  // Đọc dữ liệu yêu cầu đổi trả đã lưu (nếu có)
  const savedRequests = JSON.parse(localStorage.getItem('PROJECT_RETURN_REQUESTS') || '{}');
  const existingReturnData = savedRequests[orderId];

  // Kiểm tra đã hết thời hạn 7 ngày chưa (Ngày tạo đơn + 7 ngày)
  const isExpired = (() => {
    if (!order?.createdAt) return false;
    const deadline = new Date(order.createdAt);
    deadline.setDate(deadline.getDate() + 7);
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

        {/* Thông báo chính sách 7 ngày */}
        <div className={`p-3.5 border rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-2xs ${
          isExpired ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50/80 border-blue-200 text-blue-900'
        }`}>
          <ShieldAlert size={18} className={isExpired ? 'text-red-600 shrink-0' : 'text-blue-600 shrink-0'} />
          <span>
            Chính sách đổi trả 1 đổi 1 trong <strong>7 ngày</strong> (Thời hạn đến ngày <strong>{getReturnDeadline(order.createdAt)}</strong>).
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
                Rất tiếc, đơn hàng <strong>#PS{orderId}</strong> của quý khách đã <strong>vượt quá thời hạn 7 ngày đổi trả</strong> (Hạn chót là ngày <strong>{getReturnDeadline(order.createdAt)}</strong>).
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-red-150 text-[11px] text-red-800 space-y-1">
                <p className="font-bold">⚠️ Quy định áp dụng chính sách đổi trả 1 đổi 1:</p>
                <p>• Yêu cầu đổi trả chỉ có hiệu lực trong vòng <strong>7 ngày</strong> kể từ khi đặt/giao hàng thành công.</p>
                <p>• Nếu sản phẩm phát sinh sự cố kỹ thuật sau 7 ngày, quý khách vui lòng liên hệ Trung tâm bảo hành chính hãng hoặc hotline CSKH để được hỗ trợ.</p>
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
                  const itemId = item.id || item.Id || item.orderItemId;
                  const isChecked = !!selectedItems[itemId];

                  return (
                    <div
                      key={itemId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isChecked ? 'bg-purple-50/40 border-purple-300' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleItem(itemId)}
                          className="mt-1 w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                        <div className="flex-1 space-y-1 text-xs">
                          <p className="font-bold text-gray-900">{item.productName || item.ProductName || 'Sản phẩm'}</p>
                          <p className="text-gray-500 font-medium">
                            Số lượng mua: <span className="font-black text-gray-800">{item.quantity || item.Quantity || 1}</span> | Giá mua: <span className="font-black text-red-600">{(item.price || item.Price || 0).toLocaleString('vi-VN')}₫</span>
                          </p>

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
                      </div>
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
              <p className="text-gray-700 font-bold">
                Khách hàng: <span className="text-gray-900 font-black">{order.receiverName || 'Khách hàng'}</span> ({order.receiverPhone})
              </p>
              <p className="text-gray-700 font-bold">
                Tổng tiền đơn hàng: <span className="text-red-600 font-black">{(order.totalPrice || 0).toLocaleString('vi-VN')}₫</span>
              </p>
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
