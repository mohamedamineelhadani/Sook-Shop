import api from '../lib/api.js';

export const adminSearch = (query) =>
  api.get('/admin/search', { params: { q: query } }).then((r) => r.data.data);
