import api from './api';

export const locationService = {
  getProvinces: () => api.get('/Location/provinces'),
};
