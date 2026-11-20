import { useEffect, useState } from 'react';
import { Eye, EyeOff, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  deleteReview,
  getAdminReviews,
  getReviewStats,
  setReviewVisibility,
} from '../api/reviews.js';
import { formatDate, imageUrl } from '../lib/format.js';

const emptyStats = { total: 0, visible: 0, hidden: 0, average: 0, distribution: {} };

export default function AdminReviewsPage() {
  const [result, setResult] = useState({ data: [] });
  const [stats, setStats] = useState(emptyStats);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const visibility = searchParams.get('visibility') || '';
  const rating = searchParams.get('rating') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    const params = { limit: 100 };
    if (visibility) params.visibility = visibility;
    if (rating) params.rating = rating;

    Promise.all([getAdminReviews(params), getReviewStats()])
      .then(([reviews, reviewStats]) => {
        if (!alive) return;
        setResult(reviews);
        setStats(reviewStats);
        setError('');
        setLoadedKey(refreshKey);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setLoadedKey(refreshKey);
      });

    return () => {
      alive = false;
    };
  }, [refreshKey, visibility, rating]);

  const reviews = result.data.filter((review) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [review.title, review.body, review.user?.name, review.user?.email, review.product?.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const refresh = () => {
    setActionError('');
    setRefreshKey((key) => key + 1);
  };

  const toggleVisibility = async (review) => {
    setActionError('');
    try {
      await setReviewVisibility(review._id, !review.isVisible);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const remove = async (review) => {
    if (!window.confirm('Permanently delete this review?')) return;
    setActionError('');
    try {
      await deleteReview(review._id);
      refresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const cards = [
    { label: 'Total reviews', value: stats.total, icon: Star, tone: 'indigo' },
    { label: 'Visible', value: stats.visible, icon: Eye, tone: 'green' },
    { label: 'Hidden', value: stats.hidden, icon: EyeOff, tone: 'amber' },
    { label: 'Average rating', value: `${stats.average || 0} / 5`, icon: Star, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Reviews</h2>
          <p>Moderate customer feedback. Hiding a review removes it from the storefront and its rating.</p>
        </div>
        <button
          className="admin-button admin-button--ghost"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="admin-form-error">{error}</div>}
      {actionError && <div className="admin-form-error">{actionError}</div>}

      <div className="admin-stats">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div className="admin-stat" key={label}>
            <span className={`admin-stat-icon tone-${tone}`}>
              <Icon size={19} />
            </span>
            <div>
              <span className="admin-stat-label">{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        <label className="admin-search" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => updateParam('q', event.target.value)}
            placeholder="Search review, customer or product"
            aria-label="Search reviews"
          />
        </label>
        <select
          className="admin-select"
          value={visibility}
          onChange={(event) => updateParam('visibility', event.target.value)}
          aria-label="Filter by visibility"
        >
          <option value="">All visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          className="admin-select"
          value={rating}
          onChange={(event) => updateParam('rating', event.target.value)}
          aria-label="Filter by rating"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <span className="admin-result-count">{reviews.length} reviews</span>
      </div>

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading reviews…</div>
        ) : reviews.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Review</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Date</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>
                    <div className="admin-review-cell">
                      <strong>{review.title || 'Untitled review'}</strong>
                      {review.verifiedPurchase && (
                        <span className="admin-review-verified">✓ Verified purchase</span>
                      )}
                      <span className="admin-review-excerpt" title={review.body}>
                        {review.body}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-review-product">
                      <img src={imageUrl(review.product?.images?.[0])} alt="" />
                      <span>{review.product?.name || 'Product removed'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-order-cell">
                      <strong>{review.user?.name || 'Customer'}</strong>
                      <span>{review.user?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-review-stars">
                      {'★'.repeat(review.rating)}
                      <span>{'☆'.repeat(5 - review.rating)}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${review.isVisible ? 'badge-green' : 'badge-muted'}`}>
                      {review.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td><span className="admin-order-cell">{formatDate(review.createdAt)}</span></td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-icon-button"
                        onClick={() => toggleVisibility(review)}
                        aria-label={review.isVisible ? 'Hide review' : 'Show review'}
                        title={review.isVisible ? 'Hide review' : 'Show review'}
                      >
                        {review.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="admin-icon-button danger"
                        onClick={() => remove(review)}
                        aria-label="Delete review"
                        title="Delete review"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No reviews match your filters.</div>
        )}
      </div>
    </>
  );
}
