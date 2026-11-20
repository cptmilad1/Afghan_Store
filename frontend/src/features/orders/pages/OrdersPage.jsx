import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner, EmptyState } from '../../../shared/components/Feedback';
import { Link } from 'react-router';

export default function OrdersPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest('/orders/mine').then(setOrders).catch((err) => setError(err.message)); }, []);
  if (error) return <div className="container page"><div className="error-state"><p>{error}</p></div></div>;
  if (!orders) return <Spinner />;
  if (!orders.length) return <div className="container page"><EmptyState title="No orders yet" description="Your order history will appear here." /></div>;
  return (
    <div className="container page"><span className="eyebrow">Your account</span><h1>My orders</h1><div className="order-list">{orders.map((order) => <Link className="order-card" to={`/orders/${order.id}`} key={order.id}><div><span>Order</span><strong>{order.order_number}</strong></div><div><span>Status</span><strong className="status-pill">{order.order_status}</strong></div><div><span>Payment</span><strong>{order.payment_status}</strong></div><div><span>Total</span><strong>{Number(order.total_amount).toLocaleString()} AFN</strong></div></Link>)}</div></div>
  );
}
