import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../../../services/api/client';
import { EmptyState, Spinner } from '../../../shared/components/Feedback';

export default function WishlistPage() {
  const [items, setItems] = useState(null);
  const load = () => apiRequest('/wishlist').then(setItems);
  useEffect(() => { load(); }, []);
  const remove = async (item) => { await apiRequest(`/wishlist/${item.id}`, { method: 'DELETE' }); load(); };
  if (!items) return <Spinner />;
  return <div className="container page"><span className="eyebrow">Saved for later</span><h1>Wishlist</h1>{items.length ? <div className="table-list">{items.map((item) => { const product = item.product_id; return <div key={item.id}><strong>{item.product_name || item.service_name}</strong><span>{product ? 'Product' : 'Service'}</span><strong>{Number(item.product_price || item.service_price).toLocaleString()} AFN</strong><Link to={product ? `/products/${item.product_id}` : `/services/${item.service_id}`}>View</Link><button className="text-button danger" onClick={() => remove(item)}>Remove</button></div>; })}</div> : <EmptyState title="Your wishlist is empty" description="Save a product or service to find it later." />}</div>;
}
