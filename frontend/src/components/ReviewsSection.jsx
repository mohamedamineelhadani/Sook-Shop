import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { createReview, deleteReview, listReviews, updateReview } from '../api/reviews.js';
import { ErrorState, LoadingState } from '../components/States.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { formatDate, formatStars } from '../lib/format.js';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

const EMPTY_RESULT = {
  data: [],
  pagination: {},
  summary: { count: 0, average: 0, distribution: {} },
  mine: null,
};

const initials = (name) =>
  String(name || 'C')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function ReviewsSection({ product, summary, onChanged }) {
  const { user } = useAuth();
  const [sort, setSort] = useState('newest');
  const [rating, setRating] = useState('');
  const [result, setResult] = useState(EMPTY_RESULT);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const syncedReview = useRef(null);

  useEffect(() => {
    let alive = true;
    listReviews({ product: product._id, sort, rating, limit: 10 })
      .then((data) => {
        if (!alive) return;
        setResult(data);
        setError('');
        setLoaded(true);

        // Sync the form with the user's saved review only when it actually
        // changes, so changing list filters never wipes in-progress typing.
        const review = data.mine;
        const signature = review ? `${review._id}:${review.updatedAt}` : null;
        if (signature && signature !== syncedReview.current) {
          syncedReview.current = signature;
          setForm({ rating: review.rating, title: review.title || '', body: review.body });
        } else if (!review && syncedReview.current) {
          syncedReview.current = null;
          setForm({ rating: 5, title: '', body: '' });
        }
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [product._id, sort, rating, refreshKey]);

  const mine = result.mine;

  const reload = () => {
    setRefreshKey((key) => key + 1);
    onChanged?.();
  };

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (mine) await updateReview(mine._id, form);
      else await createReview({ productId: product._id, ...form });
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!mine || !window.confirm('Delete your review?')) return;
    setSaving(true);
    setFormError('');
    try {
      await deleteReview(mine._id);
      setForm({ rating: 5, title: '', body: '' });
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const liveSummary = result.summary || summary || EMPTY_RESULT.summary;
  const distribution = liveSummary.distribution || {};
  const maxCount = Math.max(1, ...Object.values(distribution).map(Number));

  return (
    <div className="reviews-section">
      <div className="review-summary">
        <div className="review-score-block">
          <div className="review-score">{liveSummary.average || 0}</div>
          <div className="review-stars" style={{ color: 'var(--amber)', fontSize: 18 }}>
            {formatStars(liveSummary.average)}
          </div>
          <div className="review-count">{liveSummary.count || 0} reviews</div>
        </div>

        <div className="review-distribution">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(distribution[star]) || 0;
            return (
              <button
                type="button"
                key={star}
                className={`review-dist-row${rating === String(star) ? ' is-active' : ''}`}
                onClick={() => setRating(rating === String(star) ? '' : String(star))}
                aria-label={`Show ${star} star reviews`}
              >
                <span>{star} ★</span>
                <span className="review-bar">
                  <span style={{ width: `${(count / maxCount) * 100}%` }} />
                </span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="review-toolbar">
        <div className="review-filters">
          <button
            type="button"
            className={!rating ? 'is-active' : ''}
            onClick={() => setRating('')}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              type="button"
              key={star}
              className={rating === String(star) ? 'is-active' : ''}
              onClick={() => setRating(String(star))}
            >
              {star} ★
            </button>
          ))}
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort reviews">
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="review-layout">
        <div>
          {!loaded ? (
            <LoadingState label="Loading reviews…" />
          ) : error ? (
            <ErrorState message={error} />
          ) : result.data.length > 0 ? (
            <div className="review-list">
              {result.data.map((review) => (
                <article className="review-item" key={review._id}>
                  <div className="review-avatar">{initials(review.user?.name)}</div>
                  <div className="review-item-body">
                    <div className="review-item-head">
                      <strong>{review.user?.name || 'Customer'}</strong>
                      {review.verifiedPurchase && (
                        <span className="review-verified">✓ Verified purchase</span>
                      )}
                      <time>{formatDate(review.createdAt)}</time>
                    </div>
                    <div className="review-item-rating" style={{ color: 'var(--amber)' }}>
                      {formatStars(review.rating)} <span>{review.rating}/5</span>
                    </div>
                    {review.title && <h4>{review.title}</h4>}
                    <p>{review.body}</p>
                  </div>
                </article>
              ))}
              {result.pagination?.pages > 1 && (
                <p className="review-more">
                  Showing {result.data.length} of {result.pagination.total} reviews.
                </p>
              )}
            </div>
          ) : (
            <div className="state-box">
              <span aria-hidden="true">✍</span>
              <p className="state-title">No reviews here yet</p>
              <p>Be the first to share what you think about this product.</p>
            </div>
          )}
        </div>

        <aside className="review-form-card">
          <h3>{mine ? 'Your review' : 'Write a review'}</h3>
          {user ? (
            <form onSubmit={submit}>
              <div className="auth-field">
                <span>Your rating</span>
                <div className="review-stars-input" role="group" aria-label="Your rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= form.rating ? 'is-on' : ''}
                      onClick={() => setField('rating', value)}
                      aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    >
                      ★
                    </button>
                  ))}
                  <span>{form.rating} / 5</span>
                </div>
              </div>

              <label className="auth-field">
                <span>Title (optional)</span>
                <input
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  maxLength={120}
                  placeholder="Sum it up in a few words"
                />
              </label>

              <label className="auth-field">
                <span>Your review *</span>
                <textarea
                  rows="4"
                  value={form.body}
                  onChange={(event) => setField('body', event.target.value)}
                  minLength={10}
                  maxLength={1000}
                  required
                  placeholder="What did you like or dislike?"
                />
              </label>

              {formError && <div className="auth-error">{formError}</div>}

              <button className="btn btn--indigo btn--block" type="submit" disabled={saving}>
                {saving ? 'Saving…' : mine ? 'Update my review' : 'Post review'}
              </button>

              {mine && (
                <button
                  type="button"
                  className="review-delete"
                  onClick={remove}
                  disabled={saving}
                >
                  Delete my review
                </button>
              )}

              <p className="review-form-note">
                One review per product. You can edit or delete yours any time. “Verified purchase”
                appears automatically after a delivered cash-on-delivery order.
              </p>
            </form>
          ) : (
            <p className="review-login">
              <Link to="/login">Log in</Link> to share your experience with this product.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
