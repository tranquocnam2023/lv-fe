import api from './api';

const STATIC_EMAIL_MAP = {
  'admin@gmail.com': 'admin',
  'staff1@gmail.com': 'Quốc Nam',
  'user01@gmail.com': 'Nguyễn Hoàng An'
};

export const authService = {
  login: (credentials) => {
    let username = credentials.username;
    
    // Nếu người dùng nhập email (chứa ký tự '@')
    if (username && username.includes('@')) {
      const emailLower = username.trim().toLowerCase();
      
      // 1. Kiểm tra trong bản đồ tĩnh (tài khoản có sẵn trong DB)
      if (STATIC_EMAIL_MAP[emailLower]) {
        username = STATIC_EMAIL_MAP[emailLower];
      } else {
        // 2. Kiểm tra trong localStorage (tài khoản mới đăng ký)
        try {
          const localMap = JSON.parse(localStorage.getItem('email_to_username') || '{}');
          if (localMap[emailLower]) {
            username = localMap[emailLower];
          }
        } catch (e) {
          console.error("Lỗi đọc email_to_username từ localStorage:", e);
        }
      }
    }
    
    return api.post('/Auth/login', {
      username: username,
      password: credentials.password
    });
  },
  
  register: async (userData) => {
    const res = await api.post('/Auth/register', userData);
    
    // Đăng ký thành công, lưu lại map email -> username để hỗ trợ đăng nhập bằng email
    try {
      if (userData.email && userData.username) {
        const localMap = JSON.parse(localStorage.getItem('email_to_username') || '{}');
        localMap[userData.email.trim().toLowerCase()] = userData.username;
        localStorage.setItem('email_to_username', JSON.stringify(localMap));
      }
    } catch (e) {
      console.error("Lỗi lưu email_to_username vào localStorage:", e);
    }
    
    return res;
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
  },

  forgotPassword: (data) => {
    return api.post('/Auth/forgot-password', data);
  },

  googleLogin: (idToken) => {
    return api.post('/Auth/google-login', { idToken });
  }
};
