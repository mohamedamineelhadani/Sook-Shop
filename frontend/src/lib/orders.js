export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const statusLabel = (status) =>
  ({
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  })[status] || status;

export const statusTone = (status) =>
  ({
    pending: 'wait',
    confirmed: 'info',
    processing: 'info',
    shipped: 'info',
    delivered: 'done',
    cancelled: 'bad',
  })[status] || 'wait';
