import api from './api';

export const brandService = {
  getAll: (params) => api.get('/Brand', { params }),
  
  getById: (id) => api.get(`/Brand/${id}`),
  
  create: (data) => api.post('/Brand', data),
  
  update: (id, data) => api.put(`/Brand/${id}`, data),
  
  delete: (id) => api.delete(`/Brand/${id}`),

  getStats: (id) => api.get(`/Brand/${id}/stats`),
};
