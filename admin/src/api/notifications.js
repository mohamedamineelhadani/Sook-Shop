import api from '../lib/api.js';

export const getAdminNotifications = () =>
  api.get('/admin/notifications').then((r) => r.data.data);

export const markAdminNotificationRead = (id) =>
  api.patch(`/admin/notifications/${encodeURIComponent(id)}/read`).then((r) => r.data.data);
