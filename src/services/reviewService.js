import api from './api';

export const reviewService = {
  getAll: () => api.get('/Review'),
  getByProductId: (productId) => api.get(`/Review/product/${productId}`),
  create: (data) => api.post('/Review', data),
  reply: (id, replyText) => api.put(`/Review/${id}/reply`, { reply: replyText }),
  toggleVisibility: (id) => api.put(`/Review/${id}/toggle-visibility`),
  delete: (id) => api.delete(`/Review/${id}`),
};

