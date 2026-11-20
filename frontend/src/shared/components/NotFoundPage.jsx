import { Link } from 'react-router';

export default function NotFoundPage() {
  return <div className="container page"><div className="empty-state"><span className="eyebrow">404</span><h1>Page not found</h1><p>The page may have moved or is not available.</p><Link className="btn btn-primary" to="/">Return home</Link></div></div>;
}
