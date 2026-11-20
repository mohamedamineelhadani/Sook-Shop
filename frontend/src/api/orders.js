import api from '../lib/api.js';

export const getShippingConfig = () =>
  api.get('/orders/shipping').then((r) => r.data.data);

export const createOrder = (payload) => api.post('/orders', payload).then((r) => r.data.data);

export const getMyOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data.data);
