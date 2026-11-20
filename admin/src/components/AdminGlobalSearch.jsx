import { useEffect, useRef, useState } from 'react';
import { Package, Search, ShoppingCart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { adminSearch } from '../api/search.js';

const emptyData = {
  products: [],
  orders: [],
  customers: [],
  totals: { products: 0, orders: 0, customers: 0 },
  tooShort: false,
  query: '',
};

const groups = [
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'customers', label: 'Customers', icon: Users },
];

export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      const term = query.trim();
      if (term.length < 2) {
        setData(null);
        setLoading(false);
        return;
      }

      adminSearch(term)
        .then((result) => {
          if (!alive) return;
          setData(result);
          setLoading(false);
          setOpen(true);
        })
        .catch(() => {
          if (!alive) return;
          setData({ ...emptyData, query: term });
          setLoading(false);
          setOpen(true);
        });
    }, 280);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

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

  const allResults = groups.flatMap((group) => data?.[group.key] || []);

  const goTo = (to) => {
    navigate(to);
    setOpen(false);
    setQuery('');
    setData(null);
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setOpen(true);
    if (value.trim().length < 2) {
      setData(null);
      setLoading(false);
    } else {
      setData(null);
      setLoading(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && allResults.length) {
      event.preventDefault();
      goTo(allResults[0].to);
    }
  };

  const hasResults = allResults.length > 0;

  return (
    <div className="admin-global-search" ref={wrapRef}>
      <label className="admin-search">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search products, orders, customers…"
          aria-label="Search admin"
          autoComplete="off"
        />
      </label>

      {open && query.trim().length >= 2 && (
        <div className="admin-search-popover">
          {loading && !data && <div className="admin-search-status">Searching…</div>}

          {!loading && data && !hasResults && (
            <div className="admin-search-status">
              No results for “{data.query}”. Try a name, email or order number.
            </div>
          )}

          {data && hasResults && (
            <>
              <div className="admin-search-summary">
                {Object.values(data.totals).reduce((sum, count) => sum + count, 0)} matches found
              </div>
              {groups.map(({ key, label, icon: Icon }) => {
                const items = data[key] || [];
                if (!items.length) return null;
                return (
                  <div className="admin-search-group" key={key}>
                    <span>
                      <Icon size={13} /> {label}
                    </span>
                    {items.map((item) => (
                      <button
                        type="button"
                        className="admin-search-result"
                        key={`${key}-${item.id}`}
                        onClick={() => goTo(item.to)}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.detail}</span>
                        <small>{item.meta}</small>
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
