import { useState } from 'react';
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Store,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP_NAME } from '../config.js';

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/users', label: 'Customers', icon: Users },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const current =
    menu.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    ) || menu[0];

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar-head">
          <Link to="/" className="admin-brand" onClick={() => setSidebarOpen(false)}>
            <span className="admin-brand-mark">S</span>
            <span>{APP_NAME}</span>
          </Link>
          <button
            className="admin-icon-button admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin">
          <span className="admin-nav-label">MANAGE</span>
          {menu.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-cod-note">
            <Store size={16} />
            <span>Payments are <strong>cash on delivery</strong></span>
          </div>
          <Link to="/login" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <LogOut size={18} />
            Log out
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="admin-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-icon-button admin-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="admin-topbar-title">
            <h1>{current.label}</h1>
            <span>Sookshop control panel</span>
          </div>
          <div className="admin-topbar-actions">
            <label className="admin-search">
              <Search size={16} />
              <input type="search" placeholder="Search anything…" aria-label="Search admin" />
            </label>
            <button className="admin-icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="admin-avatar" title="Admin">AD</div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
