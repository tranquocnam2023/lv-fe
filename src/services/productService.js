import api from './api';

export const productService = {
  getAll: (includeInactive = false) => api.get(`/Product?includeInactive=${includeInactive}`),
  
  getById: (id) => api.get(`/Product/${id}`),
  
  getByCategory: (categoryId) => api.get(`/Product/Category/${categoryId}`),
  
  getPerformance: () => api.get('/Product/Performance'),
  
  create: (data) => api.post('/Product', data),
  
  update: (id, data) => api.put(`/Product/${id}`, data),
  
  delete: (id) => api.delete(`/Product/${id}`),

  uploadLocalImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/Upload/local', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

