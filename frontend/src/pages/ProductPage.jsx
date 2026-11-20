import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getProduct } from '../api/catalog.js';
import ProductCard from '../components/ProductCard.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import { ErrorState, LoadingState } from '../components/States.jsx';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { colorToHex, formatPrice, formatStars, imageUrl } from '../lib/format.js';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const [error, setError] = useState('');
  const loading = loadedSlug !== slug;
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { has, toggle } = useWishlist();

  useEffect(() => {
    let alive = true;
    getProduct(slug)
      .then((data) => {
        if (!alive) return;
        setProduct(data.data);
        setRelated(data.related || []);
        setReviewSummary(data.reviewSummary || null);
        setColor(data.data.colors?.[0] || '');
        setSize(data.data.sizes?.[0] || '');
        setError('');
        setLoadedSlug(slug);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setLoadedSlug(slug);
      });
    return () => {
      alive = false;
    };
  }, [slug, reloadKey]);

  if (loading) return <LoadingState label="Loading product…" />;
  if (error || !product)
    return (
      <div className="container" style={{ padding: '40px 24px' }}>
        <ErrorState message={error || 'Product not found'} onRetry={() => navigate('/shop')} />
      </div>
    );

  const images = product.images?.length ? product.images : [''];
  const inStock = product.stock > 0;
  const onSale = product.compareAtPrice > 0;
  const saving = onSale
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const wished = has(product?._id);

  const handleAdd = () => {
    addItem(product, quantity, { color, size });
    navigate('/cart');
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/shop">Shop</Link>
            <span className="sep">/</span>
            <Link to={`/shop?category=${product.category?.slug || ''}`}>
              {product.category?.name || 'Products'}
            </Link>
            <span className="sep">/</span>
            <span>{product.name}</span>
          </div>
        </div>
      </div>

      <section className="container">
        <div className="product-detail">
          <div className="gallery">
            <div className="gallery-thumbs">
              {images.map((src, index) => (
                <button
                  key={src + index}
                  className={index === activeImage ? 'is-active' : ''}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={imageUrl(src, 200)} alt="" />
                </button>
              ))}
            </div>
            <figure className="gallery-main">
              <img src={imageUrl(images[activeImage], 900)} alt={product.name} />
            </figure>
          </div>

          <div className="pdp-info">
            <span className="pdp-cat">⚡ {product.category?.name || 'Featured'} · {product.brand}</span>
            <h1>{product.name}</h1>
            <div className="rating-row">
              <span style={{ color: 'var(--amber)', fontSize: 16 }}>
                {formatStars(product.rating?.average)}
              </span>
              <span>
                {product.rating?.average || 0} / 5 · {product.rating?.count || 0} reviews
              </span>
              <span style={{ color: 'var(--rule-strong)' }}>|</span>
              <span
                style={{
                  color: inStock ? 'var(--emerald)' : 'var(--rose)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: 'currentColor',
                    borderRadius: 999,
                    display: 'inline-block',
                  }}
                />
                {inStock ? `In stock · ${product.stock} items` : 'Out of stock'}
              </span>
            </div>

            <p className="desc">{product.description}</p>

            <div className="price-row">
              <span className="now">{formatPrice(product.price)}</span>
              {onSale && <span className="was">{formatPrice(product.compareAtPrice)}</span>}
              {onSale && <span className="save">Save {saving}%</span>}
            </div>

            {product.colors?.length > 0 && (
              <div className="option-block">
                <div className="label">Color · {color}</div>
                <div className="color-swatches">
                  {product.colors.map((option) => (
                    <button
                      key={option}
                      className={color === option ? 'is-active' : ''}
                      style={{ backgroundColor: colorToHex(option) }}
                      onClick={() => setColor(option)}
                      aria-label={option}
                      title={option}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div className="option-block">
                <div className="label">Configuration</div>
                <div className="option-pills">
                  {product.sizes.map((option) => (
                    <button
                      key={option}
                      className={size === option ? 'is-active' : ''}
                      onClick={() => setSize(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pdp-cta">
              <div className="qty">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  −
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.max(1, Math.min(product.stock || 1, Number(event.target.value) || 1)),
                    )
                  }
                  inputMode="numeric"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
              <button
                className="btn btn--indigo"
                style={{ flex: 1, minWidth: 160 }}
                onClick={handleAdd}
                disabled={!inStock}
              >
                {inStock ? 'Add to cart →' : 'Sold out'}
              </button>
              <button
                className="icon-btn"
                style={{ background: 'var(--bg)' }}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => toggle(product)}
              >
                {wished ? '♥' : '♡'}
              </button>
            </div>

            <div className="pdp-features">
              <div className="pf"><span className="ic">✓</span><span>Cash on delivery</span></div>
              <div className="pf"><span className="ic">↺</span><span>30-day free returns</span></div>
              <div className="pf"><span className="ic">★</span><span>2-year limited warranty</span></div>
              <div className="pf"><span className="ic">⚡</span><span>Fast local delivery</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="pdp-lower-grid">
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--s5)' }}>Specifications</h2>
              <table className="spec-table">
                <tbody>
                  {[
                    ['Brand', product.brand || '—'],
                    ['Category', product.category?.name || '—'],
                    ['SKU', product.sku || '—'],
                    ['Color', color || '—'],
                    ['Configuration', size || '—'],
                    ['Availability', inStock ? `${product.stock} in stock` : 'Out of stock'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--s5)' }}>Reviews</h2>
              <ReviewsSection
                product={product}
                summary={reviewSummary}
                onChanged={() => setReloadKey((key) => key + 1)}
              />
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <h2>You may also like</h2>
              <Link to="/shop" className="view-all">
                All products →
              </Link>
            </div>
            <div className="products">
              {related.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
