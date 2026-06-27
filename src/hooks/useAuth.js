import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * Hook quản lý thông tin đăng nhập và quyền hạn
 */
export const useAuth = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'Admin');
    } else {
      setIsAdmin(false);
    }
  }, [user]);

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
