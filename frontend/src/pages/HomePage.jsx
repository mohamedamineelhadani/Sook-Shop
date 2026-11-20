import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCategories, getProducts } from '../api/catalog.js';
import { subscribeNewsletter } from '../api/newsletter.js';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/States.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice, imageUrl } from '../lib/format.js';

const image = (id, width = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;

const heroFallback = [
  {
    slug: 'apple-homepod-2nd-gen',
    name: 'Apple HomePod 2nd Gen Speaker',
    category: { name: 'Speakers' },
    images: [image('1608043152269-423dbba4e7e1', 900)],
    description:
      'Apple ecosystem with high-quality audio playback while serving as a hub for controlling smart home devices.',
  },
  {
    slug: 'apple-watch-series-9',
    name: 'Apple Watch Series 9',
    category: { name: 'Wearables' },
    images: [image('1523275335684-37898b6baf30')],
  },
  {
    slug: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra · 5G',
    category: { name: 'Latest Phones' },
    images: [image('1592899677977-9c10ca588bbd')],
  },
  {
    slug: 'samsung-gear-camera',
    name: 'Samsung Gear Camera',
    category: { name: 'Cameras' },
    images: [image('1606983340126-99ab4feaa64a', 500)],
  },
  {
    slug: 'beats-studio-buds-pro',
    name: 'Beats Studio Buds',
    category: { name: 'Audio' },
    images: [image('1606220945770-b5b6c2c55bf1', 500)],
  },
  {
    slug: 'hero-camera-x-series',
    name: 'Hero Camera X-Series',
    category: { name: 'DSLR' },
    images: [image('1502920917128-1aa500764cbd', 500)],
  },
];

function Arrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M1 5h12m0 0L9 1m4 4L9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [categories, setCategories] = useState([]);
  const [heroProducts, setHeroProducts] = useState([]);
  const [latest, setLatest] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState('idle');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([
      getCategories({ activeOnly: 'true' }),
      getProducts({ limit: 6, sort: 'popular' }),
      getProducts({ limit: 4, sort: 'newest' }),
    ])
      .then(([categoryResult, popularResult, newestResult]) => {
        if (!alive) return;
        setCategories(categoryResult.data);
        setHeroProducts(popularResult.data);
        setLatest(newestResult.data);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const params = { limit: 5, sort: 'popular' };
    if (activeTab !== 'all') params.category = activeTab;
    getProducts(params)
      .then((result) => alive && setTrending(result.data))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (window.location.hash !== '#newsletter') return;
    window.requestAnimationFrame(() => {
      document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const subscribe = async (event) => {
    event.preventDefault();
    setNewsletterState('sending');
    setNewsletterMessage('');
    try {
      const result = await subscribeNewsletter(newsletterEmail, 'home');
      setNewsletterState('done');
      setNewsletterEmail('');
      setNewsletterMessage(
        result.alreadySubscribed
          ? 'You are already on the list — thanks for checking!'
          : 'Saved! Your email is now in our store list.',
      );
    } catch (err) {
      setNewsletterState('error');
      setNewsletterMessage(err.message);
    }
  };

  const quickAdd = (product) => {
    addItem(product, 1);
    navigate('/cart');
  };

  const hero = heroProducts.length >= 6 ? heroProducts : heroFallback;
  const tabs = [
    { slug: 'all', name: 'All' },
    ...categories.slice(0, 5).map((category) => ({
      slug: category.slug,
      name: category.name,
    })),
  ];

  return (
    <>
      <section className="hero">
        <div className="container">
          {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
          {loading ? (
            <LoadingState label="Loading the storefront…" />
          ) : (
            <div className="bento">
              <article className="bento-card bento-card--lg">
                <div className="sparkle" />
                <div>
                  <span className="eyebrow">⚡ {hero[0].category?.name || 'Featured'}</span>
                  <h2>{hero[0].name}</h2>
                  {hero[0].description && <p>{hero[0].description}</p>}
                  <Link to={`/products/${hero[0].slug}`} className="btn btn--paper">
                    Shop Now <Arrow />
                  </Link>
                  <div className="dots">
                    <span className="active" />
                    <span />
                    <span />
                  </div>
                </div>
                <img className="product" src={imageUrl(hero[0].images?.[0], 900)} alt="" />
              </article>

              {[1, 2].map((index) => (
                <article
                  key={index}
                  className={`bento-card ${index === 1 ? 'bento-card--purple' : 'bento-card--teal'}`}
                >
                  <div className="sparkle" />
                  <span className="eyebrow">{hero[index].category?.name || 'Featured'}</span>
                  <h3 style={{ fontSize: 'var(--text-xl)', lineHeight: 1.15 }}>
                    {hero[index].name}
                  </h3>
                  <Link to={`/products/${hero[index].slug}`} className="shop-now">
                    Shop Now <Arrow />
                  </Link>
                  <img className="product" src={imageUrl(hero[index].images?.[0], 600)} alt="" />
                </article>
              ))}

              <div className="bento-row">
                {[3, 4, 5].map((index, position) => (
                  <article
                    key={index}
                    className={`bento-card bento-card--${
                      ['orange', 'green', 'black'][position]
                    }`}
                  >
                    <div className="sparkle" />
                    <span className="eyebrow">{hero[index].category?.name || 'Gear'}</span>
                    <h3 style={{ fontSize: 'var(--text-lg)', lineHeight: 1.2 }}>
                      {hero[index].name}
                    </h3>
                    <Link to={`/products/${hero[index].slug}`} className="shop-now">
                      Shop Now <Arrow />
                    </Link>
                    <img className="product" src={imageUrl(hero[index].images?.[0], 500)} alt="" />
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--s5)' }}>
        <div className="container">
          <div className="section-head">
            <h2>Trending Products</h2>
            <Link to="/shop" className="view-all">
              View all <Arrow />
            </Link>
          </div>

          <div className="tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.slug}
                role="tab"
                aria-selected={activeTab === tab.slug}
                className={`tab${activeTab === tab.slug ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.slug)}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {trending.length ? (
            <div className="products">
              {trending.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState title="No products here yet" message="Try another category." />
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="discount-row">
            <article className="discount-card discount-card--watch">
              <span className="meta">THIS WEEK ONLY</span>
              <h3>
                Mega Discounts
                <span className="pct">50% Off</span>
              </h3>
              <Link to="/shop?onSale=true" className="shop-now">
                Shop Now <Arrow />
              </Link>
              <img
                className="product"
                src={image('1579586337278-3befd40fd17a', 500)}
                alt="Smart watch"
              />
            </article>
            <article className="discount-card discount-card--airpods">
              <span className="meta">LIMITED EDITION</span>
              <h3>
                Studio Buds Pro
                <span className="pct">30% Off</span>
              </h3>
              <Link to="/shop?onSale=true" className="shop-now">
                Shop Now <Arrow />
              </Link>
              <img
                className="product"
                src={image('1590658268037-6bf12165a8df', 500)}
                alt="Earbuds"
              />
            </article>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--s5)' }}>
        <div className="container">
          <div className="section-head">
            <h2>Shop by category</h2>
            <Link to="/shop" className="view-all">
              View all products <Arrow />
            </Link>
          </div>
          {categories.length ? (
            <div className="cats-grid">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/shop?category=${category.slug}`}
                  className="cat-tile"
                >
                  <div className="pic">
                    <img src={imageUrl(category.image, 300)} alt="" loading="lazy" />
                  </div>
                  <div className="name">{category.name}</div>
                  <div className="count">{category.productCount} Products</div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No categories yet" message="Add categories in the admin panel." />
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Just for you</h2>
            <Link to="/shop" className="view-all">
              More picks <Arrow />
            </Link>
          </div>
          <div className="compact-row">
            {latest.map((product) => (
              <article className="compact-card" key={product._id}>
                <div className="pic">
                  <img src={imageUrl(product.images?.[0], 300)} alt="" loading="lazy" />
                </div>
                <div>
                  <div className="stock">{product.stock > 0 ? 'IN STOCK' : 'SOLD OUT'} · {product.stock}</div>
                  <div className="name">{product.name}</div>
                  <div className="price">{formatPrice(product.price)}</div>
                  <button
                    className="btn"
                    disabled={product.stock === 0}
                    onClick={() => quickAdd(product)}
                  >
                    Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brands">
        <div className="container">
          <div className="brand-row">
            {['HP', 'Huawei', 'Nokia', 'Samsung', 'Canon', 'Sony'].map((brand) => (
              <Link key={brand} to="/shop" className="brand-logo">
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="newsletter" style={{ background: 'var(--paper)' }}>
        <div className="container">
          <div className="newsletter">
            <div className="newsletter-grid">
              <div>
                <h2>
                  Get <strong>20% Off</strong> your first order — straight to your inbox.
                </h2>
                <p>
                  Drop your email and we'll save it in our store list, with first-look offers on
                  the gear we just got in. No emails are sent from this demo store.
                </p>
              </div>
              <div>
                <form className="newsletter-form" onSubmit={subscribe}>
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder="Enter your email"
                    aria-label="Email address"
                  />
                  <button className="btn" type="submit" disabled={newsletterState === 'sending'}>
                    {newsletterState === 'sending'
                      ? 'Saving…'
                      : newsletterState === 'done'
                        ? 'Saved ✓'
                        : 'Subscribe →'}
                  </button>
                </form>
                {newsletterMessage && (
                  <p className={`newsletter-status is-${newsletterState}`} role="status" aria-live="polite">
                    {newsletterMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
