import api from './api';

export const wishlistService = {
  getWishlist: () => api.get('/Wishlist'),
  toggleWishlist: (productId) => api.post('/Wishlist/toggle', { productId }),
  updateNotificationSettings: (productId, notifyOnPriceDrop, notifyOnRestock) =>
    api.put('/Wishlist/notification-settings', { productId, notifyOnPriceDrop, notifyOnRestock }),
  checkWishlistStatus: (productId) => api.get(`/Wishlist/check/${productId}`)
};
