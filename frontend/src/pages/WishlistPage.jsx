import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard.jsx';
import { LoadingState } from '../components/States.jsx';
import { useWishlist } from '../hooks/useWishlist.js';

export default function WishlistPage() {
  const { items, count, clear, ready, error } = useWishlist();

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Wishlist</span>
          </div>
          <h1>My wishlist</h1>
          <p>
            {ready
              ? `${count} saved product${count === 1 ? '' : 's'}. Tap the heart again to remove one.`
              : 'Loading your saved products…'}
          </p>
        </div>
      </section>

      <section className="container">
        {error && <div className="auth-error">{error}</div>}

        {!ready ? (
          <LoadingState label="Loading your wishlist…" />
        ) : items.length === 0 ? (
          <div className="state-box" style={{ margin: '40px 0' }}>
            <span aria-hidden="true">♡</span>
            <p className="state-title">Your wishlist is empty</p>
            <p>Save products you like by tapping the heart on any product card.</p>
            <Link to="/shop" className="btn btn--indigo" style={{ marginTop: 16 }}>
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-head">
              <span>{count} saved product{count === 1 ? '' : 's'}</span>
              <button className="btn btn--ghost btn--sm" onClick={clear}>
                Clear wishlist
              </button>
            </div>
            <div className="products">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
