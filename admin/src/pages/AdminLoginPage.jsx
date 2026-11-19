import { useState } from 'react';
import { LockKeyhole, Mail, Store } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { login } from '../api/auth.js';
import { APP_NAME } from '../config.js';
import { useAuth } from '../hooks/useAuth.js';

export default function AdminLoginPage() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user?.role === 'admin') return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await login(form);
      if (data.data.role !== 'admin') {
        throw new Error('This account is not an admin account');
      }
      setUser(data.data);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark">S</span>
          <span>{APP_NAME}</span>
        </div>
        <span className="admin-login-eyebrow">ADMIN CONTROL PANEL</span>
        <h1>Welcome back</h1>
        <p className="admin-login-sub">Sign in to manage products, categories and orders.</p>

        {error && <div className="admin-form-error">{error}</div>}

        <form onSubmit={submit} className="admin-login-form">
          <label className="admin-field">
            <span>Email address</span>
            <div className="admin-login-input">
              <Mail size={16} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="admin@sookshop.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="admin-field">
            <span>Password</span>
            <div className="admin-login-input">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          <button className="admin-button admin-login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="admin-login-hint">
          <Store size={14} />
          <span>
            Default admin: <strong>admin@sookshop.com</strong> / <strong>Admin@123</strong>
            <br />
            Change it with <code>npm run seed:admin</code> in the backend.
          </span>
        </div>
      </div>
    </div>
  );
}
