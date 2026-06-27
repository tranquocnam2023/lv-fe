import api from './api';

export const reviewService = {
  getAll: () => api.get('/Review'),
  
  delete: (id) => api.delete(`/Review/${id}`),
};
