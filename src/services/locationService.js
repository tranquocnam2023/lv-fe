import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: locationService
export const locationService = {
  getProvinces: () => api.get('/Location/provinces'),
};
