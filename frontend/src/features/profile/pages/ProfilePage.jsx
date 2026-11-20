import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { authApi } from '../../../services/endpoints/auth';
import { apiRequest } from '../../../services/api/client';
import { useAuth } from '../../../app/providers/authContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [password, setPassword] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ label: 'Home', recipient_name: '', recipient_phone: '', province: '', city: '', district: '', street_address: '', additional_directions: '', is_default: false });

  useEffect(() => {
    authApi.me().then(setProfile).catch(() => {});
    apiRequest('/addresses').then(setAddresses).catch(() => {});
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    try { const updated = await authApi.updateMe({ full_name: profile.full_name, preferred_language: profile.preferred_language }); setProfile(updated); setUser({ ...updated, role_name: user.role_name }); setMessage('Profile updated.'); } catch (err) { setMessage(err.message); }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    try { await authApi.changePassword(password); setPassword({ old_password: '', new_password: '' }); setMessage('Password changed.'); } catch (err) { setMessage(err.message); }
  };
  const addAddress = async (event) => {
    event.preventDefault();
    try { const address = await apiRequest('/addresses', { method: 'POST', body: addressForm }); setAddresses((items) => [address, ...items]); setMessage('Address saved.'); }
    catch (err) { setMessage(err.message); }
  };
  const removeAddress = async (address) => {
    if (!window.confirm('Delete this saved address?')) return;
    try { await apiRequest(`/addresses/${address.id}`, { method: 'DELETE' }); setAddresses((items) => items.filter((item) => item.id !== address.id)); }
    catch (err) { setMessage(err.message); }
  };

  return (
    <div className="container page profile-page">
      <span className="eyebrow">Your account</span><h1>Profile</h1>
      {message && <div className="inline-message">{message}</div>}
      <div className="profile-layout">
        <aside className="profile-menu"><Link to="/orders">My orders</Link><Link to="/cart">My cart</Link><Link to="/wishlist">Wishlist</Link><Link to="/comparisons">Comparisons</Link><Link to="/notifications">Notifications</Link><Link to="/chat">Messages</Link></aside>
        <div className="profile-content">
          <section className="form-section"><h2>Account details</h2><form className="profile-form" onSubmit={saveProfile}><label>Full name<input value={profile.full_name || ''} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label><label>Preferred language<select value={profile.preferred_language || 'prs'} onChange={(event) => setProfile({ ...profile, preferred_language: event.target.value })}><option value="prs">Dari</option><option value="ps">Pashto</option><option value="en">English</option></select></label><button className="btn btn-primary">Save changes</button></form></section>
          <section className="form-section"><h2>Change password</h2><form className="profile-form" onSubmit={changePassword}><label>Current password<input type="password" value={password.old_password} onChange={(event) => setPassword({ ...password, old_password: event.target.value })} /></label><label>New password<input type="password" minLength="8" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} /></label><button className="btn btn-secondary">Change password</button></form></section>
          <section className="form-section"><h2>Saved addresses</h2>{addresses.length ? addresses.map((address) => <div className="saved-address" key={address.id}><strong>{address.label} · {address.recipient_name}</strong><p>{address.street_address}, {address.city}, {address.province}</p><button className="text-button danger" onClick={() => removeAddress(address)}>Delete</button></div>) : <p className="muted">No saved addresses.</p>}<form className="address-form" onSubmit={addAddress}><label>Label<input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} /></label>{[['recipient_name','Recipient name'],['recipient_phone','Phone'],['province','Province'],['city','City'],['district','District'],['street_address','Street address']].map(([key,label]) => <label key={key}>{label}<input required={!['district'].includes(key)} value={addressForm[key]} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })} /></label>)}<button className="btn btn-secondary">Add address</button></form></section>
        </div>
      </div>
    </div>
  );
}
