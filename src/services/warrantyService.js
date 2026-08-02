import api from './api';

export const warrantyService = {
  // Lấy các gói bảo hành áp dụng cho một biến thể sản phẩm
  getWarrantiesForVariant: (variantId) => api.get(`/Warranty/variants/${variantId}`),

  // Đặt mua lẻ gói bảo hành (máy cũ)
  standaloneCheckout: (data) => api.post('/Warranty/standalone/checkout', data),

  // Cập nhật trạng thái thẩm định cho KTV
  inspectOrderItem: (orderItemId, data) => api.put(`/AdminWarranty/order-items/${orderItemId}/inspect`, data),

  // ================= CRUD CÁC GÓI BẢO HÀNH (ADMIN) =================
  getAllPackages: () => api.get('/AdminWarranty/packages'),
  
  createPackage: (data) => api.post('/AdminWarranty/packages', data),
  
  updatePackage: (id, data) => api.put(`/AdminWarranty/packages/${id}`, data),
  
  deletePackage: (id) => api.delete(`/AdminWarranty/packages/${id}`)
};
