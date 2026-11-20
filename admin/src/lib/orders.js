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

export const statusBadge = (status) =>
  ({
    pending: 'badge-muted',
    confirmed: 'badge-indigo',
    processing: 'badge-indigo',
    shipped: 'badge-green',
    delivered: 'badge-green',
    cancelled: 'badge-rose',
  })[status] || 'badge-muted';
