import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { Spinner, ErrorState, EmptyState } from '../../../shared/components/Feedback';
import { useLocale } from '../../../app/providers/LocaleProvider';

export default function CategoriesPage() {
  const { locale } = useLocale();
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => {
    setLoading(true); setError('');
    catalogApi.categories({ limit: 100 }).then((result) => setCategories(result.items || []))
      .catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => categories.filter((item) => {
    const name = item[`name_${locale}`] || '';
    return name.toLowerCase().includes(query.toLowerCase()) &&
      (kind === 'all' || item.category_type === kind || item.category_type === 'both');
  }), [categories, query, kind, locale]);
  if (loading) return <Spinner label="Loading categories..." />;
  if (error) return <div className="container page"><ErrorState message={error} onRetry={load} /></div>;
  return <div className="container page">
    <div className="page-heading-row"><div><span className="eyebrow">Afghan Connect</span><h1>Categories</h1><p className="muted">Browse available product and service categories.</p></div></div>
    <div className="catalog-toolbar"><input className="inline-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories..." aria-label="Search categories" />
      <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Category type"><option value="all">All categories</option><option value="product">Products</option><option value="service">Services</option></select></div>
    {visible.length ? <div className="category-grid">{visible.map((item) => {
      const name = item[`name_${locale}`] || '';
      const href = item.category_type === 'service' ? `/services?category_id=${item.id}` : `/marketplace?category_id=${item.id}`;
      return <Link className="category-card" to={href} key={item.id}><span className="category-icon">{name?.slice(0,1)}</span><strong>{name}</strong><small>{item.category_type}</small></Link>;
    })}</div> : <EmptyState title="No categories found" description="Try another search or category type." />}
  </div>;
}
