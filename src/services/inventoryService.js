import api from './api';

export const inventoryService = {
  getAll: () => api.get('/InventoryTransaction'),
  
  create: (data) => api.post('/InventoryTransaction', data),
  
  revert: (id) => api.put(`/InventoryTransaction/${id}/revert`)
};
