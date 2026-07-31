import React from 'react';
import { Gift, CreditCard, Truck, Info, ChevronRight } from 'lucide-react';
import PromotionSelector from '../../../components/PromotionSelector';

export default function CartSummaryPayment({
  isLoggedIn,
  currentUser,
  usePoints,
  setUsePoints,
  pointsDiscount,
  cartItems,
  cartTotal,
  appliedPromo,
  onApplyPromotion,
  discountAmount,
  shippingCarrier,
  shippingLoading,
  deliveryMethod,
  shippingFee,
  shippingEstimatedDays,
  shippingOptions,
  onSelectShippingOption,
  finalTotalPay,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
  handleCheckoutSubmit
}) {
  const userPoints = currentUser?.rewardPoints || 0;

  const cartSavings = cartItems.reduce(
    (total, item) => total + ((item.originalBasePrice || item.price) - item.price) * item.quantity,
    0
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Voucher discount selector */}
      <div className="bg-white rounded-md border border-gray-100 p-4">
        <PromotionSelector
          subTotal={cartTotal}
          onApplyPromotion={onApplyPromotion}
        />
      </div>

      {/* Total summary and checkout button */}
      <div className="bg-white rounded-md border border-gray-100 p-4 md:p-6 space-y-4">
        {isLoggedIn && currentUser && (
          <div className="flex items-center justify-between p-3.5 bg-yellow-50/50 border border-yellow-100/70 rounded-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-white select-none shrink-0">
                <Gift size={15} className="fill-current" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-gray-800">Dùng điểm Quà Tặng VIP</p>
                <p className="text-[10px] text-gray-400 font-bold">Điểm khả dụng: <span className="text-yellow-600 font-extrabold">{userPoints?.toLocaleString('vi-VN')}</span></p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>
        )}

        <div className="space-y-2 text-xs font-semibold text-gray-500 uppercase tracking-tighter">
          <div className="flex justify-between">
            <span>Tạm tính ({cartItems.length} sản phẩm)</span>
            <span className="text-gray-900 font-bold">{(cartTotal).toLocaleString('vi-VN')}₫</span>
          </div>
          {cartSavings > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Tiết kiệm (Combo/Giảm giá)</span>
              <span>-{cartSavings.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Mã giảm giá ({appliedPromo})</span>
              <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          {usePoints && pointsDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Quy đổi điểm VIP</span>
              <span>-{pointsDiscount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          <div className="flex justify-between text-gray-700">
            <span>Phí vận chuyển {shippingCarrier && `(${shippingCarrier})`}</span>
            <span>
              {shippingLoading ? (
                <span className="text-gray-400 italic">Đang tính...</span>
              ) : deliveryMethod === 'store' ? (
                <span className="text-green-600 font-bold">Miễn phí</span>
              ) : shippingFee > 0 ? (
                <span className="text-gray-900 font-bold">{shippingFee.toLocaleString('vi-VN')}₫</span>
              ) : (
                <span className="text-green-600 font-bold">Miễn phí</span>
              )}
            </span>
          </div>
          {deliveryMethod === 'ship' && shippingEstimatedDays && (
            <div className="flex justify-between text-[11px] text-gray-400 font-medium normal-case">
              <span>Thời gian giao hàng dự kiến</span>
              <span>{shippingEstimatedDays}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-dashed border-gray-100 items-center">
            <span className="text-xs font-black text-gray-900">Tổng tiền</span>
            <span className="text-lg font-black text-red-600 tracking-tight">{finalTotalPay.toLocaleString('vi-VN')}₫</span>
          </div>
          {/* LOGIC TÍNH ĐIỂM TÍCH LŨY QUÀ TẶNG VIP: 0.2% (0.002) trên tổng giá trị thanh toán thực tế (finalTotalPay * 0.002) */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <span>Điểm tích lũy Quà Tặng VIP</span>
            <span className="font-bold text-gray-700">{(Math.floor(finalTotalPay * 0.002)).toLocaleString('vi-VN')} điểm</span>
          </div>
        </div>
        {/* nút đặt hàng */}
        <button
          type="button"
          onClick={handleCheckoutSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-md font-black transition active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 group cursor-pointer border-0"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>ĐANG XỬ LÝ...</span>
            </>
          ) : (
            <>
              <span>Đặt hàng ngay</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-[9px] text-center text-gray-400 font-medium">
          Bằng cách đặt hàng, quý khách đồng ý với các Điều khoản & Chính sách giao nhận của PhoneShop.
        </p>
      </div>
    </div>
  );
}
