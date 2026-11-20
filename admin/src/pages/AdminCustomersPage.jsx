import { useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  DollarSign,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  getAdminCustomers,
  getCustomer,
  setCustomerActive,
} from '../api/customers.js';
import Modal from '../components/Modal.jsx';
import { formatDate, formatPrice } from '../lib/format.js';
import { statusBadge, statusLabel } from '../lib/orders.js';

const emptyResult = {
  data: [],
  stats: { total: 0, active: 0, inactive: 0, withOrders: 0 },
  pagination: { total: 0 },
};

const initialsFor = (name) =>
  String(name || 'Customer')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

function formatAddress(address = {}) {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.postalCode].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'No address saved';
}

export default function AdminCustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';

  const [result, setResult] = useState(emptyResult);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState(null);

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    const params = { limit: 100 };
    if (query) params.q = query;
    if (status === 'active') params.isActive = 'true';
    if (status === 'inactive') params.isActive = 'false';

    getAdminCustomers(params)
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
  }, [query, status, refreshKey]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const refresh = () => {
    setActionError('');
    setRefreshKey((key) => key + 1);
  };

  const openCustomer = async (customer) => {
    setActionError('');
    try {
      setSelected(await getCustomer(customer.id));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const toggleActive = async (customer) => {
    setActionError('');
    try {
      await setCustomerActive(customer.id, !customer.isActive);
      setSelected(null);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const cards = [
    { label: 'Total customers', value: result.stats.total, icon: Users, tone: 'indigo' },
    { label: 'Active', value: result.stats.active, icon: UserCheck, tone: 'green' },
    { label: 'With orders', value: result.stats.withOrders, icon: ShoppingBag, tone: 'purple' },
    {
      label: 'Inactive',
      value: result.stats.inactive,
      icon: Ban,
      tone: 'rose',
    },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Customers</h2>
          <p>View registered customers, their orders and account status.</p>
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
            value={query}
            onChange={(event) => updateParam('q', event.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search customers"
          />
        </label>
        <select
          className="admin-select"
          value={status}
          onChange={(event) => updateParam('status', event.target.value)}
          aria-label="Filter by account status"
        >
          <option value="">All accounts</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="admin-result-count">{result.data.length} customers</span>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading customers…</div>
        ) : result.data.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Reviews</th>
                <th>Joined</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {result.data.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="admin-customer-cell">
                      <span className="admin-customer-avatar">{initialsFor(customer.name)}</span>
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{customer.phone || '—'}</td>
                  <td>
                    <span className="admin-badge badge-indigo">{customer.orderCount}</span>
                  </td>
                  <td>
                    <strong>{formatPrice(customer.totalSpent)}</strong>
                  </td>
                  <td>{customer.reviewCount}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>
                    <span
                      className={`admin-badge ${customer.isActive ? 'badge-green' : 'badge-muted'}`}
                    >
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-button"
                        title="View customer"
                        aria-label={`View ${customer.name}`}
                        onClick={() => openCustomer(customer)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="admin-icon-button"
                        title={customer.isActive ? 'Deactivate account' : 'Activate account'}
                        aria-label={customer.isActive ? 'Deactivate account' : 'Activate account'}
                        onClick={() => toggleActive(customer)}
                      >
                        {customer.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No customers match your filters.</div>
        )}
      </div>

      {selected && (
        <Modal title={`Customer · ${selected.name}`} onClose={() => setSelected(null)}>
          <div className="admin-modal-body">
            {actionError && <div className="admin-form-error">{actionError}</div>}

            <div className="admin-customer-detail-head">
              <span className="admin-customer-avatar is-large">
                {initialsFor(selected.name)}
              </span>
              <div>
                <strong>{selected.name}</strong>
                <span>{selected.email}</span>
                <span className="admin-customer-since">Joined {formatDate(selected.createdAt)}</span>
              </div>
              <span
                className={`admin-badge ${selected.isActive ? 'badge-green' : 'badge-muted'}`}
              >
                {selected.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="admin-customer-metrics">
              <div>
                <ShoppingBag size={16} />
                <span>Orders</span>
                <strong>{selected.orderCount}</strong>
              </div>
              <div>
                <DollarSign size={16} />
                <span>Total spent</span>
                <strong>{formatPrice(selected.totalSpent)}</strong>
              </div>
              <div>
                <Star size={16} />
                <span>Reviews</span>
                <strong>{selected.reviewCount}</strong>
              </div>
            </div>

            <div className="admin-customer-sections">
              <section>
                <h4>Contact &amp; address</h4>
                <p><Mail size={13} /> {selected.email}</p>
                <p><Phone size={13} /> {selected.phone || 'No phone saved'}</p>
                <p><MapPin size={13} /> {formatAddress(selected.address)}</p>
                <p className="admin-order-note">
                  Last login: {selected.lastLogin ? formatDate(selected.lastLogin) : 'Never'}
                </p>
              </section>

              <section>
                <h4>Recent orders</h4>
                {selected.recentOrders.length ? (
                  <div className="admin-mini-list">
                    {selected.recentOrders.map((order) => (
                      <div className="admin-customer-order" key={order._id}>
                        <div>
                          <strong>{order.orderNumber || order._id}</strong>
                          <span>{formatDate(order.placedAt)}</span>
                        </div>
                        <span className={`admin-badge ${statusBadge(order.orderStatus)}`}>
                          {statusLabel(order.orderStatus)}
                        </span>
                        <b>{formatPrice(order.total)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-order-note">No orders placed yet.</p>
                )}
              </section>

              <section>
                <h4>Recent reviews</h4>
                {selected.recentReviews.length ? (
                  <div className="admin-mini-list">
                    {selected.recentReviews.map((review) => (
                      <div className="admin-customer-review" key={review._id}>
                        <strong>{'★'.repeat(review.rating)}</strong>
                        <div>
                          <span>{review.product?.name || 'Product removed'}</span>
                          <p>{review.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-order-note">No reviews written yet.</p>
                )}
              </section>
            </div>
          </div>
          <div className="admin-modal-foot">
            <button
              type="button"
              className={`admin-button ${selected.isActive ? 'admin-button--danger' : ''}`}
              onClick={() => toggleActive(selected)}
            >
              {selected.isActive ? <Ban size={14} /> : <CheckCircle2 size={14} />}
              {selected.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
