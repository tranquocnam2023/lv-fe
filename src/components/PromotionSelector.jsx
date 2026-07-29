// COMPONENT CHỌN MÃ GIẢM GIÁ KIỂU SHOPEE (PROMOTION SELECTOR SHOPEE STYLE)
// Chức năng: Hiển thị trực tiếp 1 mã giảm giá tối ưu ra màn hình, hỗ trợ đổi mã qua Modal và gỡ bỏ cơ chế accordion rút gọn.
import React, { useState, useEffect } from 'react';
import { Tag, X, CheckCircle2, AlertCircle, Gift } from 'lucide-react';
import { promotionService } from '../services/promotionService';

export default function PromotionSelector({ subTotal, onApplyPromotion }) {
  const [promoInput, setPromoInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [usedCouponCodes, setUsedCouponCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Trạng thái xác thực mã
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLoggedIn = !!localStorage.getItem('token');

  // Tải danh sách mã và lịch sử sử dụng khi component mount
  useEffect(() => {
    fetchPromotionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự động kiểm tra lại mã đã áp dụng khi giỏ hàng thay đổi tổng tiền (subTotal)
  useEffect(() => {
    if (promoInput) {
      validateCoupon(promoInput);
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
  const validateCoupon = async (code) => {
    const uppercaseCode = code.trim().toUpperCase();
    
    if (!uppercaseCode) {
      setValidationError('');
      setSuccessMessage('');
      onApplyPromotion('', 0);
      return;
    }

    try {
      const res = await promotionService.validate(uppercaseCode, subTotal);
      if (res && res.code) {
        const discountAmount = res.discountAmount || 0;
        setValidationError('');
        setSuccessMessage(`Áp dụng thành công! Giảm -${discountAmount.toLocaleString('vi-VN')}₫`);
        onApplyPromotion(res.code, discountAmount);
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

  // Xử lý thay đổi ký tự nhập
  const handleInputChange = (e) => {
    const value = e.target.value;
    setPromoInput(value);
  };

  // Xóa mã giảm giá đang chọn
  const handleClearInput = () => {
    setPromoInput('');
    validateCoupon('');
  };

  // Áp dụng mã khi click chọn trong danh sách Modal
  const handleSelectCoupon = (coupon) => {
    setPromoInput(coupon.code);
    validateCoupon(coupon.code);
    setIsModalOpen(false);
  };

  // ─── LỌC SẠCH MÃ HẾT HẠN SỬ DỤNG HOẶC CHƯA BẮT ĐẦU HOẶC BỊ TẮT ACTIVE ───
  const now = new Date();
  const activeCoupons = coupons.filter(coupon => {
    // 1. Kiểm tra xem mã đã hết hạn chưa (So sánh ngày kết thúc endDate với thời gian hiện tại)
    const isExpired = new Date(coupon.endDate) < now;
    // 2. Kiểm tra xem mã đã tới ngày bắt đầu sử dụng hay chưa (startDate)
    const isStarted = new Date(coupon.startDate) <= now;
    // Chỉ giữ lại mã đang hoạt động (isActive = true), đã bắt đầu và KHÔNG bị hết hạn sử dụng
    return coupon.isActive && isStarted && !isExpired;
  });

  // Phân chia danh mục mã ưu tiên từ danh sách mã hợp lệ đã được lọc ở trên
  const privilegeCoupons = isLoggedIn && activeCoupons.length > 0 ? activeCoupons.slice(0, 1) : [];
  const publicCoupons = isLoggedIn && activeCoupons.length > 0 ? activeCoupons.slice(1) : activeCoupons;

  // TÌM MÃ GIẢM GIÁ GỢI Ý TỐT NHẤT (Chưa dùng & đủ điều kiện đơn hàng tối thiểu) từ danh sách mã còn hạn dùng
  const recommendedCoupon = activeCoupons.find(coupon => {
    const codeUpper = coupon.code.toUpperCase();
    // Mã này khách hàng hiện tại chưa sử dụng trong lịch sử mua hàng
    const isUsed = usedCouponCodes.includes(codeUpper);
    // Tổng số tiền giỏ hàng phải đạt giá trị tối thiểu quy định của Voucher
    const meetsMinOrder = !coupon.minOrderAmount || subTotal >= coupon.minOrderAmount;
    return !isUsed && meetsMinOrder;
  });

  return (
    <div className="w-full bg-white border border-gray-100 rounded-md p-6 space-y-4">
      
      {/* HIỂN THỊ HỘP VOUCHER TRỰC QUAN NGOÀI MÀN HÌNH (KIỂU SHOPEE) */}
      <div className="flex items-center justify-between border border-blue-100 bg-blue-50/20 p-4 rounded-md flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Tag size={18} className="text-blue-600 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Voucher của Shop</span>
            
            {successMessage ? (
              // 1. Trường hợp: Đã áp dụng mã thành công
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-500 text-white font-black text-[11px] px-2 py-0.5 rounded border border-blue-600 uppercase">
                  {promoInput.toUpperCase()}
                </span>
                <span className="text-xs font-extrabold text-green-600">
                  {successMessage.replace('Áp dụng thành công! ', '')}
                </span>
              </div>
            ) : recommendedCoupon ? (
              // 2. Trường hợp: Chưa áp dụng nhưng hệ thống tự tìm thấy mã gợi ý tốt nhất
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-orange-500 text-white font-black text-[11px] px-2 py-0.5 rounded border border-orange-600 uppercase animate-pulse">
                  {recommendedCoupon.code}
                </span>
                <span className="text-xs font-bold text-gray-700">
                  Giảm {recommendedCoupon.discountType === 'Percentage' ? `${recommendedCoupon.discountValue}%` : `${recommendedCoupon.discountValue.toLocaleString('vi-VN')}₫`}
                </span>
              </div>
            ) : (
              // 3. Trường hợp: Không có mã nào khả dụng
              <span className="text-xs font-bold text-gray-500 mt-1">
                Chọn hoặc nhập mã giảm giá
              </span>
            )}
          </div>
        </div>

        {/* NÚT THAO TÁC HÀNH ĐỘNG */}
        <div className="flex items-center gap-2">
          {/* Nút áp dụng nhanh mã gợi ý ngoài màn hình */}
          {!successMessage && recommendedCoupon && (
            <button
              type="button"
              onClick={() => {
                setPromoInput(recommendedCoupon.code);
                validateCoupon(recommendedCoupon.code);
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded text-xs transition-colors shadow-sm cursor-pointer"
            >
              Áp dụng nhanh
            </button>
          )}

          {/* Nút hủy bỏ mã giảm giá đang dùng */}
          {successMessage && (
            <button
              type="button"
              onClick={handleClearInput}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold rounded text-xs transition-colors border border-gray-200 cursor-pointer"
            >
              Hủy mã
            </button>
          )}

          {/* Nút mở Modal chọn danh sách mã giảm giá */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded text-xs transition-colors border border-blue-500 shrink-0 shadow-sm cursor-pointer"
          >
            {successMessage ? 'Thay đổi' : 'Chọn mã'}
          </button>
        </div>
      </div>

      {/* Hiển thị thông báo lỗi nếu thao tác lỗi ngoài màn hình */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs font-bold pl-1 animate-in fade-in">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* MODAL DANH SÁCH MÃ GIẢM GIÁ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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

            {/* Ô NHẬP MÃ THỦ CÔNG Ở ĐẦU MODAL (KIỂU SHOPEE) */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex gap-2 shrink-0 items-center">
              <input
                type="text"
                value={promoInput}
                onChange={handleInputChange}
                placeholder="Nhập mã giảm giá khác..."
                className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-md focus:border-blue-500 outline-none text-xs font-black uppercase text-gray-800 bg-gray-50 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => validateCoupon(promoInput)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-md transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            </div>

            {/* Body Modal - Danh sách Voucher cuộn */}
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
                  {/* Mã đặc quyền hạng thành viên */}
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

                  {/* Mã giảm giá công khai khác */}
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

// Sub-component: Thẻ voucher hiển thị trong Modal
function VoucherCard({ coupon, isUsed, onApply, isVIP }) {
  const endDate = new Date(coupon.endDate);
  const formattedDate = endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  let discountDesc = coupon.discountType.toUpperCase() === 'PERCENTAGE'
    ? `Giảm ${coupon.discountValue}% trên tổng đơn`
    : `Giảm trực tiếp ${coupon.discountValue.toLocaleString('vi-VN')}₫`;

  if (coupon.discountType.toUpperCase() === 'PERCENTAGE' && coupon.maxDiscountAmount) {
    discountDesc += ` (Tối đa ${coupon.maxDiscountAmount.toLocaleString('vi-VN')}₫)`;
  }

  const conditions = [];
  if (coupon.minOrderAmount) {
    conditions.push(`Đơn tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫`);
  }
  if (coupon.maxPerUser) {
    conditions.push(`Tối đa ${coupon.maxPerUser} lần/tài khoản`);
  }

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
        
        {/* Hiệu ứng khoét lõm răng cưa ở biên vé */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full border-l border-gray-200 z-10"></div>
      </div>

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
          {conditions.length > 0 && (
            <p className="text-[10px] font-semibold text-amber-600 mt-1">
              📌 {conditions.join(' • ')}
            </p>
          )}
          <p className="text-[10px] text-gray-400 font-medium mt-1">Hạn dùng: {formattedDate}</p>
        </div>

        {!isUsed && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onApply(coupon)}
              className={`px-4 py-1.5 text-white text-[11px] font-black rounded-md transition-all shadow-md cursor-pointer ${
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
