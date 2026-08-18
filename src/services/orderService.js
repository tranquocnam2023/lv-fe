import api from './api';

// Cấu hình/Hằng số/Dịch vụ dữ liệu: orderService
export const orderService = {
  getAll: () => api.get('/Order'),
  
  getById: (id) => api.get(`/Order/${id}`),
  
  updateStatus: (id, status) => {
    // Cấu hình/Hằng số/Dịch vụ dữ liệu: statusMap
    // Phải khớp đúng bảng OrderStatuses trong CSDL (chỉ có Id 1..7):
    //   1 Pending | 2 Processing | 3 Shipping | 4 Completed | 5 Cancelled
    //   6 Return_failed (Giao hàng thất bại / Hoàn hàng) | 7 Refunded
    // Trước đây 'shipping_failed' bị map sang 8 - một Id không tồn tại, khiến nút
    // "Giao thất bại" luôn bị back-end trả lỗi "Trạng thái đơn hàng không hợp lệ".
    // Còn 'return_requested' bị map sang 6 nên yêu cầu đổi trả lại ghi thành giao thất bại.
    // Yêu cầu đổi trả không phải trạng thái đơn: nó nằm ở bảng ReturnRequests, đơn vẫn
    // giữ trạng thái 4 (Đã giao) cho tới khi admin duyệt thì BE tự chuyển sang 7.
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
    const statusId = typeof status === 'number' ? status : (statusMap[status] || 1);
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
