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
       
      {paymentMethod === 'vnpay' && (
        <div className="w-full bg-gray-50 rounded-md p-5 border border-gray-150 mb-8 text-left space-y-3">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <CreditCard size={14} />
            Thanh toán trực tuyến qua VNPAY
          </p>
          <div className="text-xs text-gray-700 space-y-1.5 font-semibold">
            <p>Số tiền thanh toán: <strong className="text-red-600 font-extrabold text-sm">{finalTotalPay.toLocaleString('vi-VN')}₫</strong></p>
            <p className="text-[10px] text-gray-400 italic font-medium pt-1">Hệ thống đang chuyển hướng bạn tới cổng thanh toán VNPAY...</p>
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
