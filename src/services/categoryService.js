import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: categoryService
export const categoryService = {
  getAll: (includeInactive = false) => api.get(`/Category?includeInactive=${includeInactive}`),
  
  getRoots: (includeInactive = false) => api.get(`/Category?isRoot=true&includeInactive=${includeInactive}`),

  getDetails: (id, includeInactive = false) => api.get(`/Category/${id}/details?includeInactive=${includeInactive}`),

  getById: (id, includeInactive = false) => api.get(`/Category/${id}?includeInactive=${includeInactive}`),
  
  create: (data) => api.post('/Category', data),
  
  update: (id, data) => api.put(`/Category/${id}`, data),
  
  delete: (id) => api.delete(`/Category/${id}`),
};
