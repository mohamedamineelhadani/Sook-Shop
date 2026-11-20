import { useEffect, useState } from 'react';
import { Heart, RefreshCw, ShoppingCart, Users } from 'lucide-react';

import { getCartInsights } from '../api/insights.js';
import { formatPrice, imageUrl } from '../lib/format.js';

const emptyStats = { carts: 0, cartItems: 0, customers: 0, wishlistEntries: 0, savedProducts: 0 };

export default function InsightsPage() {
  const [data, setData] = useState({ stats: emptyStats, carts: [], wishlists: [], popular: [] });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    getCartInsights()
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

  const { stats, carts, wishlists, popular } = data;

  const cards = [
    { label: 'Active carts', value: stats.carts, icon: ShoppingCart, tone: 'green' },
    { label: 'Items in carts', value: stats.cartItems, icon: ShoppingCart, tone: 'amber' },
    { label: 'Wishlist entries', value: stats.wishlistEntries, icon: Heart, tone: 'purple' },
    { label: 'Saved products', value: stats.savedProducts, icon: Heart, tone: 'indigo' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Cart &amp; wishlist insights</h2>
          <p>A read-only look at what shoppers are saving and planning to order with cash on delivery.</p>
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
              <strong>{loading ? '…' : value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-insight-grid">
        <div className="admin-card admin-table-wrap">
          <div className="admin-insight-head">
            <h3><ShoppingCart size={16} /> Customer carts</h3>
            <span>{stats.customers} customers</span>
          </div>
          {loading ? (
            <div className="admin-loading">Loading carts…</div>
          ) : carts.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id}>
                    <td>
                      <strong>{cart.user?.name || 'Unknown shopper'}</strong>
                      <span className="admin-product-cell span">{cart.user?.email || '—'}</span>
                    </td>
                    <td>
                      <span className="admin-badge badge-indigo">{cart.items.length}</span>
                      <div className="admin-insight-preview">
                        {cart.items.slice(0, 3).map((item) => (
                          <img key={item.productId} src={imageUrl(item.image)} title={item.name} alt="" />
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong>
                        {formatPrice(cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-loading">No carts yet.</div>
          )}
        </div>

        <div className="admin-card admin-table-wrap">
          <div className="admin-insight-head">
            <h3><Heart size={16} /> Customer wishlists</h3>
            <span>{wishlists.length} shoppers</span>
          </div>
          {loading ? (
            <div className="admin-loading">Loading wishlists…</div>
          ) : wishlists.length ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Saved</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {wishlists.map((wishlist) => (
                  <tr key={wishlist.id}>
                    <td>
                      <strong>{wishlist.name}</strong>
                      <span className="admin-product-cell span">{wishlist.email}</span>
                    </td>
                    <td>
                      <span className="admin-badge badge-indigo">{wishlist.products.length}</span>
                    </td>
                    <td>
                      <div className="admin-insight-preview">
                        {wishlist.products.slice(0, 4).map((product) => (
                          <img key={product.id} src={imageUrl(product.image)} title={product.name} alt="" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-loading">No saved products yet.</div>
          )}
        </div>
      </div>

      <div className="admin-card admin-popular">
        <div className="admin-insight-head">
          <h3><Users size={16} /> Most saved &amp; carted products</h3>
          <span>Based on current carts and wishlists</span>
        </div>
        {loading ? (
          <div className="admin-loading">Loading popularity…</div>
        ) : popular.length ? (
          <div className="admin-popular-list">
            {popular.map((product, index) => (
              <div className="admin-popular-row" key={product.id}>
                <span className="admin-popular-rank">{index + 1}</span>
                <img src={imageUrl(product.image)} alt="" />
                <div className="admin-popular-name">
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                </div>
                <span className="admin-badge badge-green">{product.inCarts} in carts</span>
                <span className="admin-badge badge-indigo">{product.inWishlists} saved</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-loading">No activity to rank yet.</div>
        )}
      </div>
    </>
  );
}
