import api from '../lib/api.js';

export const getAdminReviews = (params = {}) =>
  api.get('/admin/reviews', { params }).then((r) => r.data);

export const getReviewStats = () =>
  api.get('/admin/review-stats').then((r) => r.data.data);

export const setReviewVisibility = (id, isVisible) =>
  api.patch(`/admin/reviews/${id}/visibility`, { isVisible }).then((r) => r.data);

export const deleteReview = (id) => api.delete(`/reviews/${id}`).then((r) => r.data);
