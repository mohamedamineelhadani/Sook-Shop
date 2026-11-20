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
import { APP_NAME } from '../config.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/cart', label: 'Cart' },
  { to: '/contact', label: 'Contact' },
];

const footerColumns = [
  {
    title: 'Popular Categories',
    links: ['Mobile', 'Watch', 'Camera', 'Accessories', 'Speaker'],
  },
  {
    title: 'Let us help you',
    links: ['My account', 'My order', 'Shipping policy', 'Help centre', 'FAQs'],
  },
  {
    title: 'Resources',
    links: ['Blog', 'Newsletter', 'Support', 'Reviews'],
  },
  {
    title: 'Get to know us',
    links: ['About us', 'Contact', 'Login / Register', 'Terms & conditions', 'Privacy policy'],
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

  const footerHref = (label) => {
    if (label === 'Contact') return '/contact';
    if (label === 'My account') return user ? '/account' : '/login';
    if (label === 'Login / Register') return '/login';
    if (label === 'My order') return '/orders';
    return '/shop';
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

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setDrawerOpen(false);
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

          <form className="search" role="search" onSubmit={submitSearch}>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for products, brands, categories…"
              aria-label="Search the store"
            />
            <button type="submit" aria-label="Search">
              <SearchIcon size={18} />
            </button>
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
                  {column.links.map((label) => (
                    <li key={label}>
                      <Link to={footerHref(label)}>{label}</Link>
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
