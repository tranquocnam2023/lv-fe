import React from 'react';
import { Link } from 'react-router-dom';
import { THEME } from '../../utils/theme';

export default function HeaderAccountMenu({
  isLoggedIn,
  user,
  userRole,
  handleLogout
}) {
  return (
    <>
      {isLoggedIn ? (
        <div className="relative group py-2">
          <div className="flex items-center px-3 py-1 rounded bg-white/10 gap-3 cursor-pointer hover:bg-white/20 transition-all shadow-sm">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] opacity-75">Tài khoản</span>
              <span className="font-bold text-xs truncate max-w-[100px]">{user.username || user.name || 'User'}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm select-none border border-white/10">
              {(user.username || 'U')[0].toUpperCase()}
            </div>
          </div>

          <div className="absolute right-0 top-full pt-1 z-[9999] hidden group-hover:block">
            <div className="w-52 bg-white rounded-md shadow-xl py-1.5 border border-gray-100 text-gray-800 animate-in fade-in slide-in-from-top-1 duration-150">
              {userRole === 'Admin' && (
                <Link
                  to="/admin"
                  className="flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-b border-gray-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>Trang Quản trị</span>
                </Link>
              )}

              <Link
                to="/profile?tab=info"
                className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span>Thông tin tài khoản</span>
              </Link>

              <Link
                to="/profile?tab=addresses"
                className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Sổ địa chỉ nhận hàng</span>
              </Link>

              <Link
                to="/profile?tab=history"
                className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.076 1.719M9 12h.008v.008H9V12Zm0 3h.008v.008H9V15Zm0 3h.008v.008H9V18Z" />
                </svg>
                <span>Lịch sử mua hàng</span>
              </Link>

              <Link
                to="/profile?tab=password"
                className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
                <span>Đổi mật khẩu</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100 cursor-pointer border-0 bg-transparent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Link 
          to="/auth" 
          className="flex items-center px-3 py-2 rounded transition text-center hover:bg-white/20 font-bold"
          style={{ color: THEME.textLight }}
        >
          Đăng nhập<br/>Tài khoản
        </Link>
      )}
    </>
  );
}
