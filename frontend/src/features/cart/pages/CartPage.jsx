import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../../../services/api/client';
import { Spinner, EmptyState } from '../../../shared/components/Feedback';
import { Icon } from '../../../shared/components/Icon';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');

  const load = () => apiRequest('/cart').then(setCart).catch((err) => setError(err.message));
  useEffect(load, []);

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return;
    await apiRequest(`/cart/items/${item.id}`, { method: 'PATCH', body: { quantity } });
    load();
  };
  const removeItem = async (item) => {
    await apiRequest(`/cart/items/${item.id}`, { method: 'DELETE' });
    load();
  };

  if (!cart) return error ? <div className="container page"><div className="error-state"><p>{error}</p></div></div> : <Spinner />;
  if (!cart.items.length) return <div className="container page"><EmptyState title="Your cart is empty" description="Browse products and services to add items." action={<Link className="btn btn-primary" to="/marketplace">Browse marketplace</Link>} /></div>;

  return (
    <div className="container page">
      <span className="eyebrow">Shopping cart</span><h1>Your cart</h1>
      <div className="cart-layout">
        <div className="cart-items">{cart.items.map((item) => <div className="cart-item" key={item.id}><div className="cart-item-icon"><Icon name={item.item_type === 'product' ? 'bag' : 'grid'} /></div><div className="cart-item-info"><span className="badge badge-neutral">{item.item_type}</span><h3>{item.name}</h3><p>{item.store_name}</p><strong>{Number(item.price).toLocaleString()} AFN</strong></div><div className="cart-controls">{item.item_type === 'product' && <label>Qty<input type="number" min="1" max="100" value={item.quantity} onChange={(event) => updateQuantity(item, Number(event.target.value))} /></label>}<button className="text-button danger" onClick={() => removeItem(item)}>Remove</button></div></div>)}</div>
        <aside className="order-summary"><h3>Order summary</h3><div><span>Subtotal</span><strong>{Number(cart.subtotal).toLocaleString()} AFN</strong></div><div><span>Delivery</span><strong>0 AFN</strong></div><hr /><div className="summary-total"><span>Total</span><strong>{Number(cart.subtotal).toLocaleString()} AFN</strong></div><Link className="btn btn-primary btn-full" to="/checkout">Proceed to checkout</Link></aside>
      </div>
    </div>
  );
}
