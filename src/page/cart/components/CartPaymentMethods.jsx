import React, { useState } from 'react';
import { CreditCard, Truck, Info, ShieldCheck, HelpCircle, Zap, MapPin, X, CheckCircle2 } from 'lucide-react';

export default function CartPaymentMethods({
  isLoggedIn,
  currentUser,
  setIsVerifyModalOpen,
  deliveryMethod,
  shippingCarrier,
  shippingOptions,
  onSelectShippingOption,
  paymentMethod,
  setPaymentMethod,
  finalTotalPay,
  installmentMonths = 6,
  setInstallmentMonths
}) {
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Shipping Options (If more than 1 option is available) */}
      {deliveryMethod === 'ship' && shippingOptions && shippingOptions.length > 0 && (
        <div className="bg-white rounded-md border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 relative">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn vị vận chuyển</h3>

              {/* Nút Info Hover Tooltip */}
              <div
                className="relative inline-block"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowShippingModal(true)}
                  className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded-full transition flex items-center justify-center border-0 cursor-pointer"
                  title="Bấm để xem chi tiết Chính sách Phí Ship & Điều kiện Ahamove"
                >
                  <HelpCircle size={13} className="text-blue-600" />
                </button>

                {/* Popover Hover Tooltip Nhanh */}
                {isHovered && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 bg-gray-900 text-white text-[11px] p-3 rounded-lg shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150 leading-relaxed font-normal">
                    <div className="font-bold text-blue-300 border-b border-gray-700 pb-1 mb-1.5 flex items-center gap-1">
                      <Info size={12} />
                      <span>Chính sách Phí Vận Chuyển Shop:</span>
                    </div>
                    <ul className="space-y-1 text-gray-200">
                      <li>• <strong>TP.HCM (Nội thành)</strong>: 28.000 ₫ (Giao 1-2 ngày)</li>
                      <li>• <strong>Hà Nội, Đà Nẵng, Cần Thơ,...</strong>: 38.000 ₫</li>
                      <li>• <strong>Các Tỉnh/Thành khác</strong>: 45.000 ₫</li>
                      <li className="pt-1 text-amber-300 border-t border-gray-800">
                        ⚡ <strong>Ahamove Siêu Tốc (1-4h)</strong>: CHỈ áp dụng địa chỉ tại TP.HCM, tính phí động theo Km từ kho.
                      </li>
                    </ul>
                    <div className="text-[10px] text-blue-300 mt-2 font-semibold text-right italic">
                      (Click biểu tượng 🛈 để xem chi tiết)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShippingModal(true)}
              className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              <Info size={12} />
              Chi tiết phí ship
            </button>
          </div>

          <div className="space-y-2">
            {shippingOptions.map((option, idx) => {
              // Khai báo biến/hằng số: carrier - Dùng trong logic xử lý của component
              const carrier = option.carrier || option.Carrier;
              // Khai báo biến/hằng số: fee - Dùng trong logic xử lý của component
              const fee = Number(option.fee || option.Fee || 0);
              // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
              const isSelected = shippingCarrier === carrier;
              // Khai báo biến/hằng số: estimatedDays - Dùng trong logic xử lý của component
              const estimatedDays = option.estimatedDeliveryDays || option.EstimatedDeliveryDays;

              return (
                <label key={idx} className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input
                    type="radio"
                    name="shippingOption"
                    checked={isSelected}
                    onChange={() => onSelectShippingOption(option)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs flex-1">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      {carrier}
                      {carrier?.includes('Ahamove') && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black tracking-tight flex items-center gap-0.5">
                          <Zap size={9} /> Siêu tốc TP.HCM
                        </span>
                      )}
                    </p>
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
          <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
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

          {/* VNPAY Standard */}
          <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'vnpay' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="vnpay"
              checked={paymentMethod === 'vnpay'}
              onChange={() => setPaymentMethod('vnpay')}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <div className="text-xs flex-1">
              <p className="font-bold text-gray-800">Thanh toán qua VNPAY</p>
              <p className="text-[10px] text-gray-400">ATM nội địa, QR Pay, Visa, Mastercard, JCB qua VNPAY</p>
            </div>
            <span className="px-2 py-1 bg-[#005baa] text-white text-[9px] font-black rounded shrink-0">VNPAY</span>
          </label>

          {/* VNPAY Installment (Trả góp 0%) */}
          {/* <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'vnpay_installment' ? 'border-amber-500 bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="vnpay_installment"
              checked={paymentMethod === 'vnpay_installment'}
              onChange={() => setPaymentMethod('vnpay_installment')}
              className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-0 cursor-pointer"
            />
            <div className="text-xs flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800">Trả góp 0% qua VNPAY / Thẻ tín dụng</p>
                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest animate-pulse">Lãi suất 0%</span>
              </div>
              <p className="text-[10px] text-gray-400">Duyệt nhanh qua thẻ Visa, Mastercard, JCB của hơn 25 ngân hàng</p>
            </div>
            <CreditCard size={16} className="text-amber-600 shrink-0" />
          </label> */}

          {/* Trả góp 0% details widget */}
          {paymentMethod === 'vnpay_installment' && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-md text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <p className="font-black text-amber-800 uppercase tracking-wider text-[10px]">Lịch trả góp dự kiến (Lãi suất 0%)</p>
                <span className="text-[10px] font-bold text-amber-700">Miễn phí thủ tục</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                {[3, 6, 9, 12].map((m) => {
                  // Khai báo biến/hằng số: monthlyAmount - Dùng trong logic xử lý của component
                  const monthlyAmount = Math.round(finalTotalPay / m);
                  // Khai báo biến/hằng số: isSelected - Dùng trong logic xử lý của component
                  const isSelected = installmentMonths === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInstallmentMonths && setInstallmentMonths(m)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${isSelected
                        ? 'border-2 border-red-600 bg-white text-red-600 shadow-sm ring-2 ring-red-500/20'
                        : 'border-amber-200 bg-white hover:border-amber-400 text-gray-800'
                        }`}
                    >
                      <p className={`font-black text-[11px] ${isSelected ? 'text-red-700' : 'text-amber-900'}`}>{m} tháng</p>
                      <p className="font-black text-red-600 text-[11px] mt-1">{monthlyAmount.toLocaleString('vi-VN')}₫</p>
                      <p className="text-[9px] text-gray-400 font-medium">/ tháng</p>
                      {isSelected && (
                        <span className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-lg px-1 py-0.5">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 bg-white border border-amber-200/80 rounded-md text-[10px] space-y-1 text-gray-600">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                  <span>Cam kết minh bạch 100% từ PhoneShop:</span>
                </div>
                <p className="pl-4">✅ <strong>Lãi suất 0%:</strong> Ngân hàng không thu bất kỳ tiền lãi hàng tháng nào trên dư nợ thẻ.</p>
                <p className="pl-4">✅ <strong>Không phụ phí ẩn:</strong> PhoneShop tuyệt đối không thu thêm bất kỳ phí hồ sơ/bảo hiểm nào.</p>
                <p className="pl-4 text-gray-500 font-medium leading-normal pt-0.5 border-t border-dashed border-gray-100">
                  (*) Phí chuyển đổi trả góp (nếu có) được ngân hàng phát hành thẻ liệt kê minh bạch 100% ngay tại cổng VNPAY trước khi quý khách bấm xác nhận thanh toán.
                </p>
              </div>

              <p className="text-[9px] text-amber-800/80 font-medium leading-relaxed">
                💡 Ngân hàng hỗ trợ: <strong>Techcombank, VPBank, Sacombank, Shinhan Bank, HSBC, MB Bank, VIB, TPBank, BIDV, Vietinbank...</strong> (Khách hàng sẽ chọn Ngân hàng tại trang cổng VNPAY).
              </p>
            </div>
          )}
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

          {/* COD */}
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 border rounded-md transition cursor-pointer select-none ${paymentMethod === 'cod'
              ? 'border-blue-500 bg-blue-50/20'
              : 'border-gray-200 hover:border-gray-300'
              }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-0 cursor-pointer"
              />
              <div className="text-xs flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-800">Thanh toán tiền mặt khi nhận hàng (COD)</p>
                  {currentUser && !currentUser.isEmailVerified && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                      Cần xác thực Email
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">Thanh toán bằng tiền mặt khi nhận được hàng</p>
              </div>
              <Truck size={16} className="text-gray-400" />
            </label>

            {paymentMethod === 'cod' && currentUser && !currentUser.isEmailVerified && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-md text-xs text-amber-900 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <p className="font-bold text-amber-900">Yêu cầu xác thực Email trước khi đặt hàng COD</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Để tránh đơn hàng ảo, quý khách cần xác thực địa chỉ email để chọn phương thức COD.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen && setIsVerifyModalOpen(true)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition cursor-pointer border-0 shadow-xs"
                >
                  Xác thực Email ngay
                </button>
              </div>
            )}
          </div>
        </div>
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

      {/* Modal Chi tiết Chính sách Vận Chuyển */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-xl flex flex-col relative max-h-[90vh] border border-gray-150 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-blue-200" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">
                  Chính Sách & Mức Phí Vận Chuyển
                </h3>
              </div>
              <button
                onClick={() => setShowShippingModal(false)}
                className="p-1 hover:bg-white/20 text-white rounded-full transition cursor-pointer bg-transparent border-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-gray-700">
              {/* Section 1: Giao Hàng Tiêu Chuẩn */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-black text-gray-900 text-xs border-b border-gray-100 pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                  <span>Mức Phí Giao Hàng Tiêu Chuẩn (Toàn Quốc)</span>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/60 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">Nội thành TP. Hồ Chí Minh</p>
                      <p className="text-[10px] text-gray-500">Khu vực gần tổng kho chính</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm">28.000 ₫</span>
                      <p className="text-[9px] text-gray-400">1 - 2 ngày</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">Các Thành Phố Lớn</p>
                      <p className="text-[10px] text-gray-500">Hà Nội, Đà Nẵng, Hải Phòng, Cần Thơ</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm">38.000 ₫</span>
                      <p className="text-[9px] text-gray-400">2 - 3 ngày</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">Tất cả Tỉnh / Thành phố khác</p>
                      <p className="text-[10px] text-gray-500">Tất cả các tuyến đường toàn quốc</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm">45.000 ₫</span>
                      <p className="text-[9px] text-gray-400">3 - 5 ngày</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic pt-1">
                    * Lưu ý: Sản phẩm khối lượng lớn trên 2kg sẽ áp dụng phụ phí 5.000 ₫/kg tiếp theo.
                  </p>
                </div>
              </div>

              {/* Section 2: Giao Hàng Siêu Tốc Ahamove */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 font-black text-gray-900 text-xs border-b border-gray-100 pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                  <span className="flex items-center gap-1">
                    Giao Hàng Siêu Tốc Ahamove (Giao Ngay 1 - 4 Giờ)
                    <Zap size={13} className="text-amber-500 fill-amber-500" />
                  </span>
                </div>
                <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-200/60 space-y-2 text-amber-950">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-amber-900">Điều kiện & Phạm vi áp dụng:</p>
                      <p className="text-[11px] text-amber-800 leading-normal">
                        CHỈ áp dụng cho địa chỉ nhận hàng thuộc <strong>khu vực TP. Hồ Chí Minh</strong> (Do tổng kho PhoneShop đặt tại Quận 8, TP.HCM).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-1 border-t border-amber-200/40">
                    <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-amber-900">Cách tính phí ship Ahamove:</p>
                      <p className="text-[11px] text-amber-800 leading-normal">
                        Phí ship Ahamove được kết nối trực tiếp với API Ahamove chính thức, tự động tính toán chính xác theo <strong>quãng đường Km thực tế</strong> từ kho đến địa chỉ định vị của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Hỗ trợ Số nhà phức tạp & Hẻm sâu */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <p className="font-extrabold text-gray-900 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-green-600" />
                  Hỗ trợ Hẻm sâu & Số nhà phức tạp:
                </p>
                <p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-200/60">
                  Đối với địa chỉ nhiều xẹt (VD: <code className="bg-white px-1 py-0.5 rounded border text-blue-600 font-bold">123/45/6B</code>), quý khách hoàn toàn tự do điền thủ công. Hệ thống luôn đảm bảo lưu giữ nguyên văn 100% địa chỉ chi tiết và tự động sử dụng Phường/Xã để định phí chính xác mà không gặp bất kỳ sự cố nào.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowShippingModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-md text-xs transition cursor-pointer border-0 shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
