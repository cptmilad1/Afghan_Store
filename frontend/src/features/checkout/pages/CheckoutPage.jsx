import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../../../services/api/client';
import { Spinner } from '../../../shared/components/Feedback';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [coupon, setCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [note, setNote] = useState('');
  const [addressForm, setAddressForm] = useState({ recipient_name: '', recipient_phone: '', province: '', city: '', district: '', street_address: '', label: 'Home', is_default: true });
  const [showAddress, setShowAddress] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([apiRequest('/cart'), apiRequest('/addresses')]).then(([cartData, addressData]) => { setCart(cartData); setAddresses(addressData || []); const def = addressData?.find((address) => address.is_default) || addressData?.[0]; if (def) setAddressId(String(def.id)); }).catch((err) => setError(err.message));
  useEffect(load, []);

  const createAddress = async (event) => {
    event.preventDefault();
    try {
      const created = await apiRequest('/addresses', { method: 'POST', body: addressForm });
      setAddressId(String(created.id));
      setShowAddress(false);
      load();
    } catch (err) { setError(err.message); }
  };
  const placeOrder = async () => {
    if (!addressId) return setError('Select or create a delivery address.');
    setBusy(true); setError('');
    try {
      const result = await apiRequest('/orders/checkout', { method: 'POST', body: { address_id: addressId, payment_method: paymentMethod, coupon_code: coupon || undefined, customer_note: note || undefined } });
      navigate(`/orders/${result.order.id}`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (!cart) return <Spinner />;
  return (
    <div className="container page">
      <span className="eyebrow">Checkout</span><h1>Complete your order</h1>
      {error && <div className="form-error">{error}</div>}
      <div className="checkout-layout">
        <div className="checkout-form">
          <section className="form-section"><h2>Delivery address</h2>{addresses.length ? <div className="address-list">{addresses.map((address) => <label className={String(address.id) === addressId ? 'address-card selected' : 'address-card'} key={address.id}><input type="radio" checked={String(address.id) === addressId} onChange={() => setAddressId(String(address.id))} /><div><strong>{address.label} · {address.recipient_name}</strong><p>{address.street_address}, {address.city}, {address.province}</p><span>{address.recipient_phone}</span></div></label>)}</div> : <p className="muted">No saved addresses.</p>}<button className="btn btn-secondary" onClick={() => setShowAddress(!showAddress)}>{showAddress ? 'Cancel' : 'Add address'}</button>{showAddress && <form className="address-form" onSubmit={createAddress}>{Object.entries({ recipient_name: 'Recipient name', recipient_phone: 'Phone', province: 'Province', city: 'City', district: 'District', street_address: 'Street address' }).map(([key, label]) => <label key={key}>{label}<input required={!['district'].includes(key)} value={addressForm[key]} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })} /></label>)}<button className="btn btn-primary">Save address</button></form>}</section>
          <section className="form-section"><h2>Payment method</h2><label className="address-card selected"><input type="radio" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} /><div><strong>Cash on delivery</strong><p>The backend will create a pending payment record.</p></div></label></section>
          <section className="form-section"><h2>Coupon and note</h2><div className="two-fields"><label>Coupon code<input value={coupon} onChange={(event) => setCoupon(event.target.value)} /></label><label>Customer note<input value={note} onChange={(event) => setNote(event.target.value)} /></label></div></section>
        </div>
        <aside className="order-summary"><h3>Order summary</h3>{cart.items.map((item) => <div key={item.id}><span>{item.name} × {item.quantity}</span><strong>{(Number(item.price) * item.quantity).toLocaleString()} AFN</strong></div>)}<hr /><div className="summary-total"><span>Subtotal</span><strong>{Number(cart.subtotal).toLocaleString()} AFN</strong></div><button className="btn btn-primary btn-full" disabled={busy} onClick={placeOrder}>{busy ? 'Placing order...' : 'Place order'}</button></aside>
      </div>
    </div>
  );
}
