import api from '../lib/api.js';

export const getCart = () => api.get('/cart').then((r) => r.data.data);
export const addCartItem = (payload) => api.post('/cart/items', payload).then((r) => r.data.data);
export const setCartQuantity = (payload) =>
  api.patch('/cart/items', payload).then((r) => r.data.data);
export const removeCartItem = (payload) =>
  api.delete('/cart/items', { data: payload }).then((r) => r.data.data);
export const clearCart = () => api.delete('/cart').then((r) => r.data.data);
export const syncCart = (items) => api.post('/cart/sync', { items }).then((r) => r.data.data);
