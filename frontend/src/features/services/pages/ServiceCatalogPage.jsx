import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { imageUrl } from '../../../services/api/client';
import { Spinner, ErrorState, EmptyState } from '../../../shared/components/Feedback';
import { Icon } from '../../../shared/components/Icon';
import { useLocale } from '../../../app/providers/LocaleProvider';
import DatabaseAutocomplete from '../../../shared/components/DatabaseAutocomplete';

export default function ServiceCatalogPage() {
  const { locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') || '');
  const [city, setCity] = useState(params.get('city') || '');
  const [pricingType, setPricingType] = useState(params.get('pricing_type') || '');
  const [pagination, setPagination] = useState(null);

  const load = () => {
    Promise.all([catalogApi.categories({ limit: 100 }), catalogApi.services({ ...Object.fromEntries(params), limit: 24 })])
      .then(([categoryData, serviceData]) => { setCategories((categoryData.items || []).filter((category) => category.category_type === 'service' || category.category_type === 'both')); setServices(serviceData.items || []); setPagination(serviceData.pagination || null); })
      .catch((err) => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, [params]);

  const submit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set('search', search.trim()); else next.delete('search');
    if (city.trim()) next.set('city', city.trim()); else next.delete('city');
    if (pricingType) next.set('pricing_type', pricingType); else next.delete('pricing_type');
    next.delete('page');
    setParams(next);
  };
  const setCategory = (value) => { const next = new URLSearchParams(params); value ? next.set('category_id', value) : next.delete('category_id'); setParams(next); };

  return (
    <div className="container page">
      <div className="catalog-header"><div><span className="eyebrow">Professional help</span><h1>Local Services</h1></div><form className="inline-search" onSubmit={submit}><DatabaseAutocomplete kind="services" value={search} onChange={setSearch} onSelect={(item) => { const next = new URLSearchParams(params); next.set('search', item.name); next.delete('page'); setParams(next); }} placeholder="Search services" /><button className="btn btn-primary">Search</button></form></div>
      <div className="catalog-layout">
        <aside className="filter-panel"><h3>Service category</h3><button className={!params.get('category_id') ? 'filter-option active' : 'filter-option'} onClick={() => setCategory('')}>All services</button>{categories.map((category) => <button key={category.id} className={params.get('category_id') === category.id ? 'filter-option active' : 'filter-option'} onClick={() => setCategory(category.id)}>{category[`name_${locale}`] || ''}</button>)}<h3>Price type</h3><select value={pricingType} onChange={(event) => setPricingType(event.target.value)}><option value="">All types</option><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="quote">Quote</option></select><h3>City</h3><DatabaseAutocomplete kind="cities" value={city} onChange={setCity} placeholder="Filter by city" /><button className="btn btn-secondary" onClick={submit}>Apply filters</button></aside>
        <div>{loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : services.length ? <><div className="service-grid">{services.map((service) => { const image = service.images?.find((item) => item.is_primary) || service.images?.[0]; return <Link className="service-card" to={`/services/${service.id}`} key={service.id}><div className="service-card-image">{image?.image_url ? <img src={imageUrl(image.image_url)} alt={service.name} /> : <Icon name="grid" size={32} />}</div><div><h3>{service.name}</h3><p>{service.store_name} · {service.city || 'Afghanistan'}</p><strong>{Number(service.price).toLocaleString()} AFN <small>/ {service.pricing_type}</small></strong></div></Link>; })}</div>{pagination?.totalPages > 1 && <div className="pagination"><button className="btn btn-secondary" disabled={pagination.page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(pagination.page - 1)); setParams(next); }}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(pagination.page + 1)); setParams(next); }}>Next</button></div>}</> : <EmptyState title="No services found" description="Try another category or search." />}</div>
      </div>
    </div>
  );
}
