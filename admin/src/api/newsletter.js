import api from '../lib/api.js';

export const getNewsletterSubscribers = (params = {}) =>
  api.get('/admin/newsletter', { params }).then((r) => r.data);

export const deleteNewsletterSubscriber = (id) =>
  api.delete(`/admin/newsletter/${id}`).then((r) => r.data);
