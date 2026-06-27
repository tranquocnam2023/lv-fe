import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function OtpVerification({
  email,
  mockOtp,
  onVerify,
  onCancel,
  onResend,
  isSubmitting = false,
  error = '',
  title = 'Xác thực mã OTP',
  description = 'Vui lòng nhập mã OTP đã được gửi đến email của bạn để tiếp tục.'
}) {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle character inputs
  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(value.length - 1); // Get last typed char
    setOtpValues(newOtpValues);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit if all filled
    const completedOtp = newOtpValues.join('');
    if (completedOtp.length === 6 && index === 5) {
      onVerify(completedOtp);
    }
  };

  // Handle keypresses (like Backspace)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle paste events
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setOtpValues(chars);
      inputRefs.current[5].focus();
      onVerify(pastedData);
    }
  };

  // Handle Resend Trigger
  const handleResendClick = () => {
    if (!canResend) return;
    setOtpValues(['', '', '', '', '', '']);
    setTimer(60);
    setCanResend(false);
    if (onResend) onResend();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length < 6) return;
    onVerify(otpCode);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-gray-100 rounded-md p-8 animate-fade-in">
      
      {/* Dev helper to display mock OTP */}
      {mockOtp && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3 text-amber-800 text-xs font-bold animate-pulse">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="uppercase tracking-wider">Trình giả lập Email (Demo):</p>
            <p className="font-medium mt-1">
              Hệ thống đã gửi mã xác thực tới <span className="text-blue-600 font-extrabold">{email}</span>.
            </p>
            <p className="mt-1 text-sm">
              Mã OTP của bạn là: <span className="text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-md text-base font-black tracking-widest">{mockOtp}</span>
            </p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck size={32} strokeWidth={2.5} />
        </div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
        <p className="text-gray-500 text-sm font-medium px-4">{description}</p>
      </div>

      {/* OTP Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
          {otpValues.map((value, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 bg-gray-50/50 border-2 border-gray-100 rounded-md text-center text-xl font-extrabold text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
              disabled={isSubmitting}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-xs font-bold border border-red-100 flex items-center gap-2 animate-shake">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || otpValues.join('').length < 6}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>ĐANG XÁC THỰC...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              <span>XÁC NHẬN MÃ OTP</span>
            </>
          )}
        </button>
      </form>

      {/* Countdown and Resend */}
      <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs">
        {canResend ? (
          <button
            onClick={handleResendClick}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-bold transition-all"
          >
            <RefreshCw size={12} /> Gửi lại mã OTP mới
          </button>
        ) : (
          <span className="text-gray-400 font-bold">
            Gửi lại mã mới sau <span className="text-gray-900 font-black">{timer}s</span>
          </span>
        )}
      </div>

      {/* Close button if optional cancel available */}
      {onCancel && (
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
          title="Đóng"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
