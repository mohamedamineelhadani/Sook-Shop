import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  ArrowRightIcon,
  CartIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '../components/Icons.jsx';
import { logout } from '../api/auth.js';
import { suggestProducts } from '../api/reviews.js';
import { APP_NAME } from '../config.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { formatPrice, imageUrl } from '../lib/format.js';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
  { to: '/contact', label: 'Contact' },
];

const footerColumns = [
  {
    title: 'Shop by category',
    links: [
      { label: 'Mobile', to: '/shop?category=smartphones' },
      { label: 'Watch', to: '/shop?category=smart-watches' },
      { label: 'Camera', to: '/shop?category=cameras' },
      { label: 'Accessories', to: '/shop?category=accessories' },
      { label: 'Speaker', to: '/shop?category=speakers' },
    ],
  },
  {
    title: 'Help & support',
    links: [
      { label: 'My account', to: '/account' },
      { label: 'My order', to: '/orders' },
      { label: 'Shipping policy', to: '/shipping-policy' },
      { label: 'Help centre', to: '/help-centre' },
      { label: 'FAQs', to: '/faqs' },
    ],
  },
  {
    title: 'Sookshop',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Get 20% off', to: '/#newsletter' },
      { label: 'Terms & conditions', to: '/terms' },
      { label: 'Privacy policy', to: '/privacy' },
    ],
  },
];

function Brand({ light = false }) {
  return (
    <Link to="/" className="brand" style={light ? { color: 'var(--paper)' } : undefined}>
      <span className="brand-mark">S</span>
      {APP_NAME}
    </Link>
  );
}

export default function StoreLayout() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accountHref = user ? '/account' : '/login';
  const accountLabel = user ? `My account (${user.name})` : 'Account';

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Still clear local state if the request fails.
    }
    setUser(null);
    setDrawerOpen(false);
    navigate('/');
  };

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [drawerOpen]);

  // Suggestions are debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return undefined;

    let alive = true;
    const timer = window.setTimeout(() => {
      suggestProducts(term)
        .then((items) => {
          if (!alive) return;
          setSuggestions(items);
          setSuggestOpen(true);
        })
        .catch(() => {
          if (alive) setSuggestions([]);
        });
    }, 220);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    setSuggestOpen(false);
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setDrawerOpen(false);
  };

  const closeSuggestions = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setSuggestOpen(false);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="utility">
        <div className="container">
          <span className="promo">
            <span className="tag">COD</span>
            Cash on delivery available on every order
          </span>
          <span className="links">
            {user && <span className="utility-user">Hi, {user.name.split(' ')[0]}</span>}
            <Link to="/orders">Track order</Link>
            <Link to="/contact">Help</Link>
            <span>EN · USD</span>
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <Brand />

          <form className="search" role="search" onSubmit={submitSearch} onBlur={closeSuggestions}>
            <input
              type="text"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (value.trim().length < 2) {
                  setSuggestions([]);
                  setSuggestOpen(false);
                }
              }}
              onFocus={() => setSuggestions.length && setSuggestOpen(true)}
              placeholder="Search for products, brands, categories…"
              aria-label="Search the store"
              autoComplete="off"
            />
            <button type="submit" aria-label="Search">
              <SearchIcon size={18} />
            </button>

            {suggestOpen && (
              <div className="search-suggest" aria-label="Product suggestions">
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <Link
                      key={item._id}
                      to={`/products/${item.slug}`}
                      className="search-suggest-item"
                      onClick={() => {
                        setSuggestOpen(false);
                        setSuggestions([]);
                        setQuery('');
                      }}
                    >
                      <img src={imageUrl(item.images?.[0], 120)} alt="" />
                      <span className="search-suggest-text">
                        <strong>{item.name}</strong>
                        <small>{item.brand || 'Sookshop'}</small>
                      </span>
                      <b>{formatPrice(item.price)}</b>
                    </Link>
                  ))
                ) : (
                  <p className="search-suggest-empty">
                    No quick matches. Press Enter to search the whole store.
                  </p>
                )}
                <button type="submit" className="search-suggest-all">
                  See all results for “{query.trim()}” →
                </button>
              </div>
            )}
          </form>

          <div className="icon-row">
            <Link to={accountHref} className="icon-btn" aria-label={accountLabel} title={accountLabel}>
              <UserIcon />
            </Link>
            <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
              <HeartIcon />
              {wishlistCount > 0 && <span className="count">{wishlistCount}</span>}
            </Link>
            <Link to="/cart" className="icon-btn icon-btn--cart" aria-label="Cart">
              <CartIcon />
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </Link>
            <button
              className="nav-toggle"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-bar" aria-label="Primary">
        <div className="container">
          <Link to="/shop" className="all-cats">
            <MenuIcon size={16} />
            All Categories
          </Link>
          <div className="main-nav">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <span className="nav-cta">
            CASH ON DELIVERY · <strong>NO CARD NEEDED</strong>
          </span>
        </div>
      </nav>

      <div
        className={`drawer${drawerOpen ? ' is-open' : ''}`}
        id="drawer"
        aria-hidden={!drawerOpen}
      >
        <div className="drawer-head">
          <Brand />
          <button
            className="drawer-close"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <CloseIcon size={14} /> Close
          </button>
        </div>
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} onClick={() => setDrawerOpen(false)}>
            {link.label}
          </Link>
        ))}
        <div className="drawer-auth">
          {user ? (
            <>
              <Link to="/account" onClick={() => setDrawerOpen(false)}>
                My account · {user.name}
              </Link>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setDrawerOpen(false)}>
              Login / Register
            </Link>
          )}
        </div>
        <Link
          to="/cart"
          className="btn btn--indigo"
          style={{ marginTop: 'var(--s5)', justifyContent: 'center' }}
          onClick={() => setDrawerOpen(false)}
        >
          View cart <ArrowRightIcon size={14} />
        </Link>
      </div>

      <main id="main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="mark">
                <span className="brand-mark">S</span> {APP_NAME}
              </div>
              <p>
                Modern tech &amp; gadgets — straight from the makers, shipped fast,
                supported well. Pay cash when your order arrives.
              </p>
              <div className="socials" style={{ marginTop: 'var(--s4)' }}>
                <a href="#" aria-label="Twitter">
                  𝕏
                </a>
                <a href="#" aria-label="LinkedIn">
                  in
                </a>
                <a href="#" aria-label="Instagram">
                  ig
                </a>
                <a href="#" aria-label="YouTube">
                  ▶
                </a>
              </div>
            </div>

            {footerColumns.map((column) => (
              <div className="footer-col" key={column.title}>
                <h4>{column.title}</h4>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© 2026 {APP_NAME} · All rights reserved</span>
            <span>Made for cash on delivery shopping</span>
          </div>
        </div>
      </footer>
    </>
  );
}
