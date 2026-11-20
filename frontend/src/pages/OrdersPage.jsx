import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getMyOrders } from '../api/orders.js';
import { ErrorState, LoadingState } from '../components/States.jsx';
import { formatDate, formatPrice, imageUrl } from '../lib/format.js';
import { statusLabel, statusTone } from '../lib/orders.js';

export default function OrdersPage() {
  const [result, setResult] = useState({ data: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getMyOrders({ limit: 50 })
      .then((data) => {
        if (!alive) return;
        setResult(data);
        setLoaded(true);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const orders = result.data || [];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>My orders</span>
          </div>
          <h1>My orders</h1>
          <p>Every order is cash on delivery — track its progress here.</p>
        </div>
      </section>

      <section className="container">
        {!loaded ? (
          <LoadingState label="Loading your orders…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : orders.length === 0 ? (
          <div className="state-box" style={{ margin: '40px 0' }}>
            <span aria-hidden="true">📦</span>
            <p className="state-title">No orders yet</p>
            <p>When you place a cash-on-delivery order, it will appear here.</p>
            <Link to="/shop" className="btn btn--indigo" style={{ marginTop: 16 }}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-head">
                  <div>
                    <span className="order-number">{order.orderNumber || 'Order'}</span>
                    <span className="order-date">Placed {formatDate(order.placedAt)}</span>
                  </div>
                  <span className={`order-status is-${statusTone(order.orderStatus)}`}>
                    {statusLabel(order.orderStatus)}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-thumbs">
                    {order.items.slice(0, 4).map((item, index) => (
                      <img
                        key={`${item.product}-${index}`}
                        src={imageUrl(item.image, 200)}
                        title={item.name}
                        alt=""
                      />
                    ))}
                  </div>
                  <div className="order-meta">
                    <strong>{order.itemCount ?? order.items.length} items</strong>
                    <span>
                      {order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}
                      {' · '}
                      {order.paymentStatus === 'paid' ? 'Cash collected' : 'Pay on delivery'}
                    </span>
                  </div>
                  <div className="order-total">
                    <span>Total</span>
                    <strong>{formatPrice(order.total)}</strong>
                  </div>
                  <Link to={`/orders/${order._id}`} className="btn btn--ghost btn--sm">
                    View details →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
