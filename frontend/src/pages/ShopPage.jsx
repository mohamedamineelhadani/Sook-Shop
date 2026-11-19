import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { getBrands, getCategories, getProducts } from '../api/catalog.js';
import ProductCard from '../components/ProductCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/States.jsx';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [resultKey, setResultKey] = useState(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => ({
    key: searchParams.toString(),
    q: searchParams.get('q') || '',
    min: searchParams.get('min') || '',
    max: searchParams.get('max') || '',
  }));

  const loading = resultKey !== queryString;
  const filters =
    draft.key === queryString
      ? draft
      : {
          key: queryString,
          q: searchParams.get('q') || '',
          min: searchParams.get('min') || '',
          max: searchParams.get('max') || '',
        };

  useEffect(() => {
    let alive = true;
    Promise.all([getCategories({ activeOnly: 'true' }), getBrands()])
      .then(([categoryResult, brandResult]) => {
        if (!alive) return;
        setCategories(categoryResult.data);
        setBrands(brandResult.data);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams(queryString);
    if (!params.has('limit')) params.set('limit', '9');

    getProducts(params)
      .then((data) => {
        if (!alive) return;
        setResult(data);
        setResultKey(queryString);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setResultKey(queryString);
      });

    return () => {
      alive = false;
    };
  }, [queryString]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const toggleListParam = (key, value) => {
    const current = (searchParams.get(key) || '').split(',').filter(Boolean);
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setParam(key, updated.join(','));
  };

  const applyPrice = () => {
    const next = new URLSearchParams(searchParams);
    if (filters.min) next.set('min', filters.min);
    else next.delete('min');
    if (filters.max) next.set('max', filters.max);
    else next.delete('max');
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const { data, pagination } = result;
  const total = pagination.total || 0;
  const from = total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = Math.min(pagination.page * pagination.limit || 0, total);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Shop · All products</span>
          </div>
          <h1>{searchParams.get('q') ? `Results for “${searchParams.get('q')}”` : 'All Products'}</h1>
          <p>
            Tech, gadgets and accessories for every setup. Every order is cash on delivery —
            use the filters to find your next upgrade.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="shop-layout">
            <aside className="filters" aria-label="Filters">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setParam('q', filters.q.trim());
                }}
              >
                <div className="filter-block">
                  <h3>Search</h3>
                  <input
                    type="search"
                    className="admin-search-input"
                    value={filters.q}
                    onChange={(event) => setDraft({ ...filters, q: event.target.value })}
                    placeholder="Product name or brand"
                    aria-label="Search products"
                  />
                  <button className="btn btn--indigo btn--block" type="submit" style={{ marginTop: 8 }}>
                    Search
                  </button>
                </div>
              </form>

              <div className="filter-block">
                <h3>Category</h3>
                {categories.map((category) => (
                  <label key={category._id}>
                    <input
                      type="checkbox"
                      checked={(searchParams.get('category') || '').split(',').includes(category.slug)}
                      onChange={() => toggleListParam('category', category.slug)}
                    />
                    {category.name}
                    <span className="ct">{category.productCount}</span>
                  </label>
                ))}
              </div>

              <div className="filter-block">
                <h3>Price range</h3>
                <div className="price-filter-row">
                  <input
                    type="number"
                    min="0"
                    value={filters.min}
                    onChange={(event) => setDraft({ ...filters, min: event.target.value })}
                    placeholder="Min"
                    aria-label="Minimum price"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min="0"
                    value={filters.max}
                    onChange={(event) => setDraft({ ...filters, max: event.target.value })}
                    placeholder="Max"
                    aria-label="Maximum price"
                  />
                </div>
                <button className="btn btn--ghost btn--block" onClick={applyPrice} style={{ marginTop: 8 }}>
                  Apply price
                </button>
              </div>

              <div className="filter-block">
                <h3>Brand</h3>
                {brands.map((brand) => (
                  <label key={brand}>
                    <input
                      type="checkbox"
                      checked={(searchParams.get('brand') || '').split(',').includes(brand)}
                      onChange={() => toggleListParam('brand', brand)}
                    />
                    {brand}
                  </label>
                ))}
              </div>

              <div className="filter-block">
                <h3>Availability</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={searchParams.get('inStock') === 'true'}
                    onChange={(event) => setParam('inStock', event.target.checked ? 'true' : '')}
                  />
                  In stock
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={searchParams.get('onSale') === 'true'}
                    onChange={(event) => setParam('onSale', event.target.checked ? 'true' : '')}
                  />
                  On sale
                </label>
              </div>

              <button className="btn btn--ghost btn--block" onClick={clearFilters}>
                Clear all filters
              </button>
            </aside>

            <div>
              <div className="shop-toolbar">
                <span className="count">
                  {loading ? 'Loading…' : `Showing ${from} – ${to} of ${total} products`}
                </span>
                <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-mute)', fontFamily: 'var(--ff-mono)' }}>
                    SORT
                  </span>
                  <select
                    value={searchParams.get('sort') || 'popular'}
                    onChange={(event) => setParam('sort', event.target.value)}
                    aria-label="Sort products"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
              {loading ? (
                <LoadingState />
              ) : data.length ? (
                <>
                  <div className="shop-grid">
                    {data.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  {pagination.pages > 1 && (
                    <div className="pagination">
                      <button
                        className="pg"
                        disabled={pagination.page <= 1}
                        onClick={() => setParam('page', pagination.page - 1)}
                      >
                        ‹
                      </button>
                      {Array.from({ length: pagination.pages }, (_, index) => index + 1)
                        .slice(0, 8)
                        .map((page) => (
                          <button
                            key={page}
                            className={`pg${page === pagination.page ? ' is-active' : ''}`}
                            onClick={() => setParam('page', page)}
                          >
                            {page}
                          </button>
                        ))}
                      <button
                        className="pg"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setParam('page', pagination.page + 1)}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No products found"
                  message="Try removing a filter or searching for something else."
                  action={
                    <button className="btn btn--indigo" onClick={clearFilters} style={{ marginTop: 16 }}>
                      Clear filters
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
