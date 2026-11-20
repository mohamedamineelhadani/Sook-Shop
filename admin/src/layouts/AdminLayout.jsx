import { useState } from 'react';
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Send,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { logout } from '../api/auth.js';
import AdminGlobalSearch from '../components/AdminGlobalSearch.jsx';
import AdminNotifications from '../components/AdminNotifications.jsx';
import AdminProfileMenu from '../components/AdminProfileMenu.jsx';
import { APP_NAME } from '../config.js';
import { useAuth } from '../hooks/useAuth.js';

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/insights', label: 'Insights', icon: Heart },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/users', label: 'Customers', icon: Users },
  { to: '/messages', label: 'Messages', icon: Mail },
  { to: '/newsletter', label: 'Newsletter', icon: Send },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Still clear local state if the request fails.
    }
    setUser(null);
    navigate('/login', { replace: true });
  };

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
          <button type="button" className="admin-nav-link" onClick={handleLogout}>
            <LogOut size={18} />
            Log out
          </button>
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
            <AdminGlobalSearch />
            <AdminNotifications />
            <AdminProfileMenu onLogout={handleLogout} />
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
