import { useEffect, useMemo, useState } from 'react';

import { getMe } from '../api/auth.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMe()
      .then((data) => {
        if (alive) setUser(data.data);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ user, loading, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
