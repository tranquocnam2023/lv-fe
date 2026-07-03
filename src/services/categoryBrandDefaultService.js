import api from './api';

export const categoryBrandDefaultService = {
  getByCategory: (categoryId) => api.get(`/CategoryBrandDefault/category/${categoryId}`),
  
  getByCategoryAndBrand: (categoryId, brandId) => api.get(`/CategoryBrandDefault/category/${categoryId}/brand/${brandId}`),
  
  upsert: (data) => api.post('/CategoryBrandDefault', data),
  
  delete: (id) => api.delete(`/CategoryBrandDefault/${id}`),
};
