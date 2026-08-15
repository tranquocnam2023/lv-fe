import { useState } from 'react';
import { authService } from '../services/authService';

/**
 * Hook quản lý thông tin đăng nhập và quyền hạn
 */
export const useAuth = () => {
  // State: user - Quản lý trạng thái và dữ liệu của user trong giao diện
  const [user, setUser] = useState(authService.getCurrentUser());
  // Khai báo biến/hằng số: isAdmin - Dùng trong logic xử lý của component
  const isAdmin = user ? user.role === 'Admin' : false;

  // Hàm thực thi logic: logout
  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/auth';
  };

  return {
    user,
    isAdmin,
    isAuthenticated: !!user,
    logout
  };
};
