export function Spinner({ label = 'Loading...' }) {
  return <div className="flex items-center justify-center gap-3 py-12 text-muted"><span className="spinner" /><span>{label}</span></div>;
}

export function EmptyState({ title, description, action }) {
  return <div className="empty-state"><div className="empty-icon">0</div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="error-state"><strong>Unable to load this section</strong><p>{message}</p>{onRetry && <button className="btn btn-secondary" onClick={onRetry}>Try again</button>}</div>;
}
