import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: reviewService
export const reviewService = {
  getAll: () => api.get('/Review/admin/all'),
  getByProductId: (productId) => api.get(`/Review/product/${productId}`),
  create: (data) => api.post('/Review', data),
  reply: (id, replyText) => api.put(`/Review/${id}/reply`, { reply: replyText }),
  toggleVisibility: (id) => api.put(`/Review/${id}/toggle-visibility`),
  delete: (id) => api.delete(`/Review/${id}`),
};

