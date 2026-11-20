import api from '../lib/api.js';

export const getWishlist = () => api.get('/wishlist').then((r) => r.data.data);
export const addWishlist = (productId) => api.post(`/wishlist/${productId}`).then((r) => r.data.data);
export const removeWishlist = (productId) =>
  api.delete(`/wishlist/${productId}`).then((r) => r.data.data);
export const syncWishlist = (productIds) =>
  api.post('/wishlist/sync', { productIds }).then((r) => r.data.data);
