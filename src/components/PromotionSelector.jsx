import React, { useState, useEffect } from 'react';
import { Tag, ChevronDown, ChevronUp, X, CheckCircle2, AlertCircle, Gift } from 'lucide-react';
import { promotionService } from '../services/promotionService';

export default function PromotionSelector({ subTotal, onApplyPromotion }) {
  const [isOpen, setIsOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [usedCouponCodes, setUsedCouponCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Trạng thái xác thực mã
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLoggedIn = !!localStorage.getItem('token');

  // Tải danh sách mã và lịch sử sử dụng
  useEffect(() => {
    if (isOpen || isModalOpen) {
      fetchPromotionsData();
    }
  }, [isOpen, isModalOpen]);

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

  // Xác thực mã khuyến mãi
  const validateCoupon = (code, list = coupons, usages = usedCouponCodes) => {
    const uppercaseCode = code.trim().toUpperCase();
    
    if (!uppercaseCode) {
      setValidationError('');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    // 1. Tìm coupon trong danh sách hoạt động
    const coupon = list.find(c => c.code.toUpperCase() === uppercaseCode);
    if (!coupon) {
      setValidationError('Mã giảm giá không tồn tại hoặc đã bị khóa.');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    // 2. Kiểm tra thời hạn sử dụng
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    if (now < startDate || now > endDate) {
      setValidationError('Mã giảm giá đã hết hạn hoặc chưa tới thời gian sử dụng.');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    // 3. Kiểm tra xem user đã sử dụng chưa
    if (usages.includes(uppercaseCode)) {
      setValidationError('Bạn đã sử dụng mã giảm giá này rồi.');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    // 4. Kiểm tra giới hạn số lượt sử dụng
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      setValidationError('Mã giảm giá này đã hết lượt sử dụng.');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    // 5. Tính số tiền giảm
    let discountAmount = 0;
    if (coupon.discountType.toUpperCase() === 'PERCENTAGE') {
      discountAmount = subTotal * (coupon.discountValue / 100);
    } else if (coupon.discountType.toUpperCase() === 'FIXED_AMOUNT') {
      discountAmount = coupon.discountValue;
    }

    // Giới hạn giảm tối đa bằng subtotal
    if (discountAmount > subTotal) {
      discountAmount = subTotal;
    }

    setValidationError('');
    setSuccessMessage(`Áp dụng thành công! Giảm -${discountAmount.toLocaleString('vi-VN')}₫`);
    onApplyPromotion(coupon.code, discountAmount);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPromoInput(value);
    validateCoupon(value);
  };

  const handleClearInput = () => {
    setPromoInput('');
    validateCoupon('');
  };

  const handleSelectCoupon = (coupon) => {
    setPromoInput(coupon.code);
    validateCoupon(coupon.code);
    setIsModalOpen(false);
  };

  // Chia mã khuyến mãi thành: Đặc quyền (1-2 mã đầu tiên nếu đã đăng nhập) và Công khai
  const privilegeCoupons = isLoggedIn && coupons.length > 0 ? coupons.slice(0, 1) : [];
  const publicCoupons = isLoggedIn && coupons.length > 0 ? coupons.slice(1) : coupons;

  return (
    <div className="w-full bg-white border border-gray-100 rounded-md p-6 space-y-4">
      {/* Accordion Dòng liên kết chữ mờ mượt mà kiểu TGDĐ */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm font-bold focus:outline-none"
        >
          <Tag size={16} className="text-gray-400 hover:text-blue-600 transition-colors" />
          <span>Bạn có mã giảm giá?</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Hiệu ứng accordion trượt mượt mà */}
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="pt-2 space-y-3">
          <div className="flex gap-3 items-center">
            {/* Ô nhập mã giảm giá */}
            <div className="relative flex-1">
              <input
                type="text"
                value={promoInput}
                onChange={handleInputChange}
                placeholder="Nhập mã giảm giá..."
                className={`w-full bg-gray-50 border-2 rounded-md pl-5 pr-10 py-3 focus:outline-none focus:ring-4 transition-all font-bold text-sm text-gray-800 placeholder:text-gray-400 ${
                  validationError
                    ? 'border-red-500 focus:ring-red-500/10'
                    : successMessage
                    ? 'border-green-500 focus:ring-green-500/10'
                    : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              />
              {/* Nút xóa nhanh (Dấu X) */}
              {promoInput && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200/60 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Nút Chọn mã */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-black rounded-md text-xs transition-colors border border-blue-100 shrink-0"
            >
              Chọn mã
            </button>
          </div>

          {/* Phản hồi tức thì */}
          {validationError && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold pl-1 animate-in fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold pl-1 animate-in fade-in">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Chọn mã giảm giá */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-md rounded-md flex flex-col relative max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <Gift size={20} className="text-blue-500" />
                Mã giảm giá của bạn
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal - Scrollable List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar bg-gray-50/50">
              {isLoading ? (
                <div className="text-center py-10 font-bold text-gray-400 text-sm">
                  Đang tải danh sách mã giảm giá...
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="font-bold text-gray-500 text-sm">Không có mã giảm giá nào khả dụng.</p>
                  <p className="text-[11px] text-gray-400">Vui lòng quay lại sau hoặc tham gia các sự kiện của shop để nhận mã.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* PHẦN 1: MÃ ĐẶC QUYỀN (Nếu có) */}
                  {privilegeCoupons.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-amber-600 tracking-wider uppercase pl-1 flex items-center gap-1.5">
                        👑 Đặc quyền hạng thành viên
                      </h3>
                      {privilegeCoupons.map((coupon) => (
                        <VoucherCard 
                          key={coupon.id}
                          coupon={coupon}
                          isUsed={usedCouponCodes.includes(coupon.code.toUpperCase())}
                          onApply={handleSelectCoupon}
                          isVIP={true}
                        />
                      ))}
                    </div>
                  )}

                  {/* PHẦN 2: MÃ CÔNG KHAI KHÁC */}
                  <div className="space-y-3">
                    {privilegeCoupons.length > 0 && (
                      <h3 className="text-xs font-black text-gray-400 tracking-wider uppercase pl-1">
                        🎁 Mã giảm giá công khai khác
                      </h3>
                    )}
                    {publicCoupons.length > 0 ? (
                      publicCoupons.map((coupon) => (
                        <VoucherCard 
                          key={coupon.id}
                          coupon={coupon}
                          isUsed={usedCouponCodes.includes(coupon.code.toUpperCase())}
                          onApply={handleSelectCoupon}
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

            {/* Footer Modal */}
            <div className="border-t border-gray-100 px-6 py-4 shrink-0 bg-gray-50 text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ưu tiên áp dụng mã có giá trị giảm cao nhất
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Thẻ voucher kiểu TGDĐ bo góc, khoét lỗm răng cưa ở mép mượt mà
function VoucherCard({ coupon, isUsed, onApply, isVIP }) {
  const endDate = new Date(coupon.endDate);
  const formattedDate = endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const discountDesc = coupon.discountType.toUpperCase() === 'PERCENTAGE'
    ? `Giảm ${coupon.discountValue}% trên tổng đơn hàng`
    : `Giảm trực tiếp ${coupon.discountValue.toLocaleString('vi-VN')}₫`;

  return (
    <div 
      className={`relative flex items-stretch bg-white border rounded-md overflow-hidden shadow-sm transition-all duration-200 ${
        isUsed 
          ? 'opacity-60 cursor-not-allowed select-none bg-gray-100/50 border-gray-100' 
          : isVIP 
          ? 'border-amber-200 hover:border-amber-400 hover:scale-[1.02] hover:shadow-md'
          : 'border-gray-100 hover:border-blue-200 hover:scale-[1.02] hover:shadow-md'
      }`}
    >
      {/* Mép trái răng cưa & Background màu */}
      <div className={`w-20 flex flex-col items-center justify-center text-white shrink-0 relative ${
        isUsed 
          ? 'bg-gray-400' 
          : isVIP 
          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
          : 'bg-gradient-to-br from-blue-500 to-blue-600'
      }`}>
        <Gift size={22} className={isVIP ? 'animate-bounce duration-1000' : ''} />
        <span className="text-[9px] font-black uppercase mt-1 tracking-wider">
          {isVIP ? 'Đặc quyền' : 'Voucher'}
        </span>
        
        {/* Hiệu ứng khuyết lõm hình tròn ở biên (punch hole ticket effect) */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full border-l border-gray-200 z-10"></div>
      </div>

      {/* Thông tin Voucher ở bên phải */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-2.5">
        <div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className={`font-black text-xs px-2.5 py-0.5 rounded-md border ${
              isUsed 
                ? 'bg-gray-100 text-gray-500 border-gray-200' 
                : isVIP
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {coupon.code}
            </span>
            {isUsed && (
              <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Đã sử dụng
              </span>
            )}
          </div>
          <p className="font-bold text-gray-800 text-xs mt-2 leading-tight">{discountDesc}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-1">Hạn dùng: {formattedDate}</p>
        </div>

        {!isUsed && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onApply(coupon)}
              className={`px-4 py-1.5 text-white text-[11px] font-black rounded-md transition-all shadow-md ${
                isVIP 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-100'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
