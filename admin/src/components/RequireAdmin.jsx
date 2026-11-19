import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-shell">
        <main className="admin-content admin-auth-loading">
          <span className="admin-spinner" />
          <p>Checking admin session…</p>
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
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
