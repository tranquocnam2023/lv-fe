import api from './api';

export const userService = {
  getAll: () => api.get('/User'),//lấy danh sách user

  getById: (id) => api.get(`/User/${id}`),//lấy chi tiết user

  getProfile: () => api.get('/User/me'), // lấy thông tin cá nhân của mình

  update: (id, data) => api.put(`/User/${id}`, data),//cập nhật user

  toggleStatus: (id) => api.put(`/User/${id}/toggle-status`), // khóa / mở khóa tài khoản

  updateProfile: (data) => api.put('/User/me', data), // cập nhật thông tin cá nhân (họ tên, email,...)

  changePassword: (data) => api.put('/User/change-password', data), // đổi mật khẩu
};
