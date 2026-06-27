import api from './api';

export const variantService = {
  getAll: (productId) => api.get('/ProductVariant' + (productId ? `?productId=${productId}` : '')),
  
  getById: (id) => api.get(`/ProductVariant/${id}`),
  
  create: (data) => api.post('/ProductVariant', data),
  
  update: (id, data) => api.put(`/ProductVariant/${id}`, data),
  
  delete: (id) => api.delete(`/ProductVariant/${id}`),

  sync: (productId, data) => api.put(`/ProductVariant/sync/${productId}`, data),
};
