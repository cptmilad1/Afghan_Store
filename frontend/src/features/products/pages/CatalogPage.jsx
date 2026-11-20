import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { apiRequest } from '../../../services/api/client';
import { useAuth } from '../../../app/providers/authContext';
import ProductCard from '../components/ProductCard';
import { Spinner, ErrorState, EmptyState } from '../../../shared/components/Feedback';
import { useLocale } from '../../../app/providers/LocaleProvider';
import DatabaseAutocomplete from '../../../shared/components/DatabaseAutocomplete';

export default function CatalogPage() {
  const { locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(params.get('search') || '');
  const [minPrice, setMinPrice] = useState(params.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') || '');
  const [pagination, setPagination] = useState(null);

  const query = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const load = () => {
    Promise.all([
      catalogApi.categories({ limit: 100 }),
      catalogApi.products({ ...query, limit: 24 }),
    ]).then(([categoryData, productData]) => {
      setCategories((categoryData.items || []).filter((category) => category.category_type === 'product' || category.category_type === 'both'));
      setProducts(productData.items || []);
      setPagination(productData.pagination || null);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(load, [params, query]);

  const submit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set('search', search.trim()); else next.delete('search');
    if (minPrice) next.set('min_price', minPrice); else next.delete('min_price');
    if (maxPrice) next.set('max_price', maxPrice); else next.delete('max_price');
    next.delete('page');
    setParams(next);
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const changePage = (page) => {
    const next = new URLSearchParams(params);
    if (page > 1) next.set('page', String(page)); else next.delete('page');
    setParams(next);
  };

  const addWishlist = async (product) => {
    if (!user) return;
    try { await apiRequest('/wishlist', { method: 'POST', body: { product_id: product.id } }); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="container page">
      <div className="catalog-header">
        <div><span className="eyebrow">Shopping</span><h1>Marketplace</h1></div>
        <form className="inline-search" onSubmit={submit}><DatabaseAutocomplete kind="products" value={search} onChange={setSearch} onSelect={(item) => { const next = new URLSearchParams(params); next.set('search', item.name); next.delete('page'); setParams(next); }} placeholder="Search products" /><button className="btn btn-primary">Search</button></form>
      </div>
      <div className="catalog-layout">
        <aside className="filter-panel">
          <h3>Category</h3>
          <button className={!params.get('category_id') ? 'filter-option active' : 'filter-option'} onClick={() => setFilter('category_id', '')}>All categories</button>
          {categories.map((category) => <button key={category.id} className={params.get('category_id') === category.id ? 'filter-option active' : 'filter-option'} onClick={() => setFilter('category_id', category.id)}>{category[`name_${locale}`] || ''}</button>)}
          <h3>Condition</h3>
          {['new', 'used', 'refurbished'].map((condition) => <button key={condition} className={params.get('condition_status') === condition ? 'filter-option active' : 'filter-option'} onClick={() => setFilter('condition_status', params.get('condition_status') === condition ? '' : condition)}>{condition}</button>)}
          <h3>Price range (AFN)</h3>
          <div className="price-filter"><input aria-label="Minimum price" type="number" min="0" placeholder="Min" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /><input aria-label="Maximum price" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /><button className="btn btn-secondary" onClick={submit}>Apply</button></div>
          {(params.has('category_id') || params.has('search') || params.has('condition_status') || params.has('min_price') || params.has('max_price')) && <button className="text-button clear-filters" onClick={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); setParams({}); }}>Clear all filters</button>}
        </aside>
        <div>
          {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : products.length ? <><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} onWishlist={user?.role_name === 'customer' ? addWishlist : undefined} />)}</div>{pagination?.totalPages > 1 && <div className="pagination"><button className="btn btn-secondary" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages} onClick={() => changePage(pagination.page + 1)}>Next</button></div>}</> : <EmptyState title="No products found" description="Try a different search or remove filters." />}
        </div>
      </div>
    </div>
  );
}
