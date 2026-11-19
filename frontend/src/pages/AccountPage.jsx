import { Link, useNavigate } from 'react-router-dom';

import { logout } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Clear local state even if the request fails.
    }
    setUser(null);
    navigate('/');
  };

  const initials = (user?.name || 'S')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>My account</span>
          </div>
          <h1>My account</h1>
          <p>Manage your details and keep an eye on your orders.</p>
        </div>
      </section>

      <section className="container">
        <div className="account-layout">
          <div className="account-hero">
            <div className="account-avatar">{initials}</div>
            <div>
              <span className="eyebrow">{user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER'}</span>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </div>
            <button className="btn btn--ghost" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
              Log out
            </button>
          </div>

          <div className="account-grid">
            <div className="account-panel">
              <h3>Profile details</h3>
              <dl className="account-details">
                <div><dt>Full name</dt><dd>{user?.name || '—'}</dd></div>
                <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
                <div><dt>Phone</dt><dd>{user?.phone || 'Not added yet'}</dd></div>
                <div><dt>Member since</dt><dd>{formatDate(user?.createdAt)}</dd></div>
                <div><dt>Last login</dt><dd>{formatDate(user?.lastLogin || user?.updatedAt)}</dd></div>
              </dl>
            </div>

            <div className="account-panel">
              <h3>Delivery address</h3>
              {user?.address?.line1 ? (
                <address className="account-address">
                  {user.address.fullName && <div><strong>{user.address.fullName}</strong></div>}
                  <div>{user.address.line1}</div>
                  {user.address.line2 && <div>{user.address.line2}</div>}
                  <div>
                    {user.address.city} {user.address.postalCode}
                  </div>
                  <div>{user.address.country}</div>
                  {user.address.phone && <div>{user.address.phone}</div>}
                </address>
              ) : (
                <p className="account-empty">
                  No saved address yet. You'll enter your delivery details at checkout — we only
                  accept cash on delivery.
                </p>
              )}
              <div className="account-links">
                <Link to="/orders">My orders →</Link>
                <Link to="/wishlist">My wishlist →</Link>
                <Link to="/shop">Continue shopping →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
