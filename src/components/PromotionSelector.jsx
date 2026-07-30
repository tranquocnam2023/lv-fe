// COMPONENT CHỌN MÃ GIẢM GIÁ PHONG CÁCH THẾ GIỚI DI ĐỘNG (PROMOTION SELECTOR TGDĐ STYLE)
// Chức năng: 
// 1. Giao diện ban đầu hiển thị rút gọn thành một dòng tóm tắt duy nhất: "Chọn hoặc nhập mã ➔"
// 2. Kích hoạt Modal pop-up khi bấm chọn.
// 3. Có ô nhập mã thủ công ở trên cùng Modal kèm nút Áp dụng.
// 4. Các card voucher được thiết kế dạng cuống vé cạnh trái, hiển thị điều kiện rõ ràng, kèm nút Checkbox tròn bên phải để tick chọn.
import React, { useState, useEffect } from 'react';
import { Tag, X, AlertCircle, Gift } from 'lucide-react';
import { promotionService } from '../services/promotionService';

export default function PromotionSelector({ subTotal, onApplyPromotion }) {
  const [promoInput, setPromoInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [usedCouponCodes, setUsedCouponCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Trạng thái nhập mã thủ công và thông báo lỗi/thành công trong Modal
  const [manualInputCode, setManualInputCode] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  
  // Trạng thái lưu mã được chọn tạm thời trong Modal trước khi nhấn "Đồng ý"
  const [tempSelectedCode, setTempSelectedCode] = useState('');

  // Trạng thái lỗi/thành công hiển thị ở màn hình chính
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLoggedIn = !!localStorage.getItem('token');

  // Tải danh sách mã khuyến mãi khi component mount
  useEffect(() => {
    fetchPromotionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự động kiểm tra lại mã đã áp dụng khi giỏ hàng thay đổi tổng tiền (subTotal)
  useEffect(() => {
    if (promoInput) {
      validateCoupon(promoInput, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTotal]);

  // Tự động ẩn/hiện header khi mở/đóng modal chọn mã giảm giá
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('promotion-modal-open');
    } else {
      document.body.classList.remove('promotion-modal-open');
    }
    return () => {
      document.body.classList.remove('promotion-modal-open');
    };
  }, [isModalOpen]);

  // HÀM TẢI DANH SÁCH MÃ GIẢM GIÁ TỪ SERVER
  const fetchPromotionsData = async () => {
    setIsLoading(true);
    try {
      const allPromos = await promotionService.getAll();
      setCoupons(Array.isArray(allPromos) ? allPromos : []);

      if (isLoggedIn) {
        const myUsages = await promotionService.getMyUsages();
        if (Array.isArray(myUsages)) {
          const usedCodes = myUsages.map(u => (u.promotionCode || '').toUpperCase());
          setUsedCouponCodes(usedCodes);
        }
      }
    } catch (err) {
      console.error('Lỗi tải thông tin khuyến mãi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // HÀM GỬI MÃ GIẢM GIÁ LÊN SERVER ĐỂ XÁC THỰC (VALIDATE)
  const validateCoupon = async (code, shouldCloseModal = true) => {
    const uppercaseCode = code.trim().toUpperCase();
    
    if (!uppercaseCode) {
      setValidationError('');
      setSuccessMessage('');
      setPromoInput('');
      setTempSelectedCode('');
      onApplyPromotion('', 0);
      return;
    }

    try {
      const res = await promotionService.validate(uppercaseCode, subTotal);
      if (res && res.code) {
        const discountAmount = res.discountAmount || 0;
        setValidationError('');
        setSuccessMessage(`Áp dụng thành công! Giảm -${discountAmount.toLocaleString('vi-VN')}₫`);
        setPromoInput(res.code);
        setTempSelectedCode(res.code);
        onApplyPromotion(res.code, discountAmount);
        if (shouldCloseModal) {
          setIsModalOpen(false);
        }
      } else {
        setValidationError('Mã giảm giá không hợp lệ.');
        setSuccessMessage('');
        onApplyPromotion('', 0);
      }
    } catch (err) {
      console.error('Lỗi xác thực mã giảm giá:', err);
      let errorMsg = 'Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng.';
      if (err.response && err.response.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || errorMsg);
      }
      setValidationError(errorMsg);
      setSuccessMessage('');
      onApplyPromotion('', 0);
    }
  };

  // HÀM XÁC THỰC MÃ THỦ CÔNG TRONG MODAL
  const handleApplyManualCode = async () => {
    const uppercaseCode = manualInputCode.trim().toUpperCase();
    if (!uppercaseCode) {
      setModalError('Vui lòng nhập mã giảm giá.');
      setModalSuccess('');
      return;
    }

    try {
      const res = await promotionService.validate(uppercaseCode, subTotal);
      if (res && res.code) {
        setModalError('');
        const discountAmount = res.discountAmount || 0;
        setModalSuccess(`Hợp lệ! Giảm -${discountAmount.toLocaleString('vi-VN')}₫`);
        setTempSelectedCode(res.code); // Tự động tick chọn mã vừa nhập thành công
      } else {
        setModalError('Mã không hợp lệ.');
        setModalSuccess('');
      }
    } catch (err) {
      let errorMsg = 'Mã không hợp lệ hoặc đã hết lượt dùng.';
      if (err.response && err.response.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || errorMsg);
      }
      setModalError(errorMsg);
      setModalSuccess('');
    }
  };

  // Hủy mã giảm giá đang dùng
  const handleClearInput = () => {
    setPromoInput('');
    setTempSelectedCode('');
    setManualInputCode('');
    validateCoupon('', false);
  };

  // Xác nhận lưu mã đã tick từ modal
  const handleConfirmSelection = () => {
    setPromoInput(tempSelectedCode);
    validateCoupon(tempSelectedCode, true);
  };

  // ─── LỌC SẠCH MÃ HẾT HẠN SỬ DỤNG HOẶC CHƯA BẮT ĐẦU HOẶC BỊ TẮT ACTIVE ───
  const now = new Date();
  const activeCoupons = coupons.filter(coupon => {
    const isExpired = new Date(coupon.endDate) < now;
    const isStarted = new Date(coupon.startDate) <= now;
    return coupon.isActive && isStarted && !isExpired;
  });

  // Phân chia danh mục mã ưu tiên từ danh sách mã hợp lệ
  const privilegeCoupons = isLoggedIn && activeCoupons.length > 0 ? activeCoupons.slice(0, 1) : [];
  const publicCoupons = isLoggedIn && activeCoupons.length > 0 ? activeCoupons.slice(1) : activeCoupons;

  return (
    <div className="w-full">
      
      {/* ── DÒNG TÓM TẮT BAN ĐẦU: Chọn hoặc nhập mã ➔ ── */}
      <div 
        onClick={() => {
          setIsModalOpen(true);
          setTempSelectedCode(promoInput); // Đồng bộ mã hiện tại vào modal
          setManualInputCode('');
          setModalError('');
          setModalSuccess('');
        }}
        className={`flex items-center justify-between p-3.5 bg-white border border-gray-250 rounded-lg hover:border-yellow-500 hover:shadow-sm cursor-pointer transition-all duration-200 select-none ${
          successMessage ? 'bg-yellow-50/10 border-yellow-300' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
            <Tag size={13} className="fill-current" />
          </div>
          
          <div className="flex flex-col text-left">
            {successMessage ? (
              <>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Mã giảm giá đã chọn</span>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-100 text-yellow-800 font-extrabold text-[11px] px-1.5 py-0.5 rounded border border-yellow-200 uppercase">
                    {promoInput.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-green-600">
                    {successMessage.replace('Áp dụng thành công! ', '')}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xs font-bold text-gray-700">
                Chọn hoặc nhập mã giảm giá
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-yellow-600 font-black text-sm">
          {successMessage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn mở modal
                handleClearInput();
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 font-extrabold mr-2"
            >
              Hủy mã
            </button>
          )}
          <span>➔</span>
        </div>
      </div>

      {/* Hiển thị lỗi ngoài màn hình chính nếu có */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold pl-1 mt-2 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ── MODAL DANH SÁCH MÃ GIẢM GIÁ ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-md rounded-lg flex flex-col relative max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Gift size={18} className="text-yellow-600" />
                Mã giảm giá của bạn
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ô NHẬP MÃ THỦ CÔNG Ở ĐẦU MODAL */}
            <div className="px-6 py-4 border-b border-gray-150 bg-white flex flex-col gap-1.5 shrink-0">
              <div className="flex gap-2 w-full items-center">
                <input
                  type="text"
                  value={manualInputCode}
                  onChange={(e) => setManualInputCode(e.target.value)}
                  placeholder="Nhập mã giảm giá khác..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-yellow-500 outline-none text-xs font-extrabold uppercase text-gray-800 bg-gray-50 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleApplyManualCode}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
              
              {/* Hiển thị lỗi/thành công trực tiếp trong modal khi nhập tay */}
              {modalError && (
                <p className="text-red-500 text-[11px] font-bold pl-1 mt-0.5 animate-in fade-in">
                  ❌ {modalError}
                </p>
              )}
              {modalSuccess && (
                <p className="text-green-600 text-[11px] font-bold pl-1 mt-0.5 animate-in fade-in">
                  ✓ {modalSuccess}
                </p>
              )}
            </div>

            {/* Body Modal - Danh sách Voucher cuộn */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50/50">
              {isLoading ? (
                <div className="text-center py-10 font-bold text-gray-400 text-sm">
                  Đang tải danh sách mã giảm giá...
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-white rounded-lg border border-gray-100 p-4">
                  <p className="font-bold text-gray-500 text-sm">Không có mã giảm giá nào khả dụng.</p>
                  <p className="text-[11px] text-gray-400">Vui lòng quay lại sau hoặc tham gia các sự kiện của shop để nhận mã.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Nhóm mã VIP thành viên */}
                  {privilegeCoupons.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-black text-yellow-600 tracking-wider uppercase pl-1 flex items-center gap-1.5">
                        👑 Đặc quyền hạng thành viên
                      </h3>
                      {privilegeCoupons.map((coupon) => (
                        <VoucherCard 
                          key={coupon.id}
                          coupon={coupon}
                          subTotal={subTotal}
                          isUsed={usedCouponCodes.includes(coupon.code.toUpperCase())}
                          isSelected={tempSelectedCode.toUpperCase() === coupon.code.toUpperCase()}
                          onSelect={(code) => setTempSelectedCode(tempSelectedCode === code ? '' : code)}
                          isVIP={true}
                        />
                      ))}
                    </div>
                  )}

                  {/* Nhóm mã công khai khác */}
                  <div className="space-y-3">
                    {privilegeCoupons.length > 0 && (
                      <h3 className="text-[11px] font-black text-gray-400 tracking-wider uppercase pl-1">
                        🎁 Mã giảm giá khác
                      </h3>
                    )}
                    {publicCoupons.length > 0 ? (
                      publicCoupons.map((coupon) => (
                        <VoucherCard 
                          key={coupon.id}
                          coupon={coupon}
                          subTotal={subTotal}
                          isUsed={usedCouponCodes.includes(coupon.code.toUpperCase())}
                          isSelected={tempSelectedCode.toUpperCase() === coupon.code.toUpperCase()}
                          onSelect={(code) => setTempSelectedCode(tempSelectedCode === code ? '' : code)}
                          isVIP={false}
                        />
                      ))
                    ) : (
                      privilegeCoupons.length === 0 && (
                        <div className="text-center py-5 font-bold text-gray-400 text-sm">
                          Không có mã công khai nào khả dụng.
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Confirmation Footer */}
            <div className="border-t border-gray-100 px-6 py-4 shrink-0 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setTempSelectedCode(''); // Bỏ chọn tạm thời
                  setModalError('');
                  setModalSuccess('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black rounded transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              
              <button
                type="button"
                onClick={handleConfirmSelection}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black rounded transition-colors cursor-pointer shadow-sm shadow-yellow-100"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        body.promotion-modal-open header {
          display: none !important;
        }
        body.promotion-modal-open .relative.z-30 {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

// Sub-component: Card Voucher thiết kế kiểu Cuống Vé TGDĐ
function VoucherCard({ coupon, isUsed, isSelected, onSelect, subTotal, isVIP }) {
  const endDate = new Date(coupon.endDate);
  const formattedDate = endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Tính toán thời hạn động
  // ── LOGIC HIỂN THỊ NGÀY / HẠN DÙNG: Tính toán hạn dùng dựa trên ngày kết thúc của Voucher ──
  const getExpiryStatus = () => {
    const end = new Date(coupon.endDate);
    const now = new Date();
    const diffMs = end - now;
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 3) {
      return `Hạn dùng: ${formattedDate}`;
    } else if (diffDays > 1) {
      return `Hết hạn sau ${diffDays} ngày`;
    } else {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      return `Hết hạn sau ${diffHours} giờ`;
    }
  };

  const expiryStatus = getExpiryStatus();

  let discountDesc = coupon.discountType.toUpperCase() === 'PERCENTAGE'
    ? `Giảm ${coupon.discountValue}% trên tổng đơn`
    : `Giảm trực tiếp ${coupon.discountValue.toLocaleString('vi-VN')}₫`;

  if (coupon.discountType.toUpperCase() === 'PERCENTAGE' && coupon.maxDiscountAmount) {
    discountDesc += ` (Tối đa ${coupon.maxDiscountAmount.toLocaleString('vi-VN')}₫)`;
  }

  // ── LOGIC SỐ LƯỢNG CÓ HẠN: Kiểm tra điều kiện áp dụng & số lượt sử dụng còn lại của voucher ──
  // 1. Kiểm tra đơn hàng tối thiểu
  const meetsMinOrder = !coupon.minOrderAmount || subTotal >= coupon.minOrderAmount;
  // 2. Kiểm tra giới hạn số lượng (usageLimit > 0 và số lượt đã dùng usedCount đạt tới giới hạn)
  const isSoldOut = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
  // 3. Voucher khả dụng khi chưa từng dùng, đủ tiền đơn tối thiểu và chưa bị hết lượt (isSoldOut)
  const isAvailable = !isUsed && meetsMinOrder && !isSoldOut;

  const conditions = [];
  if (coupon.minOrderAmount) {
    conditions.push(`Đơn tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫`);
  }
  if (coupon.maxPerUser) {
    conditions.push(`Tối đa ${coupon.maxPerUser} lần/tài khoản`);
  }

  return (
    <div 
      onClick={() => isAvailable && onSelect(coupon.code)}
      className={`relative flex items-stretch bg-white border rounded-lg shadow-sm transition-all duration-200 min-h-[105px] select-none ${
        !isAvailable 
          ? 'opacity-60 cursor-not-allowed bg-gray-50/50 border-gray-250' 
          : isSelected 
          ? 'border-yellow-500 bg-yellow-50/5 shadow-md cursor-pointer'
          : 'border-gray-200 hover:border-yellow-400 hover:shadow cursor-pointer'
      }`}
    >


      {/* Cạnh trái: Cuống vé (Ticket Stub) */}
      <div className={`w-[85px] border-r-2 border-dashed flex flex-col items-center justify-center shrink-0 relative ${
        !isAvailable 
          ? 'bg-gray-300 border-gray-200 text-gray-500' 
          : isVIP 
          ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-250 text-white'
          : 'bg-[#fed100] border-yellow-200 text-gray-850'
      }`}>
        <Gift size={20} className={isVIP ? 'animate-bounce duration-1000' : ''} />
        <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-center px-1">
          {isVIP ? 'Đặc quyền' : 'Voucher'}
        </span>
      </div>

      {/* Cạnh phải: Chi tiết ưu đãi & Checkbox */}
      <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-black text-[10px] px-2 py-0.5 rounded-md border ${
              !isAvailable 
                ? 'bg-gray-100 text-gray-400 border-gray-200' 
                : isSelected
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              {coupon.code}
            </span>
            {isUsed && (
              <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Đã dùng
              </span>
            )}
            {isSoldOut && (
              <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Hết lượt
              </span>
            )}
            {!meetsMinOrder && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Chưa đủ ĐK
              </span>
            )}
          </div>
          
          <p className="font-bold text-gray-800 text-xs mt-1.5 leading-tight">{discountDesc}</p>
          
          {conditions.length > 0 && (
            <p className="text-[10px] font-semibold text-gray-500">
              📌 {conditions.join(' • ')}
            </p>
          )}
          
          {/* HIỂN THỊ HẠN DÙNG (expiryStatus) VÀ DÒNG CHỮ SỐ LƯỢNG CÒN LẠI DỰA TRÊN GIỚI HẠN DÙNG (usageLimit) */}
          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold mt-1">
            <span>⏳ {expiryStatus}</span>
            {coupon.usageLimit > 0 && (
              <>
                <span>•</span>
                <span className="text-red-500 font-black">
                  ⚡ {isSoldOut ? 'Hết lượt dùng' : `Chỉ còn ${coupon.usageLimit - coupon.usedCount} lượt`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Nút Checkbox tròn bên phải */}
        {isAvailable && (
          <div className="shrink-0 pl-1">
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-yellow-500 border border-yellow-500 text-white' 
                  : 'bg-white border-2 border-gray-300'
              }`}
            >
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
