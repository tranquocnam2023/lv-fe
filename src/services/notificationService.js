import api from './api';

export const notificationService = {
  getNotifications: () => api.get('/Notification'),
  markAsRead: (id) => api.put(`/Notification/${id}/read`),
  markAllAsRead: () => api.put('/Notification/read-all')
};
