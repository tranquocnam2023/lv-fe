import api from './api';

export const orderService = {
  getAll: () => api.get('/Order'),
  
  getById: (id) => api.get(`/Order/${id}`),
  
  updateStatus: (id, status) => {
    const statusMap = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 2,
      'shipping': 3,
      'delivered': 4,
      'cancelled': 5,
      'shipping_failed': 6,
      'refunded': 7
    };
    const statusId = statusMap[status] || 1;
    return api.put(`/Order/${id}/status`, statusId, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  getMyOrders: () => api.get('/Order/my-orders'),

  checkout: (data) => api.post('/Order/checkout', data),
};
