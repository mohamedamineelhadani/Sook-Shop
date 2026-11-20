import api from '../lib/api.js';

export const getAdminNotifications = () =>
  api.get('/admin/notifications').then((r) => r.data.data);
