import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: STATIC_EMAIL_MAP
const STATIC_EMAIL_MAP = {
  'admin@gmail.com': 'admin',
  'staff1@gmail.com': 'Quốc Nam',
  'user01@gmail.com': 'Nguyễn Hoàng An'
};

// Cấu hình/Hằng số/Dịch vụ dữ liệu: authService
export const authService = {
  login: (credentials) => {
    let username = credentials.username;
    
    // Nếu người dùng nhập email (chứa ký tự '@')
    if (username && username.includes('@')) {
      // Khai báo biến/hằng số: emailLower - Dùng trong logic xử lý của component
      const emailLower = username.trim().toLowerCase();
      
      // 1. Kiểm tra trong bản đồ tĩnh (tài khoản có sẵn trong DB)
      if (STATIC_EMAIL_MAP[emailLower]) {
        username = STATIC_EMAIL_MAP[emailLower];
      } else {
        // 2. Kiểm tra trong localStorage (tài khoản mới đăng ký)
        try {
          // Cấu hình/Hằng số/Dịch vụ dữ liệu: localMap
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
    // Khai báo biến/hằng số: res - Dùng trong logic xử lý của component
    const res = await api.post('/Auth/register', userData);
    
    // Đăng ký thành công, lưu lại map email -> username để hỗ trợ đăng nhập bằng email
    try {
      if (userData.email && userData.username) {
        // Cấu hình/Hằng số/Dịch vụ dữ liệu: localMap
        const localMap = JSON.parse(localStorage.getItem('email_to_username') || '{}');
        localMap[userData.email.trim().toLowerCase()] = userData.username;
        localStorage.setItem('email_to_username', JSON.stringify(localMap));
      }

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data));
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (e) {
      console.error("Lỗi lưu thông tin sau khi đăng ký:", e);
    }
    
    return res;
  },
  
  getCurrentUser: () => {
    // Khai báo biến/hằng số: user - Dùng trong logic xử lý của component
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
  },

  sendForgotPasswordOtp: (email) => {
    return api.post('/Auth/forgot-password', { email });
  },

  resetPassword: (data) => {
    return api.post('/Auth/reset-password', data);
  },

  googleLogin: (idToken) => {
    return api.post('/Auth/google-login', { idToken });
  },

  sendVerificationOtp: () => {
    return api.post('/Auth/send-verification-otp');
  },

  verifyEmail: (otp) => {
    return api.post('/Auth/verify-email', { otp });
  }
};
