import { useEffect, useState } from 'react';
import { KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { changeAdminPassword, getAdminProfile, updateAdminProfile } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatDate } from '../lib/format.js';

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AdminProfilePage() {
  const { user, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'password' ? 'password' : 'details';

  const [details, setDetails] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  }));
  const [password, setPassword] = useState(emptyPassword);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getAdminProfile()
      .then((profile) => {
        if (!alive) return;
        setUser(profile);
        setDetails({
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
        });
        setError('');
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [setUser]);

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'details') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
    setFeedback('');
    setError('');
  };

  const saveDetails = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    setError('');
    try {
      const result = await updateAdminProfile(details);
      setUser(result.data);
      setFeedback(result.message || 'Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    setError('');
    try {
      const result = await changeAdminPassword(password);
      setPassword(emptyPassword);
      setFeedback(result.message || 'Password updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'A')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>My profile</h2>
          <p>Manage the admin account used to run the Sookshop control panel.</p>
        </div>
        <span className="admin-pill"><ShieldCheck size={13} /> Administrator</span>
      </div>

      <div className="admin-profile-layout">
        <aside className="admin-card admin-profile-card">
          <span className="admin-avatar is-large">{initials}</span>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <span className="admin-badge badge-indigo">Administrator</span>
          <div className="admin-profile-facts">
            <div>
              <span>Member since</span>
              <strong>{formatDate(user?.createdAt)}</strong>
            </div>
            <div>
              <span>Last login</span>
              <strong>{formatDate(user?.lastLogin)}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{user?.phone || 'Not saved'}</strong>
            </div>
          </div>
          <p className="admin-order-note">Details load from the admin profile API.</p>
        </aside>

        <div className="admin-card admin-profile-panel">
          <div className="admin-profile-tabs">
            <button
              type="button"
              className={tab === 'details' ? 'is-active' : ''}
              onClick={() => setTab('details')}
            >
              <UserRound size={15} /> Profile details
            </button>
            <button
              type="button"
              className={tab === 'password' ? 'is-active' : ''}
              onClick={() => setTab('password')}
            >
              <KeyRound size={15} /> Password
            </button>
          </div>

          {feedback && <div className="admin-form-success">{feedback}</div>}
          {error && <div className="admin-form-error">{error}</div>}

          {tab === 'details' ? (
            <form className="admin-profile-form" onSubmit={saveDetails}>
              <label className="admin-field">
                <span>Full name</span>
                <input
                  value={details.name}
                  onChange={(event) =>
                    setDetails((current) => ({ ...current, name: event.target.value }))
                  }
                  maxLength={80}
                  required
                />
              </label>
              <label className="admin-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={details.email}
                  onChange={(event) =>
                    setDetails((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="admin-field">
                <span>Phone</span>
                <input
                  value={details.phone}
                  onChange={(event) =>
                    setDetails((current) => ({ ...current, phone: event.target.value }))
                  }
                  maxLength={30}
                  placeholder="Optional"
                />
              </label>
              <button className="admin-button" type="submit" disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          ) : (
            <form className="admin-profile-form" onSubmit={savePassword}>
              <label className="admin-field">
                <span>Current password</span>
                <input
                  type="password"
                  value={password.currentPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="admin-field">
                <span>New password</span>
                <input
                  type="password"
                  value={password.newPassword}
                  onChange={(event) =>
                    setPassword((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="admin-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={password.confirmPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>
              <button className="admin-button" type="submit" disabled={saving}>
                <KeyRound size={15} /> {saving ? 'Updating…' : 'Update password'}
              </button>
              <p className="admin-order-note">
                Use at least 8 characters. The current session stays active after the change.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
