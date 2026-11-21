import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Mail,
  Send,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import {
  getAdminNotifications,
  markAdminNotificationRead,
} from '../api/notifications.js';
import { formatDate } from '../lib/format.js';
import {
  publishNotificationUpdate,
  subscribeNotificationUpdates,
} from '../lib/notificationEvents.js';

const icons = {
  mail: Mail,
  cart: ShoppingCart,
  alert: AlertTriangle,
  star: Star,
  send: Send,
  users: Users,
};

const emptyData = { notifications: [], unread: 0, summary: {} };

export default function AdminNotifications() {
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const [data, setData] = useState(emptyData);
  const [open, setOpen] = useState(false);
  const [markingId, setMarkingId] = useState('');

  const load = useCallback(() => {
    getAdminNotifications()
      .then(setData)
      .catch(() => setData(emptyData));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeNotificationUpdates(setData), []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleNotificationClick = async (event, item) => {
    event.preventDefault();
    setOpen(false);
    if (markingId) return;

    setMarkingId(item.id);
    try {
      const result = await markAdminNotificationRead(item.id);
      setData(result);
      publishNotificationUpdate(result);
      navigate(item.to);
    } catch {
      load();
      navigate(item.to);
    } finally {
      setMarkingId('');
    }
  };

  return (
    <div className="admin-notifications" ref={wrapRef}>
      <button
        className="admin-icon-button admin-notification-button"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {data.unread > 0 && <span className="admin-notification-dot">{data.unread}</span>}
      </button>

      {open && (
        <div className="admin-notification-popover">
          <div className="admin-popover-head">
            <strong>Notifications</strong>
            <span>{data.unread} new</span>
          </div>

          {data.notifications.length ? (
            <div className="admin-notification-list">
              {data.notifications.slice(0, 5).map((item) => {
                const Icon = icons[item.icon] || Bell;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="admin-notification-item"
                    aria-disabled={markingId === item.id}
                    onClick={(event) => handleNotificationClick(event, item)}
                  >
                    <span className={`admin-notification-icon tone-${item.tone}`}>
                      <Icon size={15} />
                    </span>
                    <span className="admin-notification-copy">
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                      {item.time && <time>{formatDate(item.time)}</time>}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="admin-search-status">Everything is up to date.</div>
          )}

          <Link
            to="/notifications"
            className="admin-popover-foot"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
