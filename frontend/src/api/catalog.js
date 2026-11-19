import api from '../lib/api.js';

export const getProducts = (params = {}) => api.get('/products', { params }).then((r) => r.data);
export const getProduct = (slug) => api.get(`/products/${slug}`).then((r) => r.data);
export const getCategories = (params = {}) =>
  api.get('/categories', { params }).then((r) => r.data);
export const getBrands = () => api.get('/products/brands').then((r) => r.data);

export const createProduct = (payload) => api.post('/products', payload).then((r) => r.data);
export const updateProduct = (id, payload) =>
  api.put(`/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);

export const createCategory = (payload) =>
  api.post('/categories', payload).then((r) => r.data);
export const updateCategory = (id, payload) =>
  api.put(`/categories/${id}`, payload).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);
