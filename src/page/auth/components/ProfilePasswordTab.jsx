import React from 'react';

export default function ProfilePasswordTab({
  passwordData,
  setPasswordData,
  handleChangePassword,
  loading
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="text-xl font-bold text-gray-800">Đổi mật khẩu tài khoản</h3>
        <p className="text-xs text-gray-500">Nên sử dụng mật khẩu mạnh có chứa chữ, số và ký tự đặc biệt</p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            required
            className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-xs font-semibold text-gray-850"
            value={passwordData.oldPassword}
            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-xs font-semibold text-gray-850"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full border border-gray-300 p-2.5 rounded-md focus:outline-none focus:border-primary text-xs font-semibold text-gray-850"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-md hover:bg-secondary transition active:scale-95 text-sm cursor-pointer border-0"
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
}
