import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: paymentService
export const paymentService = {
  getAll: () => api.get('/Payment/admin/all-payments'),
};
