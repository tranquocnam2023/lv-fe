import api from './api';

// Service quản lý toàn bộ các thao tác API liên quan đến Yêu cầu Đổi trả & Hoàn tiền (Return & Refund)
export const returnService = {
  // Khách hàng tạo yêu cầu đổi trả cho đơn hàng
  createReturnRequest: (data) => api.post('/Return', data),

  // Lấy chi tiết yêu cầu đổi trả của 1 đơn hàng theo orderId
  getReturnRequestByOrder: (orderId) => api.get(`/Return/order/${orderId}`),

  // Khách hàng lấy toàn bộ yêu cầu đổi trả của chính mình
  getMyReturnRequests: () => api.get('/Return/my'),

  // Admin lấy danh sách tất cả các yêu cầu đổi trả
  getAllReturnRequests: () => api.get('/Return'),

  // Admin duyệt yêu cầu đổi trả & hoàn tiền (Thực hiện giao dịch 7 bước trên BE C#)
  approveReturnRequest: (id, adminNote) => api.put(`/Return/${id}/approve`, { adminNote }),

  // Admin từ chối yêu cầu đổi trả
  rejectReturnRequest: (id, adminNote) => api.put(`/Return/${id}/reject`, { adminNote }),
};

export default returnService;
