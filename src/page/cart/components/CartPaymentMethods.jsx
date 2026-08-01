import React from 'react';
import { CreditCard, Truck, Info } from 'lucide-react';

export default function CartPaymentMethods({
  isLoggedIn,
  deliveryMethod,
  shippingCarrier,
  shippingOptions,
  onSelectShippingOption,
  paymentMethod,
  setPaymentMethod,
  finalTotalPay
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Shipping Options (If more than 1 option is available) */}
      {deliveryMethod === 'ship' && shippingOptions && shippingOptions.length > 0 && (
        <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn vị vận chuyển</h3>
          <div className="space-y-2">
            {shippingOptions.map((option, idx) => {
              const carrier = option.carrier || option.Carrier;
              const fee = Number(option.fee || option.Fee || 0);
              const isSelected = shippingCarrier === carrier;
              const estimatedDays = option.estimatedDeliveryDays || option.EstimatedDeliveryDays;
              
              return (
                <label key={idx} className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${
                  isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="shippingOption"
                    checked={isSelected}
                    onChange={() => onSelectShippingOption(option)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800">{carrier}</p>
                    {estimatedDays && (
                      <p className="text-[10px] text-gray-400">Giao hàng dự kiến: {estimatedDays}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-red-600">{fee.toLocaleString('vi-VN')}₫</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
          <label className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50/50 opacity-50 rounded-md select-none cursor-not-allowed">
            <input
              type="radio"
              name="paymentMethod"
              disabled
              value="momo"
              checked={paymentMethod === 'momo'}
              onChange={() => setPaymentMethod('momo')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-not-allowed"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-400">Thanh toán qua ví điện tử MoMo (Đang bảo trì)</p>
              <p className="text-[10px] text-gray-400">Quét mã QR thanh toán nhanh chóng bằng ví MoMo</p>
            </div>
            <span className="w-6 h-6 bg-[#A50064]/50 text-white text-[8px] font-black rounded flex items-center justify-center select-none shrink-0">MoMo</span>
          </label>

          {/* Bank transfer */}
          <label className="flex items-center gap-3 p-3 border border-gray-100 bg-gray-50/50 opacity-50 rounded-md select-none cursor-not-allowed">
            <input
              type="radio"
              name="paymentMethod"
              disabled
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={() => setPaymentMethod('transfer')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-not-allowed"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-400">Chuyển khoản ngân hàng trực tuyến (Đang bảo trì)</p>
              <p className="text-[10px] text-gray-400">Đăng ký duyệt nhanh, giảm thêm 100,000₫</p>
            </div>
            <CreditCard size={16} className="text-gray-300" />
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
    </div>
  );
}
