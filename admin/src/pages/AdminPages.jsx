import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  DollarSign,
  Eye,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { getDashboard } from '../api/dashboard.js';
import {
  getAdminOrders,
  getOrder,
  getOrderStats,
  updateOrderStatus,
} from '../api/orders.js';
import Modal from '../components/Modal.jsx';
import { formatDate, formatPrice, imageUrl } from '../lib/format.js';
import { ORDER_STATUSES, statusBadge, statusLabel } from '../lib/orders.js';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getDashboard()
      .then((dashboard) => {
        if (!alive) return;
        setData(dashboard);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Could not load the dashboard.');
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    getDashboard()
      .then((dashboard) => {
        setData(dashboard);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load the dashboard.');
        setLoading(false);
      });
  };

  if (loading && !data) return <div className="admin-loading">Loading dashboard…</div>;

  const stats = data?.stats || {};
  const daily = data?.daily || [];
  const byStatus = data?.byStatus || {};
  const reviewData = data?.reviews || { average: 0, distribution: {} };
  const recentOrders = data?.recentOrders || [];
  const lowStock = data?.lowStock || [];
  const topProducts = data?.topProducts || [];
  const maxOrders = Math.max(1, ...daily.map((day) => day.orders));
  const weekOrders = daily.reduce((sum, day) => sum + day.orders, 0);
  const weekRevenue = daily.reduce((sum, day) => sum + day.revenue, 0);
  const statusTotal = ORDER_STATUSES.reduce((sum, status) => sum + (byStatus[status] || 0), 0);
  const reviewTotal = Object.values(reviewData.distribution || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  const statCards = [
    { label: 'Products', value: stats.products || 0, icon: Package, tone: 'amber' },
    { label: 'Categories', value: stats.categories || 0, icon: Tags, tone: 'indigo' },
    { label: 'Customers', value: stats.customers || 0, icon: Users, tone: 'purple' },
    { label: 'COD orders', value: stats.orders || 0, icon: ShoppingCart, tone: 'green' },
    { label: 'Order value', value: formatPrice(stats.revenue || 0), icon: DollarSign, tone: 'indigo' },
    {
      label: 'Cash collected',
      value: formatPrice(stats.collected || 0),
      icon: Wallet,
      tone: 'green',
    },
    { label: 'Average rating', value: `${reviewData.average || 0}/5`, icon: Star, tone: 'amber' },
    { label: 'Low stock', value: stats.lowStock || 0, icon: AlertTriangle, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Store overview</h2>
          <p>Live numbers from your store, refreshed directly from MongoDB.</p>
        </div>
        <div className="admin-dashboard-actions">
          <span className="admin-pill">Cash on delivery only</span>
          <button
            type="button"
            className="admin-button admin-button--ghost"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'is-spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-stats">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
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

      <div className="admin-dashboard-grid">
        <section className="admin-card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <h3>
              <ShoppingCart size={15} /> Orders &amp; revenue
            </h3>
            <span>
              {weekOrders} orders · {formatPrice(weekRevenue)} · last 7 days
            </span>
          </div>
          <div className="admin-chart" role="img" aria-label="Orders placed per day, last 7 days">
            {daily.map((day) => (
              <div className="admin-chart-col" key={day.date}>
                <div className="admin-chart-track">
                  <span className="admin-chart-value">{day.orders}</span>
                  <span
                    className="admin-chart-bar"
                    style={{ height: `${Math.max(3, (day.orders / maxOrders) * 100)}%` }}
                    title={`${day.label}: ${day.orders} order(s), ${formatPrice(day.revenue)} revenue`}
                  />
                </div>
                <span className="admin-chart-label">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-chart-legend">
            <span className="admin-legend-dot" /> Orders placed · cancelled orders excluded from
            revenue
          </div>
        </section>

        <section className="admin-card admin-panel">
          <div className="admin-panel-head">
            <h3>
              <ShoppingCart size={15} /> Order status
            </h3>
            <span>{statusTotal} total</span>
          </div>
          <div className="admin-breakdown">
            {ORDER_STATUSES.map((status) => {
              const count = byStatus[status] || 0;
              const tone =
                status === 'cancelled'
                  ? 'is-rose'
                  : status === 'shipped' || status === 'delivered'
                    ? 'is-green'
                    : '';
              return (
                <div className="admin-breakdown-row" key={status}>
                  <span>{statusLabel(status)}</span>
                  <span className={`admin-progress ${tone}`}>
                    <span style={{ width: `${(count / (statusTotal || 1)) * 100}%` }} />
                  </span>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-card admin-panel">
          <div className="admin-panel-head">
            <h3>
              <Star size={15} /> Customer reviews
            </h3>
            <span>
              {reviewTotal} total · {stats.hiddenReviews || 0} hidden
            </span>
          </div>
          <div className="admin-rating-summary">
            <strong>{reviewData.average || 0}</strong>
            <div>
              <span className="admin-review-stars">★★★★★</span>
              <small>Average rating out of 5</small>
            </div>
          </div>
          <div className="admin-breakdown">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewData.distribution?.[rating] || 0;
              return (
                <div className="admin-breakdown-row" key={rating}>
                  <span>{rating} ★</span>
                  <span className="admin-progress is-amber">
                    <span style={{ width: `${(count / (reviewTotal || 1)) * 100}%` }} />
                  </span>
                  <b>{count}</b>
                </div>
              );
            })}
          </div>
          <Link to="/reviews" className="admin-link">
            Moderate reviews →
          </Link>
        </section>

        <section className="admin-card admin-panel admin-panel--wide">
          <div className="admin-panel-head">
            <h3>
              <Eye size={15} /> Recent COD orders
            </h3>
            <Link to="/orders" className="admin-link">
              View all orders →
            </Link>
          </div>
          {recentOrders.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="admin-order-number">
                          {order.orderNumber || order.id}
                        </span>
                      </td>
                      <td>{order.customer}</td>
                      <td>{formatDate(order.placedAt)}</td>
                      <td>{order.itemCount}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td>
                        <span className={`admin-badge ${statusBadge(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty">No orders yet. Demo orders can be added with seed:demo.</div>
          )}
        </section>

        <section className="admin-card admin-panel">
          <div className="admin-panel-head">
            <h3>
              <AlertTriangle size={15} /> Low stock
            </h3>
            <Link to="/products" className="admin-link">
              Manage stock →
            </Link>
          </div>
          {lowStock.length ? (
            <div className="admin-mini-list">
              {lowStock.map((product) => (
                <div className="admin-mini-row" key={product.id}>
                  <img src={imageUrl(product.image)} alt="" />
                  <div className="admin-mini-copy">
                    <strong>{product.name}</strong>
                    <span>{formatPrice(product.price)}</span>
                  </div>
                  <span className="admin-badge badge-rose">{product.stock} left</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">All active products have healthy stock.</div>
          )}
        </section>

        <section className="admin-card admin-panel">
          <div className="admin-panel-head">
            <h3>
              <Package size={15} /> Top sellers
            </h3>
            <span>By units sold</span>
          </div>
          {topProducts.length ? (
            <div className="admin-mini-list">
              {topProducts.map((product, index) => (
                <div className="admin-mini-row" key={product.id}>
                  <span className="admin-mini-rank">#{index + 1}</span>
                  <img src={imageUrl(product.image)} alt="" />
                  <div className="admin-mini-copy">
                    <strong>{product.name}</strong>
                    <span>
                      {product.sold} sold · {formatPrice(product.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">Sell an order to see your best products here.</div>
          )}
        </section>
      </div>
    </>
  );
}

function OrderDetails({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.orderStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateOrderStatus(order._id, status);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-modal-body">
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-order-detail-head">
          <div>
            <span className="admin-order-number">{order.orderNumber || order._id}</span>
            <span className="admin-order-sub">
              Placed {formatDate(order.placedAt)} · {order.itemCount} item(s)
            </span>
          </div>
          <span className={`admin-badge ${statusBadge(order.orderStatus)}`}>
            {statusLabel(order.orderStatus)}
          </span>
        </div>

        <div className="admin-order-sections">
          <section>
            <h4>Customer &amp; delivery</h4>
            <p>
              <strong>{order.user?.name || order.shippingAddress.fullName}</strong>
              {order.user?.email && <span> · {order.user.email}</span>}
            </p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city} {order.shippingAddress.postalCode}{' '}
              {order.shippingAddress.country}
            </p>
            <p>{order.shippingAddress.phone}</p>
            {order.notes && <p className="admin-order-note">Note: {order.notes}</p>}
          </section>

          <section>
            <h4>Items</h4>
            <div className="admin-order-items">
              {order.items.map((item, index) => (
                <div className="admin-order-item" key={`${item.product}-${index}`}>
                  <img src={imageUrl(item.image)} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity} × {formatPrice(item.price)}
                      {item.color ? ` · ${item.color}` : ''}
                      {item.size ? ` · ${item.size}` : ''}
                    </span>
                  </div>
                  <b>{formatPrice(item.price * item.quantity)}</b>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4>Order status</h4>
            <div className="admin-order-status-row">
              <select
                className="admin-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Order status"
              >
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </select>
              <button className="admin-button" onClick={save} disabled={saving || status === order.orderStatus}>
                {saving ? 'Saving…' : 'Update status'}
              </button>
            </div>
            <p className="admin-order-note">
              Marking an order as delivered records cash as collected. Payments are cash on
              delivery only.
            </p>
          </section>
        </div>

        <div className="admin-order-totals">
          <div><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>
          <div>
            <span>Shipping</span>
            <strong>{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</strong>
          </div>
          <div className="is-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
          <span className={`admin-badge ${order.paymentStatus === 'paid' ? 'badge-green' : 'badge-muted'}`}>
            {order.paymentStatus === 'paid' ? 'Cash collected' : 'Pay on delivery'}
          </span>
        </div>
      </div>
      <div className="admin-modal-foot">
        <button type="button" className="admin-button admin-button--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  );
}

export function OrdersPage() {
  const [result, setResult] = useState({ data: [] });
  const [stats, setStats] = useState({ total: 0, byStatus: {}, revenue: 0, collected: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';
  const [selected, setSelected] = useState(null);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    Promise.all([getAdminOrders({ limit: 100 }), getOrderStats()])
      .then(([orders, orderStats]) => {
        if (!alive) return;
        setResult(orders);
        setStats(orderStats);
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

  const orders = result.data.filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (order.orderNumber || '').toLowerCase().includes(term) ||
      (order.user?.name || '').toLowerCase().includes(term) ||
      (order.user?.email || '').toLowerCase().includes(term) ||
      (order.shippingAddress?.fullName || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openOrder = async (order) => {
    try {
      setSelected(await getOrder(order._id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaved = (updated) => {
    setSelected(updated);
    setRefreshKey((key) => key + 1);
  };

  const cards = [
    { label: 'Total orders', value: stats.total, icon: ShoppingCart, tone: 'indigo' },
    { label: 'Pending', value: stats.byStatus?.pending || 0, icon: ShoppingCart, tone: 'amber' },
    { label: 'Order revenue', value: formatPrice(stats.revenue || 0), icon: Package, tone: 'green' },
    { label: 'Cash collected', value: formatPrice(stats.collected || 0), icon: Users, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Orders</h2>
          <p>Review cash-on-delivery orders and move them through to delivery.</p>
        </div>
        <button
          className="admin-button admin-button--ghost"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <RefreshCw size={14} /> Refresh
        </button>
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
            onChange={(event) => updateParam('q', event.target.value)}
            placeholder="Search order number, customer or phone"
            aria-label="Search orders"
          />
        </label>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(event) => updateParam('status', event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <span className="admin-result-count">{orders.length} orders</span>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading orders…</div>
        ) : orders.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="admin-order-cell">
                      <strong>{order.orderNumber || order._id}</strong>
                      <span>{formatDate(order.placedAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-order-cell">
                      <strong>{order.user?.name || order.shippingAddress.fullName}</strong>
                      <span>{order.user?.email || order.shippingAddress.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge badge-indigo">{order.itemCount} items</span>
                    <div className="admin-insight-preview">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={`${item.product}-${index}`}
                          src={imageUrl(item.image)}
                          title={item.name}
                          alt=""
                        />
                      ))}
                    </div>
                  </td>
                  <td><strong>{formatPrice(order.total)}</strong></td>
                  <td>
                    <span className={`admin-badge ${order.paymentStatus === 'paid' ? 'badge-green' : 'badge-muted'}`}>
                      {order.paymentStatus === 'paid' ? 'Collected' : 'On delivery'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${statusBadge(order.orderStatus)}`}>
                      {statusLabel(order.orderStatus)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-button"
                        onClick={() => openOrder(order)}
                        aria-label={`View order ${order.orderNumber}`}
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No orders match your filters.</div>
        )}
      </div>

      {selected && (
        <Modal title={`Order ${selected.orderNumber || ''}`} onClose={() => setSelected(null)}>
          <OrderDetails
            order={selected}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
          />
        </Modal>
      )}
    </>
  );
}
