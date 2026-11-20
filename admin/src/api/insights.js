import api from '../lib/api.js';

export const getCartInsights = () => api.get('/admin/insights').then((r) => r.data.data);
