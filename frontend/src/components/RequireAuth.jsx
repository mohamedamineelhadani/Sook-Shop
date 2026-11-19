import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div className="state-box">
          <span className="spinner" />
          <p>Checking your account…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}
