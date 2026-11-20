import { useState } from 'react';
import { Link } from 'react-router-dom';

import { LoadingState } from '../components/States.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice, imageUrl } from '../lib/format.js';

export default function CartPage() {
  const { items, count, subtotal, updateQuantity, removeItem, clearCart, ready, error } = useCart();
  const { user } = useAuth();
  const [checkoutNote, setCheckoutNote] = useState(false);

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Cart</span>
          </div>
          <h1>Your cart</h1>
          <p>
            {count
              ? `${count} item${count === 1 ? '' : 's'} ready for cash on delivery.`
              : ready
                ? 'Your cart is empty.'
                : 'Loading your cart…'}
          </p>
        </div>
      </div>

      <section className="container">
        {error && <div className="auth-error">{error}</div>}

        {!ready ? (
          <LoadingState label="Loading your cart…" />
        ) : items.length === 0 ? (
          <div className="state-box" style={{ margin: '40px 0' }}>
            <span aria-hidden="true">🛒</span>
            <p className="state-title">Nothing in your cart yet</p>
            <p>Find something you like in the shop and add it here.</p>
            <Link to="/shop" className="btn btn--indigo" style={{ marginTop: 16 }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <div className="cart-row" key={item.key}>
                  <div className="pic">
                    <img src={imageUrl(item.image, 300)} alt={item.name} />
                  </div>
                  <div className="info">
                    <div className="name">{item.name}</div>
                    <div className="variant">
                      {formatPrice(item.price)} each
                      {item.color && ` · ${item.color}`}
                      {item.size && ` · ${item.size}`}
                      {' · cash on delivery'}
                    </div>
                  </div>
                  <div className="qty">
                    <button
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <input value={item.quantity} readOnly aria-label="Quantity" />
                    <button
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      aria-label="Increase"
                      disabled={item.quantity >= item.maxStock}
                    >
                      +
                    </button>
                  </div>
                  <div className="subtotal">{formatPrice(item.price * item.quantity)}</div>
                  <button
                    className="remove"
                    onClick={() => removeItem(item)}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={clearCart} style={{ marginTop: 16 }}>
                Clear cart
              </button>
            </div>

            <aside className="cart-summary">
              <h3>Order summary</h3>
              <div className="cart-line"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div className="cart-line"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="cart-line"><span>Payment</span><strong>Cash on delivery</strong></div>
              <div className="cart-line is-total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
              <button className="btn btn--indigo" onClick={() => setCheckoutNote(true)}>
                Proceed to checkout →
              </button>
              {checkoutNote && (
                <p className="cart-notice">
                  Checkout and order placement are being built in Step 5. Your cart is saved
                  {user ? ' to your account' : ' on this device'} until then.
                </p>
              )}
              <p className="cart-notice">
                No card needed. Pay in cash when your order arrives at your door.
              </p>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
