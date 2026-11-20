import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Mail,
  RefreshCw,
  Send,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { getAdminNotifications } from '../api/notifications.js';
import { formatDate } from '../lib/format.js';

const icons = {
  mail: Mail,
  cart: ShoppingCart,
  alert: AlertTriangle,
  star: Star,
  send: Send,
  users: Users,
};

const emptyData = { notifications: [], unread: 0, summary: {} };

export default function AdminNotificationsPage() {
  const [data, setData] = useState(emptyData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    getAdminNotifications()
      .then((result) => {
        if (!alive) return;
        setData(result);
        setError('');
        setLoadedKey(refreshKey);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setLoadedKey(refreshKey);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const summary = data.summary || {};

  const cards = [
    { label: 'Unread messages', value: summary.unreadMessages || 0, icon: Mail, tone: 'indigo' },
    { label: 'Orders to review', value: summary.pendingOrders || 0, icon: ShoppingCart, tone: 'amber' },
    { label: 'Low stock', value: summary.lowStock || 0, icon: AlertTriangle, tone: 'rose' },
    { label: 'Hidden reviews', value: summary.hiddenReviews || 0, icon: Star, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Notifications</h2>
          <p>Actionable alerts generated from live store data.</p>
        </div>
        <button
          className="admin-button admin-button--ghost"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-stats">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="admin-stat" key={label}>
            <span className={`admin-stat-icon tone-${tone}`}>
              <Icon size={19} />
            </span>
            <div>
              <span className="admin-stat-label">{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card admin-notification-page-list">
        {loading ? (
          <div className="admin-loading">Loading notifications…</div>
        ) : data.notifications.length ? (
          data.notifications.map((item) => {
            const Icon = icons[item.icon] || Bell;
            return (
              <Link key={item.id} to={item.to} className="admin-notification-row">
                <span className={`admin-notification-icon tone-${item.tone}`}>
                  <Icon size={18} />
                </span>
                <span className="admin-notification-copy">
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                  {item.time && <time>Updated {formatDate(item.time)}</time>}
                </span>
                <span className="admin-notification-arrow">Open →</span>
              </Link>
            );
          })
        ) : (
          <div className="admin-empty">
            No alerts right now. Inboxes, stock and orders all look good.
          </div>
        )}
      </div>
    </>
  );
}
