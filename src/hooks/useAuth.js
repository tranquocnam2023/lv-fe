import { useState } from 'react';
import { authService } from '../services/authService';

/**
 * Hook quản lý thông tin đăng nhập và quyền hạn
 */
export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const isAdmin = user ? user.role === 'Admin' : false;

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
