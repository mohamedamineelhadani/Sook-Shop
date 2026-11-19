import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { login, register } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const [mode, setMode] = useState(
    searchParams.get('mode') === 'register' ? 'register' : 'login',
  );
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const from = location.state?.from || '/account';

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };
      const data = isRegister ? await register(payload) : await login(payload);
      setUser(data.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>{isRegister ? 'Register' : 'Login'}</span>
          </div>
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {isRegister
              ? 'Sign up to save your cart, track cash-on-delivery orders and check out faster.'
              : 'Log in to continue to your Sookshop account.'}
          </p>
        </div>
      </section>

      <section className="container">
        <div className="auth-layout">
          <div className="auth-card">
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                className={!isRegister ? 'is-active' : ''}
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={isRegister ? 'is-active' : ''}
                onClick={() => switchMode('register')}
              >
                Register
              </button>
            </div>

            <div className="auth-card-body">
              {error && <div className="auth-error">{error}</div>}

              <form className="auth-form" onSubmit={submit}>
                {isRegister && (
                  <label className="auth-field">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setField('name', event.target.value)}
                      placeholder="e.g. Alex Morgan"
                      autoComplete="name"
                      required
                    />
                  </label>
                )}

                <label className="auth-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setField('password', event.target.value)}
                    placeholder={isRegister ? 'At least 6 characters' : 'Your password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    minLength={isRegister ? 6 : undefined}
                    required
                  />
                </label>

                <button className="btn btn--indigo auth-submit" type="submit" disabled={submitting}>
                  {submitting
                    ? 'Please wait…'
                    : isRegister
                      ? 'Create account →'
                      : 'Log in →'}
                </button>
              </form>

              <p className="auth-switch">
                {isRegister ? 'Already have an account?' : 'New to Sookshop?'}{' '}
                <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                  {isRegister ? 'Log in' : 'Create an account'}
                </button>
              </p>
            </div>
          </div>

          <aside className="auth-perks">
            <span className="eyebrow">WHY SHOP WITH US</span>
            <h2>Great gear, simple checkout, cash on delivery.</h2>
            <ul>
              <li><span>✓</span> Pay in cash when your order arrives</li>
              <li><span>✓</span> Save your cart and wishlist to your account</li>
              <li><span>✓</span> Track every cash-on-delivery order</li>
              <li><span>✓</span> 30-day free returns on all products</li>
            </ul>
            <Link to="/shop" className="shop-now">
              Browse the shop →
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
