import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: orderService
export const orderService = {
  getAll: () => api.get('/Order'),
  
  getById: (id) => api.get(`/Order/${id}`),
  
  updateStatus: (id, status) => {
    // Cấu hình/Hằng số/Dịch vụ dữ liệu: statusMap
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
    // Khai báo biến/hằng số: statusId - Dùng trong logic xử lý của component
    const statusId = statusMap[status] || 1;
    return api.put(`/Order/${id}/status`, statusId, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  getMyOrders: () => api.get('/Order/my-orders'),

  checkout: (data) => api.post('/Order/checkout', data),

  shipAhamove: (id) => api.post(`/Order/${id}/ship-ahamove`),

  cancelOrder: (id, phoneNumber) => {
    // Khai báo biến/hằng số: query - Dùng trong logic xử lý của component
    const query = phoneNumber ? `?phoneNumber=${encodeURIComponent(phoneNumber)}` : '';
    return api.put(`/Order/${id}/cancel${query}`);
  },

  // --- Return & Refund API Endpoints ---
  createReturnRequest: (data) => api.post('/Return', data),
  getReturnRequestByOrder: (orderId) => api.get(`/Return/order/${orderId}`),
  getAllReturnRequests: () => api.get('/Return'),
  approveReturnRequest: (id, adminNote) => api.put(`/Return/${id}/approve`, { adminNote }),
  rejectReturnRequest: (id, adminNote) => api.put(`/Return/${id}/reject`, { adminNote }),
};
