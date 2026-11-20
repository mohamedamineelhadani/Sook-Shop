import api from '../lib/api.js';

export const getAdminCustomers = (params = {}) =>
  api.get('/admin/customers', { params }).then((r) => r.data);

export const getCustomer = (id) => api.get(`/admin/customers/${id}`).then((r) => r.data.data);

export const setCustomerActive = (id, isActive) =>
  api.patch(`/admin/customers/${id}/active`, { isActive }).then((r) => r.data);
