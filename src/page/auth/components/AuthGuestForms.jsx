import React from 'react';
import Breadcrumb from '../../../components/Breadcrumb';
import OtpVerification from '../../../components/OtpVerification';

export default function AuthGuestForms({
  isLogin,
  setIsLogin,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  error,
  setError,
  handleAuth,
  isForgotPassword,
  setIsForgotPassword,
  resetUsername,
  setResetUsername,
  resetEmail,
  setResetEmail,
  resetNewPassword,
  setResetNewPassword,
  resetConfirmPassword,
  setResetConfirmPassword,
  forgotPasswordStep,
  setForgotPasswordStep,
  forgotPasswordOtp,
  forgotPasswordError,
  handleSendResetOtp,
  handleVerifyResetOtp,
  handleResendResetOtp,
  handleForgotPasswordSubmit
}) {
  if (isForgotPassword) {
    return (
      <div className="flex flex-col h-full w-full">
        <Breadcrumb items={[{ label: 'Quên mật khẩu' }]} />
        <div className="flex justify-center items-start pt-6 w-full px-4">
          <div className="bg-white border border-gray-200 p-8 rounded-md w-full max-w-md space-y-4">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 1 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>1</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Nhập tài khoản</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 transition-all ${forgotPasswordStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 2 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>2</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Xác thực OTP</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 transition-all ${forgotPasswordStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${forgotPasswordStep >= 3 ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>3</div>
                <span className="text-[10px] font-semibold text-gray-500 mt-1">Đổi mật khẩu</span>
              </div>
            </div>

            {error && forgotPasswordStep !== 2 && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* STEP 1: Enter Username & Email */}
            {forgotPasswordStep === 1 && (
              <form className="flex flex-col space-y-4" onSubmit={handleSendResetOtp}>
                <h2 className="text-2xl font-bold text-primary mb-2 text-center">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                <p className="text-xs text-gray-500 text-center font-medium mb-4">Nhập tên tài khoản và email đã đăng ký để nhận mã xác thực OTP.</p>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="VD: email@example.com"
                    className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white font-bold py-2.5 rounded mt-4 hover:bg-secondary transition uppercase flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer border-0"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG XỬ LÝ...</span>
                    </>
                  ) : (
                    'GỬI MÃ XÁC NHẬN OTP'
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotPasswordStep === 2 && (
              <OtpVerification
                email={resetEmail}
                mockOtp={forgotPasswordOtp}
                onVerify={handleVerifyResetOtp}
                onCancel={() => setForgotPasswordStep(1)}
                onResend={handleResendResetOtp}
                isSubmitting={loading}
                error={forgotPasswordError}
                title="Xác thực OTP"
                description="Hệ thống đã tạo mã xác nhận đổi mật khẩu, vui lòng nhập mã OTP để tiếp tục."
              />
            )}

            {/* STEP 3: Change Password */}
            {forgotPasswordStep === 3 && (
              <form className="flex flex-col space-y-4 animate-fade-in" onSubmit={handleForgotPasswordSubmit}>
                <h2 className="text-2xl font-bold text-primary mb-2 text-center">Thiết Lập Mật Khẩu Mới</h2>
                <p className="text-xs text-gray-500 text-center font-medium mb-4">Vui lòng nhập mật khẩu mới từ 6 ký tự để hoàn tất quy trình.</p>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-sm font-semibold text-gray-800"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white font-bold py-2.5 rounded mt-4 hover:bg-green-700 transition uppercase flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer border-0"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG LƯU...</span>
                    </>
                  ) : (
                    'CẬP NHẬT MẬT KHẨU MỚI'
                  )}
                </button>
              </form>
            )}

            {forgotPasswordStep !== 2 && (
              <div className="text-center pt-2">
                <span 
                  className="text-primary font-bold text-sm cursor-pointer hover:underline" 
                  onClick={() => { setIsForgotPassword(false); setForgotPasswordStep(1); setError(''); }}
                >
                  Quay lại Đăng nhập
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Breadcrumb items={[{ label: isLogin ? 'Đăng nhập' : 'Đăng ký' }]} />
      <div className="flex justify-center items-start pt-6 w-full px-4">
        <div className="bg-white border border-gray-200 p-8 rounded-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">
            {isLogin ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form className="flex flex-col space-y-4" onSubmit={handleAuth}>
            {isLogin ? (
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ Email hoặc Tên đăng nhập</label>
                <input
                  type="text"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-gray-800 font-semibold text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Tên người dùng</label>
                <input
                  type="text"
                  placeholder="Nhập tên người dùng"
                  className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-gray-800 font-semibold text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Nhập địa chỉ Email"
                  className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-gray-800 font-semibold text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Mật khẩu</label>
                {isLogin && (
                  <span 
                    onClick={() => { setIsForgotPassword(true); setError(''); }}
                    className="text-xs text-primary font-bold cursor-pointer hover:underline"
                  >
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-gray-800 font-semibold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  className="w-full border border-gray-300 p-2.5 rounded focus:outline-none focus:border-primary text-gray-800 font-semibold text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white font-bold py-2.5 rounded mt-4 hover:bg-secondary transition cursor-pointer border-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'ĐĂNG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ')}
            </button>

            {/* Tạm thời ẩn nút đăng nhập bằng Google do vấn đề bảo mật */}
            {/* <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">Hoặc</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div id="google-signin-btn" className="w-full flex justify-center"></div> */}
          </form>

          <div className="mt-6 text-center text-sm">
            {isLogin ? (
              <p>Chưa có tài khoản? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(false); setError(''); setUsername(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}>Đăng ký ngay</span></p>
            ) : (
              <p>Đã có tài khoản? <span className="text-primary font-bold cursor-pointer hover:underline" onClick={() => { setIsLogin(true); setError(''); setUsername(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}>Đăng nhập</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
