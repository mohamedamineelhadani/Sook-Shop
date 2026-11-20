import api from '../lib/api.js';

export const subscribeNewsletter = (email, source = 'home') =>
  api.post('/newsletter/subscribe', { email, source }).then((r) => r.data);

export const unsubscribeNewsletter = (email) =>
  api.post('/newsletter/unsubscribe', { email }).then((r) => r.data);
