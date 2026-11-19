export function LoadingState({ label = 'Loading products…' }) {
  return (
    <div className="state-box">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-box--error">
      <span aria-hidden="true">⚠</span>
      <p>{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn btn--indigo" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state-box">
      <span aria-hidden="true">🔎</span>
      <p className="state-title">{title}</p>
      <p>{message}</p>
      {action}
    </div>
  );
}
