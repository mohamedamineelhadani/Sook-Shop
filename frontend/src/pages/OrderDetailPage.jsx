import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { getOrder } from '../api/orders.js';
import { ErrorState, LoadingState } from '../components/States.jsx';
import { formatDate, formatPrice, imageUrl } from '../lib/format.js';
import { statusLabel, statusTone } from '../lib/orders.js';

const TRACKED = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const placed = Boolean(location.state?.placed);
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getOrder(id)
      .then((data) => {
        if (!alive) return;
        setOrder(data);
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
  }, [id]);

  if (!loaded) {
    return (
      <section className="container" style={{ padding: '60px 24px' }}>
        <LoadingState label="Loading your order…" />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container" style={{ padding: '60px 24px' }}>
        <ErrorState message={error || 'Order not found.'} />
      </section>
    );
  }

  const currentIndex = TRACKED.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/orders">My orders</Link>
            <span className="sep">/</span>
            <span>{order.orderNumber || 'Order details'}</span>
          </div>
          <h1>{placed ? 'Order placed!' : 'Order details'}</h1>
          <p>
            {placed
              ? 'Thanks for shopping with us. Keep this page for your records.'
              : `Placed ${formatDate(order.placedAt)}.`}
          </p>
        </div>
      </section>

      <section className="container">
        {placed && (
          <div className="order-success">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Your cash-on-delivery order is confirmed.</strong>
              <p>We'll prepare your items and notify you before dispatch.</p>
            </div>
          </div>
        )}

        <div className="order-detail-grid">
          <div className="order-detail-main">
            <div className="order-detail-card">
              <div className="order-detail-head">
                <div>
                  <span className="eyebrow">ORDER</span>
                  <h2>{order.orderNumber || order._id}</h2>
                </div>
                <span className={`order-status is-${statusTone(order.orderStatus)}`}>
                  {statusLabel(order.orderStatus)}
                </span>
              </div>

              {isCancelled ? (
                <p className="order-cancelled-note">This order was cancelled.</p>
              ) : (
                <div className="order-timeline">
                  {TRACKED.map((step, index) => (
                    <div
                      className={`order-step${index <= currentIndex ? ' is-done' : ''}`}
                      key={step}
                    >
                      <span className="order-step-dot">{index <= currentIndex ? '✓' : index + 1}</span>
                      <span>{statusLabel(step)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-detail-card">
              <h3>Items in this order</h3>
              <div className="order-detail-items">
                {order.items.map((item, index) => (
                  <div className="order-detail-item" key={`${item.product}-${index}`}>
                    <img src={imageUrl(item.image, 200)} alt="" />
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
            </div>
          </div>

          <aside className="order-detail-side">
            <div className="order-detail-card">
              <h3>Delivery address</h3>
              <address className="order-address">
                <strong>{order.shippingAddress.fullName}</strong>
                <span>{order.shippingAddress.line1}</span>
                {order.shippingAddress.line2 && <span>{order.shippingAddress.line2}</span>}
                <span>
                  {order.shippingAddress.city} {order.shippingAddress.postalCode}
                </span>
                {order.shippingAddress.country && <span>{order.shippingAddress.country}</span>}
                <span>{order.shippingAddress.phone}</span>
              </address>
              {order.notes && (
                <p className="order-notes">
                  <strong>Courier note:</strong> {order.notes}
                </p>
              )}
            </div>

            <div className="order-detail-card">
              <h3>Payment</h3>
              <div className="order-summary-line">
                <span>Subtotal</span>
                <strong>{formatPrice(order.subtotal)}</strong>
              </div>
              <div className="order-summary-line">
                <span>Shipping</span>
                <strong>{order.shippingFee ? formatPrice(order.shippingFee) : 'Free'}</strong>
              </div>
              <div className="order-summary-line is-total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>
              <p className="order-cod-note">
                Pay <strong>{formatPrice(order.total)}</strong> in cash when the courier delivers
                your order.
                {order.paymentStatus === 'paid' ? ' Cash has been collected.' : ''}
              </p>
            </div>

            <Link to="/orders" className="btn btn--ghost order-back">
              ← All orders
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
