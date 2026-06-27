import axios from 'axios';

// Đọc URL từ file .env, nếu không có thì dùng mặc định
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động đính kèm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý phản hồi
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Nếu token hết hạn hoặc không hợp lệ (401 Unauthorized), xóa session và chuyển hướng về trang đăng nhập
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
