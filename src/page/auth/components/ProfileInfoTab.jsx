/**
 * =========================================================================
 * 📌 FILE: ProfileInfoTab.jsx
 * - CHỨC NĂNG: Tab xem và cập nhật "Thông tin tài khoản cá nhân" (Họ tên, Email, Vai trò, Hạng thành viên, Điểm thưởng).
 * - HIỂN THỊ Ở ĐÂU: Xuất hiện mặc định khi người dùng đã đăng nhập mở Trang cá nhân `/profile` hoặc `/profile?tab=info`.
 * =========================================================================
 */
import React, { useState } from 'react';
import EmailVerificationModal from '../../../components/auth/EmailVerificationModal';

// LUỒNG PHÂN HẠNG THÀNH VIÊN (CUSTOMER TIERS):
// - Hạng thành viên được xác định động dựa trên Điểm Tích Lũy Trọn Đời (accumulatedPoints).
// - Hạng Đồng: < 1000 điểm
// - Hạng Bạc: >= 1000 điểm và < 5000 điểm
// - Hạng Vàng: >= 5000 điểm

// màu hạng
const getRankBadgeStyle = (points) => {
  if (points >= 5000) return 'bg-amber-100 text-amber-800 border border-amber-200';// vàng 
  if (points >= 1000) return 'bg-slate-100 text-slate-800 border border-slate-200';// xám bạc
  return 'bg-orange-100 text-orange-800 border border-orange-200';// cam ngả đồng
};
// thứ hạng hiển thị
const getRankLabel = (points) => {
  if (points >= 5000) return 'Vàng';
  if (points >= 1000) return 'Bạc';
  return 'Đồng';
};
// chữ màu hạng
const getRankColorClass = (points) => {
  if (points >= 5000) return 'text-amber-600';
  if (points >= 1000) return 'text-slate-500';
  return 'text-orange-700';
};

export default function ProfileInfoTab({
  userProfile,
  isEditingProfile,
  setIsEditingProfile,
  editProfileData,
  setEditProfileData,
  handleUpdateProfile,
  formatDate,
  loading,
  onRefreshProfile
}) {
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-xl font-bold text-gray-800">Thông tin tài khoản cá nhân</h3>
        <p className="text-xs text-gray-500">Quản lý tên hiển thị và email nhận hóa đơn của bạn</p>
      </div>

      {!isEditingProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-md border border-gray-100">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase">Họ và tên</span>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-lg ${getRankColorClass(userProfile?.accumulatedPoints || 0)}`}>
                {userProfile?.username}
              </p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRankBadgeStyle(userProfile?.accumulatedPoints || 0)}`}>
                {getRankLabel(userProfile?.accumulatedPoints || 0)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase">Email</span>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-800 text-lg">{userProfile?.email}</p>
              {userProfile?.isEmailVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  ✓ Đã xác thực
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    ⚠ Chưa xác thực
                  </span>
                  <button
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer border-0 bg-transparent"
                  >
                    Xác thực ngay
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase">Ngày đăng ký</span>
            <p className="font-bold text-gray-800">{formatDate(userProfile?.createdAt)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase">Vai trò tài khoản</span>
            <p className="font-bold text-primary">{userProfile?.role}</p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-md border border-gray-100">
            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase">Điểm khả dụng (Ví tiêu dùng)</span>
              <p className="font-bold text-yellow-600 text-lg">{(userProfile?.rewardPoints || 0).toLocaleString('vi-VN')} điểm</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold uppercase">Điểm tích lũy xét hạng (Trọn đời)</span>
              <p className="font-bold text-primary text-lg">{(userProfile?.accumulatedPoints || 0).toLocaleString('vi-VN')} điểm</p>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200/50 flex justify-end">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm cursor-pointer border-0"
            >
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tên tài khoản (Họ tên)</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold text-gray-850"
              value={editProfileData.username}
              onChange={(e) => setEditProfileData({ ...editProfileData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email liên lạc</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-sm font-semibold text-gray-850"
              value={editProfileData.email}
              onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-md hover:bg-gray-200 transition text-sm cursor-pointer border-0"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm cursor-pointer border-0"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        email={userProfile?.email}
        onVerifiedSuccess={() => {
          if (onRefreshProfile) onRefreshProfile();
        }}
      />
    </div>
  );
}
