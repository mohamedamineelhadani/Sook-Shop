import api from '../lib/api.js';

export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const logout = () => api.post('/auth/logout').then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
export const getAdminProfile = () => api.get('/admin/profile').then((r) => r.data.data);
export const updateAdminProfile = (payload) =>
  api.patch('/admin/profile', payload).then((r) => r.data);
export const changeAdminPassword = (payload) =>
  api.patch('/admin/profile/password', payload).then((r) => r.data);
