import api from '../lib/api.js';

export const getAdminOrders = (params = {}) =>
  api.get('/admin/orders', { params }).then((r) => r.data);

export const getOrderStats = () => api.get('/admin/order-stats').then((r) => r.data.data);

export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data.data);
