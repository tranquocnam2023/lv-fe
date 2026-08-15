import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: inventoryService
export const inventoryService = {
  getAll: () => api.get('/InventoryTransaction'),
  
  create: (data) => api.post('/InventoryTransaction', data),
  
  revert: (id) => api.put(`/InventoryTransaction/${id}/revert`),

  getStock: () => api.get('/InventoryTransaction/stock')
};
