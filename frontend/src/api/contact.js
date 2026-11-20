import api from '../lib/api.js';

export const sendContactMessage = (payload) =>
  api.post('/contact', payload).then((r) => r.data);
