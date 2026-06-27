import api from './api';

export const shippingInfoService = {
  getAll: () => api.get('/ShippingInfo'),
  create: (data) => api.post('/ShippingInfo', data),
  update: (id, data) => api.put(`/ShippingInfo/${id}`, data),
  delete: (id) => api.delete(`/ShippingInfo/${id}`),
};
