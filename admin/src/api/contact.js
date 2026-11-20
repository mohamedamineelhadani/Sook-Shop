import api from '../lib/api.js';

export const getAdminMessages = (params = {}) =>
  api.get('/admin/contact-messages', { params }).then((r) => r.data);

export const setMessageRead = (id, isRead) =>
  api.patch(`/admin/contact-messages/${id}/read`, { isRead }).then((r) => r.data);

export const deleteMessage = (id) =>
  api.delete(`/admin/contact-messages/${id}`).then((r) => r.data);
