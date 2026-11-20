import { useEffect, useState } from 'react';
import { Eye, Package, RefreshCw, Search, ShoppingCart, Tags, Users } from 'lucide-react';

import { getCartInsights } from '../api/insights.js';
import {
  getAdminOrders,
  getOrder,
  getOrderStats,
  updateOrderStatus,
} from '../api/orders.js';
import { getCategories, getProducts } from '../api/catalog.js';
import AdminPlaceholder from '../components/AdminPlaceholder.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate, formatPrice, imageUrl } from '../lib/format.js';
import { ORDER_STATUSES, statusBadge, statusLabel } from '../lib/orders.js';

export function DashboardPage() {
  const [counts, setCounts] = useState({
    products: 0,
    categories: 0,
    carts: 0,
    customers: 0,
    orders: 0,
  });

  useEffect(() => {
    let alive = true;
    Promise.all([getProducts({ limit: 1 }), getCategories(), getCartInsights(), getOrderStats()])
      .then(([products, categories, insights, orderStats]) => {
        if (!alive) return;
        setCounts({
          products: products.pagination?.total || 0,
          categories: categories.data.length,
          carts: insights.stats.carts,
          customers: insights.stats.customers,
          orders: orderStats.total,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const stats = [
    { label: 'Products', value: counts.products, icon: Package, tone: 'amber' },
    { label: 'Categories', value: counts.categories, icon: Tags, tone: 'indigo' },
    { label: 'Orders (COD)', value: counts.orders, icon: ShoppingCart, tone: 'green' },
    { label: 'Customers', value: counts.customers, icon: Users, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Store overview</h2>
          <p>Live numbers from your store, updated every time this page opens.</p>
        </div>
        <span className="admin-pill">Cash on delivery only</span>
      </div>

      <div className="admin-stats">
        {stats.map(({ label, value, icon: Icon, tone }) => (
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

      <AdminPlaceholder
        title="Live dashboard"
        description="Charts and low-stock alerts are added in the final polish step."
        steps={[
          'Build dashboard summary endpoints in the API',
          'Show recent COD orders and low-stock alerts',
          'Add charts with real data from MongoDB',
        ]}
      />
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order number, customer or phone"
            aria-label="Search orders"
          />
        </label>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
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

export function UsersPage() {
  return (
    <AdminPlaceholder
      title="Customer management"
      description="View registered customers and their order history. Admin accounts are managed here too."
      steps={[
        'Create the customers table with order history',
        'Add account status controls',
        'Show live customer counts on the dashboard',
      ]}
    />
  );
}
