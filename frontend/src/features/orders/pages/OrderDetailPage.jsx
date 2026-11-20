import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useCallback } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner } from '../../../shared/components/Feedback';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewForms, setReviewForms] = useState({});
  const [reviewedItems, setReviewedItems] = useState({});

  const load = useCallback(async () => {
    try {
      const [orderData, historyData, paymentData] = await Promise.all([
        apiRequest(`/orders/${id}`),
        apiRequest(`/orders/${id}/history`),
        apiRequest(`/payments/orders/${id}`),
      ]);
      setOrder(orderData);
      setHistory(historyData || []);
      setPayments(paymentData || []);
    } catch (err) { setError(err.message); }
  }, [id]);
  useEffect(() => {
    async function fetchOrder() { await load(); }
    fetchOrder();
  }, [id, load]);

  const cancel = async () => {
    if (!window.confirm('Cancel this pending order?')) return;
    setBusy(true);
    try { await apiRequest(`/orders/${id}/cancel`, { method: 'PATCH', body: {} }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const submitReview = async (event, item) => {
    event.preventDefault();
    const form = reviewForms[item.id] || { rating: '5', review_text: '' };
    try {
      await apiRequest('/reviews', { method: 'POST', body: { order_item_id: item.id, rating: Number(form.rating), review_text: form.review_text || undefined } });
      setReviewedItems((current) => ({ ...current, [item.id]: true }));
    } catch (err) { setError(err.message); }
  };

  if (!order) return error ? <div className="container page"><div className="error-state">{error}<p><Link to="/orders">Back to orders</Link></p></div></div> : <Spinner />;
  return (
    <div className="container page"><div className="breadcrumbs"><Link to="/orders">My orders</Link><span>/</span><span>{order.order_number}</span></div><div className="page-heading-row"><div><span className="eyebrow">Order details</span><h1>{order.order_number}</h1></div><span className="status-pill">{order.order_status}</span></div>{order.order_status === 'pending' && <button className="btn btn-secondary" disabled={busy} onClick={cancel}>Cancel order</button>}
      <div className="order-detail-grid"><section className="form-section"><h2>Items</h2>{order.items?.map((item) => { const delivered = order.seller_orders?.some((sellerOrder) => sellerOrder.id === item.seller_order_id && sellerOrder.seller_order_status === 'delivered'); return <div className="order-line-wrap" key={item.id}><div className="order-line"><div><strong>{item.item_name_snapshot}</strong><p>{item.item_type} · Qty {item.quantity}</p></div><strong>{Number(item.line_total).toLocaleString()} AFN</strong></div>{delivered && (reviewedItems[item.id] ? <p className="inline-message">Review submitted.</p> : <form className="review-form" onSubmit={(event) => submitReview(event, item)}><label>Rating<select value={reviewForms[item.id]?.rating || '5'} onChange={(event) => setReviewForms((current) => ({ ...current, [item.id]: { ...current[item.id], rating: event.target.value } }))}><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label>Review<input value={reviewForms[item.id]?.review_text || ''} onChange={(event) => setReviewForms((current) => ({ ...current, [item.id]: { ...current[item.id], review_text: event.target.value } }))} /></label><button className="btn btn-secondary">Submit review</button></form>)}</div>; })}<div className="summary-total"><span>Total</span><strong>{Number(order.total_amount).toLocaleString()} AFN</strong></div></section><section className="form-section"><h2>Payment</h2><p>Order payment: <strong>{order.payment_status}</strong></p>{payments.map((payment) => <div className="payment-line" key={payment.id}><span>{payment.payment_method}</span><strong>{payment.transaction_status}</strong><small>{Number(payment.amount).toLocaleString()} {payment.currency}</small></div>)}</section></div>
      <section className="form-section order-history"><h2>Status history</h2>{history.length ? history.map((entry) => <div className="timeline-entry" key={entry.id}><span className="timeline-dot" /><div><strong>{entry.new_status}</strong><p>{entry.note || `${entry.old_status || 'Created'} → ${entry.new_status}`}</p><small>{new Date(entry.changed_at).toLocaleString()}</small></div></div>) : <p className="muted">No status updates yet.</p>}</section>
    </div>
  );
}
