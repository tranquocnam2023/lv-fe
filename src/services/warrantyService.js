import api from './api';

export const warrantyService = {
  // Lấy danh sách tất cả gói bảo hành khả dụng
  getAllWarranties: () => api.get('/Warranty'),

  // Lấy các gói bảo hành áp dụng cho một biến thể sản phẩm
  getWarrantiesForVariant: (variantId) => api.get(`/Warranty/variants/${variantId}`),

  // Lấy danh sách thiết bị & bảo hành của User
  getMyDevices: () => api.get('/Warranty/my-devices'),

  // Kích hoạt / Cập nhật IMEI cho thiết bị của User
  activateImei: (data) => api.post('/Warranty/activate-imei', data),

  // Đặt mua lẻ gói bảo hành
  standaloneCheckout: (data) => api.post('/Warranty/standalone/checkout', data),

  // Cập nhật trạng thái thẩm định cho KTV
  inspectOrderItem: (orderItemId, data) => api.put(`/AdminWarranty/order-items/${orderItemId}/inspect`, data),

  // ================= ADMIN: TRA CỨU BẢO HÀNH KHÁCH HÀNG & IMEI =================
  getCustomerWarranties: (params) => api.get('/AdminWarranty/customer-warranties', { params }),

  updateDeviceImei: (data) => api.put('/AdminWarranty/update-device-imei', data),

  // ================= CRUD CÁC GÓI BẢO HÀNH (ADMIN) =================
  getAllPackages: () => api.get('/AdminWarranty/packages'),
  
  createPackage: (data) => api.post('/AdminWarranty/packages', data),
  
  updatePackage: (id, data) => api.put(`/AdminWarranty/packages/${id}`, data),
  
  deletePackage: (id) => api.delete(`/AdminWarranty/packages/${id}`)
};
