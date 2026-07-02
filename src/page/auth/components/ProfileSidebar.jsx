import React from 'react';
import { User, MapPin, ClipboardList, Key, LogOut } from 'lucide-react';

export default function ProfileSidebar({
  userProfile,
  profileTab,
  setProfileTab,
  setSelectedOrder,
  handleLogout
}) {
  return (
    <aside className="w-full md:w-64 shrink-0 bg-white rounded-md border border-gray-200 p-4 h-fit">
      <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-white text-lg select-none">
          {(userProfile?.username || 'U')[0].toUpperCase()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-800 truncate">{userProfile?.username}</span>
          <span className="text-xs text-gray-500 truncate">{userProfile?.email}</span>
          <span className="text-[10px] uppercase font-bold text-primary mt-0.5">{userProfile?.role}</span>
        </div>
      </div>

      <nav className="flex flex-col space-y-1">
        <button
          onClick={() => setProfileTab('info')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left cursor-pointer border-0 ${
            profileTab === 'info'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 hover:bg-gray-50 bg-transparent'
          }`}
        >
          <User size={18} />
          <span>Thông tin tài khoản</span>
        </button>

        <button
          onClick={() => setProfileTab('addresses')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left cursor-pointer border-0 ${
            profileTab === 'addresses'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 hover:bg-gray-50 bg-transparent'
          }`}
        >
          <MapPin size={18} />
          <span>Sổ địa chỉ nhận hàng</span>
        </button>

        <button
          onClick={() => {
            setProfileTab('history');
            setSelectedOrder(null);
          }}
          className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left cursor-pointer border-0 ${
            profileTab === 'history'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 hover:bg-gray-50 bg-transparent'
          }`}
        >
          <ClipboardList size={18} />
          <span>Lịch sử mua hàng</span>
        </button>

        <button
          onClick={() => setProfileTab('password')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold transition-all text-left cursor-pointer border-0 ${
            profileTab === 'password'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 hover:bg-gray-50 bg-transparent'
          }`}
        >
          <Key size={18} />
          <span>Đổi mật khẩu</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-bold text-red-600 hover:bg-red-50 transition-all text-left mt-4 border-t border-gray-100 pt-4 cursor-pointer bg-transparent border-0"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
}
