import api from './api';

export const paymentService = {
  getAll: () => api.get('/Payment/admin/all-payments'),
};
