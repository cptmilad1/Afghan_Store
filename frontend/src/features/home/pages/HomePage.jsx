import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { imageUrl } from '../../../services/api/client';
import ProductCard from '../../products/components/ProductCard';
import { Icon } from '../../../shared/components/Icon';
import { Spinner, ErrorState } from '../../../shared/components/Feedback';
import { useLocale } from '../../../app/providers/LocaleProvider';

export default function HomePage() {
  const { locale, t } = useLocale();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState('product');
  const navigate = useNavigate();

  const load = () => {
    setError('');
    Promise.all([
      catalogApi.categories({ limit: 100 }),
      catalogApi.products({ limit: 12 }),
      catalogApi.services({ limit: 4 }),
    ])
      .then(([categoryData, productData, serviceData]) => {
        setCategories(categoryData.items || []);
        setProducts(productData.items || []);
        setServices(serviceData.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [categoryData, productData, serviceData] = await Promise.all([
          catalogApi.categories({ limit: 100 }),
          catalogApi.products({ limit: 12 }),
          catalogApi.services({ limit: 4 }),
        ]);
        setCategories(categoryData.items || []);
        setProducts(productData.items || []);
        setServices(serviceData.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`${searchType === 'service' ? '/services' : '/marketplace'}?search=${encodeURIComponent(search.trim())}`);
  };

  if (loading) return <Spinner label="Preparing Afghan Connect..." />;
  if (error) return <ErrorState message={error} onRetry={() => { setError(''); setLoading(true); load(); }} />;

  const shoppingCategories = categories.filter((category) => category.category_type === 'product' || category.category_type === 'both');
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">{t('heroEyebrow')}</span>
            <h1>{t('heroTitle')}<br /><span>{locale === 'en' ? 'Support local.' : locale === 'ps' ? 'له ځايي خلکو ملاتړ وکړئ.' : 'از کسب‌وکارهای محلی حمایت کنید.'}</span></h1>
            <p>{t('heroSubtitle')}</p>
            <form className="hero-search" onSubmit={submitSearch}>
              <Icon name="search" />
              <select value={searchType} onChange={(event) => setSearchType(event.target.value)} aria-label="Search type"><option value="product">Products</option><option value="service">Services</option></select>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchProducts')} />
              <button className="btn btn-primary">Search</button>
            </form>
          </div>
          <div className="hero-panel">
            <div className="hero-stat"><strong>2-in-1</strong><span>Shopping & local services</span></div>
            <div className="hero-route"><span>Marketplace</span><Icon name="arrow" /><span>Services</span></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">{t('browse')}</span><h2>{t('popular')}</h2></div><Link to="/marketplace">View all <Icon name="arrow" size={16} /></Link></div>
          <div className="category-grid">
            {shoppingCategories.slice(0, 8).map((category) => (
              <Link className="category-card" to={`/marketplace?category_id=${category.id}`} key={category.id}>
                <span className="category-icon">{category.name_en?.charAt(0)}</span>
                <span>{category[`name_${locale}`] || ''}</span>
                <small>{category.name_prs}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">{t('latest')}</span><h2>{t('latest')}</h2></div><Link to="/marketplace">{t('browseMarket')} <Icon name="arrow" size={16} /></Link></div>
          {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h3>No products available yet</h3><p>New listings will appear here after seller approval.</p></div>}
        </div>
      </section>
      {products.some((product) => product.is_featured) && <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Seller highlights</span><h2>Featured products</h2></div></div><div className="product-grid">{products.filter((product) => product.is_featured).map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>}
      {products.some((product) => product.condition_status === 'used') && <section className="section section-muted"><div className="container"><div className="section-heading"><div><span className="eyebrow">Pre-owned</span><h2>Second-hand finds</h2></div></div><div className="product-grid">{products.filter((product) => product.condition_status === 'used').map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>}
      {services.length > 0 && <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">Local professionals</span><h2>Recently listed services</h2></div><Link to="/services">Browse services <Icon name="arrow" size={16} /></Link></div><div className="service-grid">{services.map((service) => { const image = service.images?.find((item) => item.is_primary) || service.images?.[0]; return <Link className="service-card" to={`/services/${service.id}`} key={service.id}><div className="service-card-image">{image?.image_url ? <img src={imageUrl(image.image_url)} alt={image.alt_text || service.name} /> : <Icon name="grid" size={32} />}</div><div><h3>{service.name}</h3><p>{service.store_name} · {service.city || 'Afghanistan'}</p><strong>{Number(service.price).toLocaleString()} AFN <small>/ {service.pricing_type}</small></strong></div></Link>; })}</div></div></section>}
      <section className="section">
        <div className="container service-banner">
          <div><span className="eyebrow">Local expertise</span><h2>Need help at home or work?</h2><p>Find electricians, plumbers, cleaners, installers and other trusted service providers.</p></div>
          <Link className="btn btn-primary" to="/services">Explore services <Icon name="arrow" size={17} /></Link>
        </div>
      </section>
    </>
  );
}
