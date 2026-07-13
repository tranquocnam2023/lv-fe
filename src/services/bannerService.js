import api from './api';

export const bannerService = {
  // Client/homepage: get published active banners
  getBanners: () => api.get('/Banner'),

  // Admin: get draft banners
  getDraftBanners: () => api.get('/Banner/draft'),

  // Admin: get published banners
  getPublishedBanners: () => api.get('/Banner/published'),

  // Admin: bulk update draft banners
  updateDraftBanners: (drafts) => api.put('/Banner/draft', drafts),

  // Admin: publish drafts
  publishBanners: () => api.post('/Banner/publish'),

  // Admin: discard drafts
  discardBanners: () => api.post('/Banner/discard')
};
