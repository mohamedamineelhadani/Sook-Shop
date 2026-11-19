import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useCart } from '../hooks/useCart.js';
import { formatPrice, formatStars, imageUrl } from '../lib/format.js';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);

  const onSale = Number(product.compareAtPrice) > 0;
  const inStock = Number(product.stock) > 0;

  const handleAdd = () => {
    addItem(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="product-card">
      <div className="img-wrap">
        {onSale ? (
          <span className="badge badge--sale">Sale</span>
        ) : product.isFeatured ? (
          <span className="badge">New</span>
        ) : null}
        <button
          className={`wishlist${wished ? ' is-active' : ''}`}
          aria-label="Add to wishlist"
          onClick={() => setWished((current) => !current)}
        >
          {wished ? '♥' : '♡'}
        </button>
        <Link to={`/products/${product.slug}`}>
          <img src={imageUrl(product.images?.[0], 500)} alt={product.name} loading="lazy" />
        </Link>
      </div>
      <div className="stock">
        <span className="dot" style={inStock ? undefined : { background: 'var(--rose)' }} />
        {inStock ? `In stock · ${product.stock} items` : 'Out of stock'}
      </div>
      <Link to={`/products/${product.slug}`} className="name">
        {product.name}
      </Link>
      <div className="price">
        <span className="now">{formatPrice(product.price)}</span>
        {onSale && <span className="was">{formatPrice(product.compareAtPrice)}</span>}
      </div>
      <div className="stars">
        {formatStars(product.rating?.average)}
        <span className="count">({product.rating?.count || 0})</span>
      </div>
      <button className="btn" onClick={handleAdd} disabled={!inStock}>
        {added ? 'Added ✓' : inStock ? 'Add to cart →' : 'Sold out'}
      </button>
    </article>
  );
}
