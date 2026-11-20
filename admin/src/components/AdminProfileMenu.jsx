import { useEffect, useRef, useState } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';

export default function AdminProfileMenu({ onLogout }) {
  const { user } = useAuth();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const name = user?.name || 'Admin';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="admin-profile-menu" ref={wrapRef}>
      <button
        type="button"
        className="admin-profile-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label="Admin profile menu"
        aria-expanded={open}
      >
        <span className="admin-avatar">{initials}</span>
        <span className="admin-profile-meta">
          <strong>{name}</strong>
          <small>Administrator</small>
        </span>
      </button>

      {open && (
        <div className="admin-profile-popover">
          <div className="admin-popover-head">
            <strong>{name}</strong>
            <span>{user?.email}</span>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)}>
            <UserRound size={15} /> My profile
          </Link>
          <Link to="/profile?tab=password" onClick={() => setOpen(false)}>
            <KeyRound size={15} /> Change password
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
