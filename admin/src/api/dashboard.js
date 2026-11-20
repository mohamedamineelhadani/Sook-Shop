import api from '../lib/api.js';

export const getDashboard = () => api.get('/admin/dashboard').then((r) => r.data.data);
