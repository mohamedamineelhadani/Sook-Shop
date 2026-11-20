import { useEffect, useState } from 'react';
import { MailCheck, MailX, RefreshCw, Search, Trash2, Users } from 'lucide-react';

import {
  deleteNewsletterSubscriber,
  getNewsletterSubscribers,
} from '../api/newsletter.js';
import { formatDate } from '../lib/format.js';

export default function AdminNewsletterPage() {
  const [result, setResult] = useState({ data: [], stats: { total: 0, active: 0, inactive: 0 } });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    const params = { limit: 100 };
    if (statusFilter === 'active') params.isActive = 'true';
    if (statusFilter === 'inactive') params.isActive = 'false';

    getNewsletterSubscribers(params)
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
  }, [refreshKey, statusFilter]);

  const subscribers = result.data.filter((subscriber) =>
    subscriber.email.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const refresh = () => {
    setActionError('');
    setRefreshKey((key) => key + 1);
  };

  const remove = async (subscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from the list?`)) return;
    setActionError('');
    try {
      await deleteNewsletterSubscriber(subscriber._id);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const cards = [
    { label: 'Total signups', value: result.stats.total, icon: Users, tone: 'indigo' },
    { label: 'Active', value: result.stats.active, icon: MailCheck, tone: 'green' },
    { label: 'Inactive', value: result.stats.inactive, icon: MailX, tone: 'amber' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Newsletter</h2>
          <p>Emails captured by the “Get 20% Off” form on the storefront home page.</p>
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

      <div className="admin-note">
        This demo only stores emails so the team can see signups. No marketing emails are sent.
      </div>

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
            placeholder="Search email address"
            aria-label="Search subscribers"
          />
        </label>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All subscribers</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="admin-result-count">{subscribers.length} emails</span>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading subscribers…</div>
        ) : subscribers.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Subscribed</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber._id}>
                  <td>
                    <strong>{subscriber.email}</strong>
                  </td>
                  <td>{subscriber.source || 'home'}</td>
                  <td>
                    <span
                      className={`admin-badge ${subscriber.isActive ? 'badge-green' : 'badge-muted'}`}
                    >
                      {subscriber.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(subscriber.createdAt)}</td>
                  <td>
                    <button
                      className="admin-icon-button danger"
                      title="Delete subscriber"
                      aria-label="Delete subscriber"
                      onClick={() => remove(subscriber)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No signups match this view.</div>
        )}
      </div>
    </>
  );
}
