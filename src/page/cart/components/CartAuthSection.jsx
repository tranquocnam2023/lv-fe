import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CartAuthSection({
  isLoggedIn,
  currentUser,
  authMode,
  setAuthMode,
  formData,
  openAddressModal,
  inlineEmail,
  setInlineEmail,
  inlineUsername,
  setInlineUsername,
  inlinePassword,
  setInlinePassword,
  inlineAuthError,
  inlineAuthLoading,
  handleInlineRegister,
  handleInlineLogin
}) {
  if (isLoggedIn) {
    return (
      <div className="bg-white rounded-md border border-green-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-green-500 shrink-0" size={18} />
          <span className="text-xs font-extrabold text-gray-700">
            Thành viên VIP: <span className="text-blue-600">{currentUser?.username || 'admin'}</span>, đơn hàng của bạn sắp hoàn thành rồi
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-blue-100 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
        <div>
          <h3 className="font-extrabold text-xs text-blue-700 uppercase tracking-wider">
            Đăng ký thành viên PhoneShop VIP
          </h3>
          <p className="text-[10px] text-gray-400 font-medium">
            Đăng ký ngay để nhận ưu đãi tích điểm VIP, thanh toán COD và theo dõi đơn hàng dễ dàng.
          </p>
        </div>
      </div>

      {authMode === 'register' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Họ tên & SĐT</label>
              <div className="text-[11px] font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 flex justify-between items-center">
                <span>
                  {formData.fullName && formData.phone
                    ? `${formData.fullName} - ${formData.phone}`
                    : "Lấy từ thông tin giao nhận..."}
                </span>
                <button
                  type="button"
                  onClick={openAddressModal}
                  className="text-blue-600 hover:underline text-[10px] cursor-pointer"
                >
                  Thiết lập
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Email đăng ký *</label>
              <input
                type="email"
                placeholder="nhapemail@gmail.com..."
                value={inlineEmail}
                onChange={(e) => setInlineEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Mật khẩu đăng ký *</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
              value={inlinePassword}
              onChange={(e) => setInlinePassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
            />
          </div>

          {inlineAuthError && (
            <p className="text-red-500 text-xs font-bold flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{inlineAuthError}</span>
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <button
              type="button"
              onClick={handleInlineRegister}
              disabled={inlineAuthLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-md transition cursor-pointer"
            >
              {inlineAuthLoading ? 'Đang xử lý...' : 'Đăng ký & Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setInlineEmail('');
                setInlinePassword('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              Đăng nhập nhanh
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Tên đăng nhập / Email *</label>
              <input
                type="text"
                placeholder="Nhập username hoặc email..."
                value={inlineUsername}
                onChange={(e) => setInlineUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Mật khẩu *</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={inlinePassword}
                onChange={(e) => setInlinePassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 text-gray-800"
              />
            </div>
          </div>

          {inlineAuthError && (
            <p className="text-red-500 text-xs font-bold flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{inlineAuthError}</span>
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <button
              type="button"
              onClick={handleInlineLogin}
              disabled={inlineAuthLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-md transition cursor-pointer"
            >
              {inlineAuthLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setInlineUsername('');
                setInlinePassword('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              Tạo tài khoản mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
