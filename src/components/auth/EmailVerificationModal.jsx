import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export default function EmailVerificationModal({ isOpen, onClose, email, onVerifiedSuccess }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await authService.sendVerificationOtp();
      setSuccessMsg(res.data?.message || 'Mã xác thực OTP đã được gửi đến email của bạn.');
      setCountdown(60);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authService.verifyEmail(otp.trim());
      setSuccessMsg('Xác thực email thành công!');
      
      // Update local stored user
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.isEmailVerified = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      setTimeout(() => {
        if (onVerifiedSuccess) {
          onVerifiedSuccess();
        }
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data || 'Xác thực mã OTP thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer border-0"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Xác thực Địa chỉ Email</h3>
              <p className="text-xs text-blue-100 mt-0.5">Bảo vệ tài khoản và mở khóa thanh toán COD</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-800 flex items-start gap-2.5">
            <span className="text-base leading-none">💡</span>
            <span>
              Mã xác nhận sẽ được gửi tới email: <strong className="font-semibold text-blue-900">{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).
            </span>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Mã OTP (6 chữ số)
                </label>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || countdown > 0}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-gray-400 cursor-pointer border-0 bg-transparent"
                >
                  {sendingOtp
                    ? 'Đang gửi...'
                    : countdown > 0
                    ? `Gửi lại sau (${countdown}s)`
                    : 'Gửi mã OTP'}
                </button>
              </div>

              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[8px] font-mono font-bold py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition cursor-pointer border-0"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !otp || otp.length !== 6}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-500/20 cursor-pointer border-0"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực ngay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
