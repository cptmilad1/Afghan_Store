import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner, EmptyState } from '../../../shared/components/Feedback';
import { useAuth } from '../../../app/providers/authContext';

export default function CourierPage() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [available, setAvailable] = useState([]);
  const [form, setForm] = useState({ vehicle_type: '', vehicle_identifier: '', service_area: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const current = await apiRequest('/courier-profiles/me');
      setProfile(current);
      if (current) {
        if (current.availability_status === 'available' || current.availability_status === 'busy') {
          localStorage.setItem('afghan_connect_role', 'courier');
          setUser((user) => ({ ...user, role_name: 'courier' }));
        }
        const assigned = await apiRequest('/deliveries/mine');
        setDeliveries(assigned || []);
        if (current.availability_status === 'available') setAvailable(await apiRequest('/deliveries/available'));
      }
    } catch (err) {
      setMessage(err.message);
    } finally { setLoading(false); }
  }, [setUser]);
  useEffect(() => {
    async function fetchData() { await load(); }
    fetchData();
  }, [load]);

  const apply = async (event) => {
    event.preventDefault();
    try { setProfile(await apiRequest('/courier-profiles/apply', { method: 'POST', body: form })); setMessage('Courier application sent. Admin activation is required.'); }
    catch (err) { setMessage(err.message); }
  };
  const claim = async (delivery) => {
    try { await apiRequest(`/deliveries/${delivery.id}/claim`, { method: 'PATCH' }); await load(); }
    catch (err) { setMessage(err.message); }
  };
  const changeStatus = async (delivery, delivery_status) => {
    try { await apiRequest(`/deliveries/${delivery.id}/status`, { method: 'PATCH', body: { delivery_status } }); await load(); }
    catch (err) { setMessage(err.message); }
  };

  if (loading) return <Spinner label="Loading courier workspace..." />;
  if (!profile) return <div className="container page"><span className="eyebrow">Courier onboarding</span><h1>Become a courier</h1>{message && <div className="inline-message">{message}</div>}<form className="profile-form form-section" onSubmit={apply}><label>Vehicle type<input value={form.vehicle_type} onChange={(event) => setForm({ ...form, vehicle_type: event.target.value })} /></label><label>Vehicle identifier<input value={form.vehicle_identifier} onChange={(event) => setForm({ ...form, vehicle_identifier: event.target.value })} /></label><label className="wide-field">Service area<input value={form.service_area} onChange={(event) => setForm({ ...form, service_area: event.target.value })} /></label><button className="btn btn-primary">Submit courier application</button></form></div>;

  return (
    <div className="container page"><div className="page-heading-row"><div><span className="eyebrow">Courier workspace</span><h1>Delivery dashboard</h1></div><span className="status-pill">{profile.availability_status}</span></div>{message && <div className="inline-message">{message}</div>}<h2>Available deliveries</h2>{available.length ? <div className="order-list">{available.map((delivery) => <article className="order-card delivery-card" key={delivery.id}><div><span>Order</span><strong>{delivery.order_number}</strong></div><div><span>Recipient</span><strong>{delivery.recipient_name_snapshot}</strong></div><div><span>Address</span><strong>{delivery.delivery_address_snapshot}</strong></div><button className="btn btn-primary" onClick={() => claim(delivery)}>Claim</button></article>)}</div> : <EmptyState title="No deliveries available" description="Deliveries appear when sellers mark orders ready." />}<h2 className="subheading">My deliveries</h2>{deliveries.length ? <div className="order-list">{deliveries.map((delivery) => <article className="order-card delivery-card" key={delivery.id}><div><span>Order</span><strong>{delivery.order_number}</strong></div><div><span>Status</span><strong>{delivery.delivery_status}</strong></div><div><span>Destination</span><strong>{delivery.delivery_address_snapshot}</strong></div><div className="delivery-actions">{delivery.delivery_status === 'accepted' && <button className="btn btn-secondary" onClick={() => changeStatus(delivery, 'picked_up')}>Picked up</button>}{delivery.delivery_status === 'picked_up' && <button className="btn btn-secondary" onClick={() => changeStatus(delivery, 'in_transit')}>In transit</button>}{delivery.delivery_status === 'in_transit' && <button className="btn btn-primary" onClick={() => changeStatus(delivery, 'delivered')}>Delivered</button>}</div></article>)}</div> : <p className="muted">No assigned deliveries.</p>}</div>
  );
}
