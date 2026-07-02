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
  finalTotalPay,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
  handleCheckoutSubmit
}) {
  const userPoints = currentUser?.rewardPoints || 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Voucher discount selector */}
      <div className="bg-white rounded-md border border-gray-100 p-4">
        <PromotionSelector
          subTotal={cartTotal}
          onApplyPromotion={onApplyPromotion}
        />
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hình thức thanh toán</h3>
        <div className="space-y-2">

          {/* Stripe */}
          <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${
            paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={paymentMethod === 'stripe'}
              onChange={() => setPaymentMethod('stripe')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-800">Thanh toán qua cổng Stripe</p>
              <p className="text-[10px] text-gray-400">Hỗ trợ thẻ quốc tế Visa, Mastercard, JCB</p>
            </div>
            <CreditCard size={16} className="text-gray-400" />
          </label>

          {/* MoMo */}
          <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${
            paymentMethod === 'momo' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="momo"
              checked={paymentMethod === 'momo'}
              onChange={() => setPaymentMethod('momo')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-800">Thanh toán qua ví điện tử MoMo</p>
              <p className="text-[10px] text-gray-400">Quét mã QR thanh toán nhanh chóng bằng ví MoMo</p>
            </div>
            <span className="w-6 h-6 bg-[#A50064] text-white text-[8px] font-black rounded flex items-center justify-center select-none shrink-0">MoMo</span>
          </label>

          {/* Bank transfer */}
          <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${
            paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={() => setPaymentMethod('transfer')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-800">Chuyển khoản ngân hàng trực tuyến</p>
              <p className="text-[10px] text-gray-400">Đăng ký duyệt nhanh, giảm thêm 100,000₫</p>
            </div>
            <CreditCard size={16} className="text-gray-400" />
          </label>

          {/* COD (requires login) */}
          <label className={`flex items-center gap-3 p-3 border rounded-md transition select-none ${
            !isLoggedIn
              ? 'opacity-50 bg-gray-50 border-gray-100 cursor-not-allowed'
              : paymentMethod === 'cod'
              ? 'border-blue-500 bg-blue-50/20 cursor-pointer'
              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              disabled={!isLoggedIn}
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-800">Thanh toán tiền mặt khi nhận hàng (COD)</p>
              <p className="text-[10px] text-gray-400">Chỉ áp dụng cho thành viên PhoneShop VIP</p>
            </div>
            <Truck size={16} className="text-gray-400" />
          </label>

          {!isLoggedIn && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex gap-2 text-amber-800 text-[10px] font-medium leading-relaxed">
              <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p>
                Hình thức <strong>Thanh toán tiền mặt (COD)</strong> bị khóa vì quý khách đang đặt dưới dạng khách vãng lai. Vui lòng đăng ký/đăng nhập VIP để kích hoạt.
              </p>
            </div>
          )}
        </div>

        {/* Bank Transfer QR details */}
        {paymentMethod === 'transfer' && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
            <p className="font-black text-blue-600 uppercase tracking-widest text-[9px]">Thông tin chuyển khoản nhanh</p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full space-y-1.5 font-semibold text-gray-700">
                <p className="flex justify-between border-b border-gray-200 pb-1">Ngân hàng: <span className="font-bold text-gray-900">MB BANK (Quân Đội)</span></p>
                <p className="flex justify-between border-b border-gray-200 pb-1">Chủ tài khoản: <span className="font-bold text-gray-900 uppercase">PHONESHOP OFFICIAL</span></p>
                <p className="flex justify-between border-b border-gray-200 pb-1">Số tài khoản: <span className="font-bold text-blue-600 tracking-wider">098 7654 3210</span></p>
                <p className="flex justify-between pt-1">Số tiền chuyển: <span className="font-black text-red-600 text-sm">{(finalTotalPay).toLocaleString('vi-VN')}₫</span></p>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 bg-white border border-gray-200 rounded-md shrink-0">
                <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-gray-300">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zM3 15h6v6H3v-6zm1 1v4h4v-4H4zm1 1h2v2H5v-2zM15 3h6v6h-6V3zm1 1v4h4V4h-4zm1 1h2v2h-2V5zM15 15h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2zm2 0h2v2h-2v-2zM10 3h4v2h-4V3zm0 4h4v2h-4V7zm0 8h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" /></svg>
                </div>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">Mã QR</span>
              </div>
            </div>
          </div>
        )}
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
            <span className="text-gray-900 font-bold">{cartTotal.toLocaleString('vi-VN')}₫</span>
          </div>
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
          <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
            <span>Điểm tích lũy Quà Tặng VIP</span>
            <span className="font-bold text-gray-700">{(Math.floor(finalTotalPay * 0.002)).toLocaleString('vi-VN')} điểm</span>
          </div>
        </div>

        {/* Submit Button */}
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
