import React from 'react';
import { ShieldCheck, CreditCard } from 'lucide-react';

export default function CartSuccessScreen({
  orderCode,
  paymentMethod,
  finalTotalPay,
  navigate
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-[600px] mx-auto bg-white rounded-md border border-gray-100 p-8 my-8">
      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <ShieldCheck size={40} strokeWidth={2.5} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Đặt hàng thành công!</h2>
      <p className="text-gray-500 text-sm font-medium leading-relaxed px-4 mb-8">
        Cảm ơn bạn đã tin dùng PhoneShop. Mã đơn hàng của bạn là <span className="font-extrabold text-blue-600">#{orderCode}</span>.
        Chúng tôi đã gửi thông tin xác thực đến số điện thoại và email của bạn. Nhân viên CSKH sẽ gọi xác nhận trong 15 phút tới.
      </p>

      {paymentMethod === 'transfer' && (
        <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={14} />
            Thông tin thanh toán ngân hàng
          </p>
          <div className="text-xs text-gray-700 space-y-1.5 font-semibold">
            <p>Ngân hàng: <strong className="text-gray-900">MB BANK (Quân Đội)</strong></p>
            <p>Chủ tài khoản: <strong className="text-gray-900 uppercase">PHONESHOP OFFICIAL</strong></p>
            <p>Số tài khoản: <strong className="text-blue-600 text-sm font-black tracking-wider">098 7654 3210</strong></p>
            <p>Số tiền cần chuyển: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
            <p className="text-[10px] text-gray-400 italic font-medium pt-1">Nội dung chuyển khoản ghi rõ: "Thanh toan don hang {orderCode}"</p>
          </div>
        </div>
      )}

      {paymentMethod === 'stripe' && (
        <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={14} />
            Thanh toán trực tuyến qua Stripe
          </p>
          <div className="text-xs text-gray-700 space-y-1.5 font-semibold">
            <p>Số tiền thanh toán: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
            <p className="text-[10px] text-gray-400 italic font-medium pt-1">Hệ thống đang chuyển hướng bạn tới trang thanh toán bảo mật của Stripe...</p>
          </div>
        </div>
      )}
       
      {paymentMethod === 'momo' && (
        <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
          <p className="text-xs font-bold text-[#A50064] uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-4 h-4 bg-[#A50064] text-white text-[7px] font-black rounded flex items-center justify-center">M</span>
            Thanh toán qua ví điện tử MoMo
          </p>
          <div className="text-xs text-gray-700 space-y-1.5 font-semibold flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-grow w-full">
              <p>Số tài khoản MoMo: <strong className="text-gray-900">098 7654 3210</strong></p>
              <p>Chủ tài khoản: <strong className="text-gray-900 uppercase">PHONESHOP OFFICIAL</strong></p>
              <p>Số tiền: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
              <p className="text-[10px] text-gray-400 italic font-medium pt-1">Vui lòng quét mã QR bên cạnh để hoàn tất thanh toán.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-2 bg-white border border-gray-250 rounded-md shrink-0">
              <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-gray-300">
                <svg className="w-10 h-10 text-[#A50064]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h6v6H3V3zm1 1v4h4V4H4zm1 1h2v2H5V5zM3 15h6v6H3v-6zm1 1v4h4v-4H4zm1 1h2v2H5v-2zM15 3h6v6h-6V3zm1 1v4h4V4h-4zm1 1h2v2h-2V5zM15 15h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 2v2h-2v-2zm2 0h2v2h-2v-2zM10 3h4v2h-4V3zm0 4h4v2h-4V7zm0 8h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" />
                </svg>
              </div>
              <span className="text-[8px] text-[#A50064] font-bold uppercase tracking-wider mt-1">QR MOMO</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-black transition active:scale-95 uppercase tracking-wider text-sm cursor-pointer border-0"
      >
        Tiếp tục mua sắm
      </button>
    </div>
  );
}
