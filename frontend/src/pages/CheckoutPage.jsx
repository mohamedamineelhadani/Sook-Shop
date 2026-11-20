import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createOrder, getShippingConfig } from '../api/orders.js';
import { LoadingState } from '../components/States.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice, imageUrl } from '../lib/format.js';

const DEFAULT_SHIPPING = { fee: 10, freeAbove: 200, paymentMethod: 'cod' };

function initialForm(user) {
  const address = user?.address || {};
  return {
    fullName: address.fullName || user?.name || '',
    phone: address.phone || user?.phone || '',
    line1: address.line1 || '',
    line2: address.line2 || '',
    city: address.city || '',
    postalCode: address.postalCode || '',
    country: address.country || '',
    notes: '',
    saveAddress: false,
  };
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, count, clearCart, ready } = useCart();
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING);
  const [form, setForm] = useState(() => initialForm(user));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    getShippingConfig()
      .then((config) => alive && setShipping(config))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const shippingFee = subtotal >= shipping.freeAbove ? 0 : shipping.fee;
  const total = subtotal + shippingFee;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const shippingAddress = {
      fullName: form.fullName,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
    };

    try {
      const order = await createOrder({
        shippingAddress,
        notes: form.notes,
        saveAddress: form.saveAddress,
      });
      await clearCart();
      navigate(`/orders/${order._id}`, { state: { placed: true }, replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/cart">Cart</Link>
            <span className="sep">/</span>
            <span>Checkout</span>
          </div>
          <h1>Checkout</h1>
          <p>Enter your delivery details. You pay in cash when your order arrives.</p>
        </div>
      </section>

      <section className="container">
        {!ready ? (
          <LoadingState label="Loading your cart…" />
        ) : items.length === 0 ? (
          <div className="state-box" style={{ margin: '40px 0' }}>
            <span aria-hidden="true">🛒</span>
            <p className="state-title">Your cart is empty</p>
            <p>Add a few products before placing a cash-on-delivery order.</p>
            <Link to="/shop" className="btn btn--indigo" style={{ marginTop: 16 }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-form" onSubmit={submit}>
              <div className="checkout-section">
                <div className="checkout-section-head">
                  <span className="checkout-step">1</span>
                  <h2>Delivery address</h2>
                </div>
                {error && <div className="auth-error">{error}</div>}

                <div className="checkout-grid">
                  <label className="auth-field">
                    <span>Full name *</span>
                    <input
                      value={form.fullName}
                      onChange={(event) => setField('fullName', event.target.value)}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label className="auth-field">
                    <span>Phone number *</span>
                    <input
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      autoComplete="tel"
                      placeholder="e.g. +1 555 123 4567"
                      required
                    />
                  </label>
                  <label className="auth-field auth-field--wide">
                    <span>Street address *</span>
                    <input
                      value={form.line1}
                      onChange={(event) => setField('line1', event.target.value)}
                      autoComplete="address-line1"
                      placeholder="House number and street name"
                      required
                    />
                  </label>
                  <label className="auth-field auth-field--wide">
                    <span>Apartment, suite, etc. (optional)</span>
                    <input
                      value={form.line2}
                      onChange={(event) => setField('line2', event.target.value)}
                      autoComplete="address-line2"
                    />
                  </label>
                  <label className="auth-field">
                    <span>City *</span>
                    <input
                      value={form.city}
                      onChange={(event) => setField('city', event.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </label>
                  <label className="auth-field">
                    <span>Postal code</span>
                    <input
                      value={form.postalCode}
                      onChange={(event) => setField('postalCode', event.target.value)}
                      autoComplete="postal-code"
                    />
                  </label>
                  <label className="auth-field auth-field--wide">
                    <span>Country</span>
                    <input
                      value={form.country}
                      onChange={(event) => setField('country', event.target.value)}
                      autoComplete="country-name"
                    />
                  </label>
                </div>

                <label className="checkout-check">
                  <input
                    type="checkbox"
                    checked={form.saveAddress}
                    onChange={(event) => setField('saveAddress', event.target.checked)}
                  />
                  Save this address to my account
                </label>
              </div>

              <div className="checkout-section">
                <div className="checkout-section-head">
                  <span className="checkout-step">2</span>
                  <h2>Delivery notes</h2>
                </div>
                <label className="auth-field">
                  <span>Notes for the courier (optional)</span>
                  <textarea
                    rows="3"
                    value={form.notes}
                    onChange={(event) => setField('notes', event.target.value)}
                    placeholder="e.g. Ring the bell, leave with the neighbour…"
                    maxLength={500}
                  />
                </label>
              </div>

              <div className="checkout-section">
                <div className="checkout-section-head">
                  <span className="checkout-step">3</span>
                  <h2>Payment</h2>
                </div>
                <div className="checkout-cod">
                  <span className="checkout-cod-icon">$</span>
                  <div>
                    <strong>Cash on delivery</strong>
                    <p>No card details needed. Hand the exact amount to the courier when your
                      order arrives.</p>
                  </div>
                  <span className="checkout-cod-check">Selected ✓</span>
                </div>
              </div>

              <button className="btn btn--indigo checkout-submit" type="submit" disabled={submitting}>
                {submitting ? 'Placing your order…' : `Place order · ${formatPrice(total)} →`}
              </button>
            </form>

            <aside className="checkout-summary">
              <h2>Your order</h2>
              <p className="checkout-summary-sub">
                {count} item{count === 1 ? '' : 's'} · {user?.name}
              </p>
              <div className="checkout-items">
                {items.map((item) => (
                  <div className="checkout-item" key={item.key}>
                    <img src={imageUrl(item.image, 160)} alt="" />
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
              <div className="checkout-line">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="checkout-line">
                <span>Shipping</span>
                <strong>{shippingFee ? formatPrice(shippingFee) : 'Free'}</strong>
              </div>
              {shippingFee > 0 && (
                <p className="checkout-hint">
                  Spend {formatPrice(shipping.freeAbove)} to get free shipping.
                </p>
              )}
              <div className="checkout-line checkout-line--total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="checkout-pay-note">Pay {formatPrice(total)} in cash on delivery</div>
              <Link to="/cart" className="checkout-back">
                ← Back to cart
              </Link>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
