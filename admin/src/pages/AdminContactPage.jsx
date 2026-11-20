import { useEffect, useState } from 'react';
import { Check, Inbox, Mail, MailOpen, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react';

import { deleteMessage, getAdminMessages, setMessageRead } from '../api/contact.js';
import { formatDate } from '../lib/format.js';

export default function AdminContactPage() {
  const [result, setResult] = useState({ data: [], stats: { total: 0, unread: 0, read: 0 } });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    const params = { limit: 100 };
    if (readFilter === 'unread') params.isRead = 'false';
    if (readFilter === 'read') params.isRead = 'true';

    getAdminMessages(params)
      .then((data) => {
        if (!alive) return;
        setResult(data);
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
  }, [refreshKey, readFilter]);

  const messages = result.data.filter((message) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [message.name, message.email, message.subject, message.message]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const refresh = () => {
    setActionError('');
    setRefreshKey((key) => key + 1);
  };

  const markRead = async (message, isRead) => {
    setActionError('');
    try {
      await setMessageRead(message._id, isRead);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const remove = async (message) => {
    if (!window.confirm('Permanently delete this message?')) return;
    setActionError('');
    try {
      await deleteMessage(message._id);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const cards = [
    { label: 'Total messages', value: result.stats.total, icon: Inbox, tone: 'indigo' },
    { label: 'Unread', value: result.stats.unread, icon: Mail, tone: 'amber' },
    { label: 'Read', value: result.stats.read, icon: MailOpen, tone: 'green' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Contact inbox</h2>
          <p>Messages saved from the storefront contact form. Nothing is emailed from this demo.</p>
        </div>
        <button
          className="admin-button admin-button--ghost"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="admin-form-error">{error}</div>}
      {actionError && <div className="admin-form-error">{actionError}</div>}

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

      <div className="admin-toolbar">
        <label className="admin-search" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or message"
            aria-label="Search messages"
          />
        </label>
        <select
          className="admin-select"
          value={readFilter}
          onChange={(event) => setReadFilter(event.target.value)}
          aria-label="Filter by read status"
        >
          <option value="">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <span className="admin-result-count">{messages.length} messages</span>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading messages…</div>
        ) : messages.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Received</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message._id}>
                  <td>
                    <div className="admin-order-cell">
                      <strong>{message.name}</strong>
                      <span>{message.email}</span>
                    </div>
                  </td>
                  <td>{message.subject}</td>
                  <td>
                    <div className="admin-message-preview">{message.message}</div>
                  </td>
                  <td>
                    <span
                      className={`admin-badge ${message.isRead ? 'badge-muted' : 'badge-indigo'}`}
                    >
                      {message.isRead ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td>{formatDate(message.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-button"
                        title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                        aria-label={message.isRead ? 'Mark as unread' : 'Mark as read'}
                        onClick={() => markRead(message, !message.isRead)}
                      >
                        {message.isRead ? <RotateCcw size={15} /> : <Check size={15} />}
                      </button>
                      <button
                        className="admin-icon-button danger"
                        title="Delete message"
                        aria-label="Delete message"
                        onClick={() => remove(message)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No messages match this view.</div>
        )}
      </div>
    </>
  );
}
