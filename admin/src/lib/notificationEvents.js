export const NOTIFICATIONS_UPDATED_EVENT = 'sookshop:notifications-updated';

export function publishNotificationUpdate(data) {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: data }));
}

export function subscribeNotificationUpdates(onUpdate) {
  const handler = (event) => onUpdate(event.detail);
  window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
}
