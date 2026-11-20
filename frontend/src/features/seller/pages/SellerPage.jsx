import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner } from '../../../shared/components/Feedback';
import SellerListingForm from '../components/SellerListingForm';
import { useAuth } from '../../../app/providers/authContext';

export default function SellerPage() {
  const { setUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [createType, setCreateType] = useState('');
  const [editingListing, setEditingListing] = useState(null);
  const [form, setForm] = useState({ store_name: '', store_slug: '', description: '', province: '', city: '' });
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [sellerProfile, sellerProducts, sellerServices, sellerOrders, categoryData] = await Promise.all([
        apiRequest('/seller-profiles/me'),
        apiRequest('/products/seller/mine'),
        apiRequest('/services/seller/mine'),
        apiRequest('/orders/seller/mine'),
        apiRequest('/categories?limit=100'),
      ]);
      setProfile(sellerProfile);
      if (sellerProfile?.approval_status === 'approved') {
        localStorage.setItem('afghan_connect_role', 'seller');
        setUser((current) => ({ ...current, role_name: 'seller' }));
      }
      setProducts(sellerProducts || []);
      setServices(sellerServices || []);
      setOrders(sellerOrders || []);
      setCategories(categoryData.items || []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [setUser]);
  useEffect(() => {
    async function fetchData() {
      await load();
    }
    fetchData();
  }, [load]);

  const apply = async (event) => {
    event.preventDefault();
    try { setProfile(await apiRequest('/seller-profiles/apply', { method: 'POST', body: form })); setMessage('Seller application submitted.'); } catch (err) { setMessage(err.message); }
  };

  const updateOrder = async (order, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel seller order ${order.seller_order_number}?`)) return;
    try {
      await apiRequest(`/orders/seller-orders/${order.id}/status`, { method: 'PATCH', body: { seller_order_status: status } });
      setOrders((items) => items.map((item) => item.id === order.id ? { ...item, seller_order_status: status } : item));
    } catch (err) { setMessage(err.message); }
  };
  const deactivateListing = async (type, listing) => {
    if (!window.confirm(`Deactivate "${listing.name}"?`)) return;
    try {
      await apiRequest(`/${type}/${listing.id}`, { method: 'DELETE' });
      const updateItems = type === 'products' ? setProducts : setServices;
      updateItems((items) => items.map((item) => item.id === listing.id ? { ...item, listing_status: 'inactive' } : item));
    } catch (err) { setMessage(err.message); }
  };

  if (loading) return <Spinner label="Loading seller workspace..." />;

  if (profile && profile.approval_status !== 'approved') {
    return <div className="container page"><span className="eyebrow">Seller onboarding</span><h1>{profile.store_name}</h1><div className="form-section"><span className="status-pill">{profile.approval_status}</span><p className="muted">Your seller application must be approved before you can publish listings or manage orders.</p></div></div>;
  }

  if (!profile && tab === 'overview') {
    return (
      <div className="container page"><span className="eyebrow">Seller onboarding</span><h1>Become a seller</h1><div className="form-section seller-form">{message && <div className="inline-message">{message}</div>}<form className="profile-form" onSubmit={apply}><label>Store name<input required value={form.store_name} onChange={(event) => setForm({ ...form, store_name: event.target.value })} /></label><label>Store slug<input required value={form.store_slug} onChange={(event) => setForm({ ...form, store_slug: event.target.value })} /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="two-fields"><label>Province<input value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></label><label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label></div><button className="btn btn-primary">Submit application</button></form></div></div>
    );
  }

  return (
    <div className="container page"><div className="page-heading-row"><div><span className="eyebrow">Seller hub</span><h1>{profile?.store_name || 'Seller workspace'}</h1></div><span className="status-pill">{profile?.approval_status}</span></div>{message && <div className="inline-message">{message}</div>}<div className="dashboard-tabs">{['overview','orders','products','services'].map((value) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setCreateType(''); setEditingListing(null); }}>{value}</button>)}</div>{tab === 'overview' && <div className="stat-grid"><div><span>Products</span><strong>{products.length}</strong></div><div><span>Services</span><strong>{services.length}</strong></div><div><span>Orders</span><strong>{orders.length}</strong></div></div>}{tab === 'orders' && <div className="order-list">{orders.map((order) => <article className="order-card seller-order-card" key={order.id}><div><span>Sub-order</span><strong>{order.seller_order_number}</strong></div><div><span>Status</span><strong>{order.seller_order_status}</strong></div><div><span>Customer</span><strong>{order.customer_name}</strong></div><div>{(sellerTransitions[order.seller_order_status] || []).map((status) => <button className="btn btn-secondary" key={status} onClick={() => updateOrder(order, status)}>{status}</button>)}</div></article>)}</div>}{tab === 'products' && <><button className="btn btn-primary create-listing" onClick={() => { setEditingListing(null); setCreateType(createType === 'product' ? '' : 'product'); }}>Add product</button>{createType === 'product' && <SellerListingForm type="product" categories={categories} listing={editingListing} onDone={(text) => { setMessage(text); setCreateType(''); setEditingListing(null); load(); }} />}<div className="table-list">{products.map((product) => <div key={product.id}><strong>{product.name}</strong><span>{product.listing_status}</span><strong>{Number(product.price).toLocaleString()} AFN</strong><button className="text-button" onClick={() => { setEditingListing(product); setCreateType('product'); }}>Edit</button>{product.listing_status !== 'inactive' && <button className="text-button danger" onClick={() => deactivateListing('products', product)}>Deactivate</button>}</div>)}</div></>}{tab === 'services' && <><button className="btn btn-primary create-listing" onClick={() => { setEditingListing(null); setCreateType(createType === 'service' ? '' : 'service'); }}>Add service</button>{createType === 'service' && <SellerListingForm type="service" categories={categories} listing={editingListing} onDone={(text) => { setMessage(text); setCreateType(''); setEditingListing(null); load(); }} />}<div className="table-list">{services.map((service) => <div key={service.id}><strong>{service.name}</strong><span>{service.listing_status}</span><strong>{Number(service.price).toLocaleString()} AFN</strong><button className="text-button" onClick={() => { setEditingListing(service); setCreateType('service'); }}>Edit</button>{service.listing_status !== 'inactive' && <button className="text-button danger" onClick={() => deactivateListing('services', service)}>Deactivate</button>}</div>)}</div></>}</div>
  );
}

const sellerTransitions = {
  pending: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['preparing', 'cancelled', 'failed'],
  preparing: ['ready', 'cancelled', 'failed'],
  ready: ['out_for_delivery', 'cancelled', 'failed'],
  out_for_delivery: ['failed'],
};
