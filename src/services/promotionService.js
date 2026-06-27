import api from './api';

export const promotionService = {
  getAll: () => api.get('/Promotion'),
  getMyUsages: () => api.get('/PromotionUsage/my-usages'),
  create: (data) => api.post('/Promotion', data),
  update: (id, data) => api.put(`/Promotion/${id}`, data),
  delete: (id) => api.delete(`/Promotion/${id}`),
};
