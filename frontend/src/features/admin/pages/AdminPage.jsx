import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', minimum_order_amount: '0', per_customer_limit: '1', starts_at: '', expires_at: '' });
  const [selectedPayments, setSelectedPayments] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name_prs: '', name_en: '', name_ps: '', slug: '', category_type: 'both' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest('/users'),
      apiRequest('/products/admin/all'),
      apiRequest('/services/admin/all'),
      apiRequest('/orders/admin/all'),
      apiRequest('/seller-profiles/applications'),
      apiRequest('/courier-profiles'),
      apiRequest('/categories?limit=100'),
      apiRequest('/coupons'),
    ]).then(([u,p,s,o,a,c,cat,cp]) => { setUsers(u || []); setProducts(p || []); setServices(s || []); setOrders(o || []); setApplications(a || []); setCouriers(c || []); setCategories(cat.items || []); setCoupons(cp || []); }).catch((err) => setMessage(err.message));
  }, []);

  const approveSeller = async (application, approval_status) => {
    try { await apiRequest(`/seller-profiles/${application.id}/decision`, { method: 'PATCH', body: { approval_status } }); setApplications((items) => items.map((item) => item.id === application.id ? { ...item, approval_status } : item)); } catch (err) { setMessage(err.message); }
  };
  const approveListing = async (kind, item, listing_status) => {
    try { await apiRequest(`/${kind}/${item.id}/approve`, { method: 'PATCH', body: { listing_status } }); const setter = kind === 'products' ? setProducts : setServices; setter((items) => items.map((current) => current.id === item.id ? { ...current, listing_status } : current)); } catch (err) { setMessage(err.message); }
  };
  const activateCourier = async (courier) => {
    try { const updated = await apiRequest(`/courier-profiles/${courier.id}/activate`, { method: 'PATCH' }); setCouriers((items) => items.map((item) => item.id === courier.id ? { ...item, ...updated } : item)); }
    catch (err) { setMessage(err.message); }
  };
  const updateUser = async (user, fields) => {
    try {
      if (fields.account_status) await apiRequest(`/users/${user.id}/status`, { method: 'PATCH', body: { account_status: fields.account_status } });
      if (fields.role_name) await apiRequest(`/users/${user.id}/role`, { method: 'PATCH', body: { role_name: fields.role_name } });
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, ...fields } : item));
    } catch (err) { setMessage(err.message); }
  };
  const createCategory = async (event) => {
    event.preventDefault();
    try {
      const created = await apiRequest('/categories', { method: 'POST', body: categoryForm });
      setCategories((items) => [...items, created]);
      setCategoryForm({ name_prs: '', name_en: '', name_ps: '', slug: '', category_type: 'both' });
      setMessage('Category created.');
    } catch (err) { setMessage(err.message); }
  };
  const deactivateCategory = async (category) => {
    if (!window.confirm(`Deactivate ${category.name_en}?`)) return;
    try { await apiRequest(`/categories/${category.id}`, { method: 'DELETE' }); setCategories((items) => items.filter((item) => item.id !== category.id)); }
    catch (err) { setMessage(err.message); }
  };
  const showPayments = async (order) => {
    try {
      setSelectedPayments(await apiRequest(`/payments/orders/${order.id}`));
      setSelectedOrderId(order.id);
    } catch (err) { setMessage(err.message); }
  };
  const updatePayment = async (payment, transaction_status) => {
    if (transaction_status === 'successful' && !window.confirm('Confirm that this payment has been externally verified before marking it successful?')) return;
    try {
      await apiRequest(`/payments/${payment.id}/status`, { method: 'PATCH', body: { transaction_status } });
      setSelectedPayments((items) => items.map((item) => item.id === payment.id ? { ...item, transaction_status } : item));
    } catch (err) { setMessage(err.message); }
  };


  const createCoupon = async (event) => {
    event.preventDefault();
    try {
      const created = await apiRequest('/coupons', { method: 'POST', body: {
        ...couponForm,
        discount_value: Number(couponForm.discount_value),
        minimum_order_amount: Number(couponForm.minimum_order_amount),
        per_customer_limit: Number(couponForm.per_customer_limit),
        starts_at: new Date(couponForm.starts_at).toISOString(),
        expires_at: new Date(couponForm.expires_at).toISOString(),
      }});
      setCoupons((items) => [created, ...items]);
      setMessage('Coupon created.');
      setCouponForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', minimum_order_amount: '0', per_customer_limit: '1', starts_at: '', expires_at: '' });
    } catch (err) { setMessage(err.message); }
  };
  const toggleCoupon = async (coupon) => {
    try {
      const updated = await apiRequest(`/coupons/${coupon.id}`, { method: 'PATCH', body: { is_active: !coupon.is_active } });
      setCoupons((items) => items.map((item) => item.id === coupon.id ? updated : item));
    } catch (err) { setMessage(err.message); }
  };
  return (
    <div className="container page"><span className="eyebrow">Administration</span><h1>Admin dashboard</h1>{message && <div className="form-error">{message}</div>}<div className="dashboard-tabs">{['users','sellers','couriers','categories','products','services','orders','coupons'].map((value) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value}</button>)}</div>{tab === 'users' && <div className="table-list admin-users">{users.map((user) => <div key={user.id}><strong>{user.full_name}</strong><select value={user.role_name} onChange={(event) => updateUser(user, { role_name: event.target.value })}><option value="customer">Customer</option><option value="seller">Seller</option><option value="courier">Courier</option><option value="admin">Admin</option></select><select value={user.account_status} onChange={(event) => updateUser(user, { account_status: event.target.value })}><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option></select></div>)}</div>}{tab === 'sellers' && <div className="table-list admin-applications">{applications.map((application) => <div key={application.id}><strong>{application.store_name}</strong><span>{application.approval_status}</span><div>{application.approval_status === 'pending' && <><button className="btn btn-primary" onClick={() => approveSeller(application, 'approved')}>Approve</button><button className="btn btn-secondary" onClick={() => approveSeller(application, 'rejected')}>Reject</button></>}</div></div>)}</div>}{tab === 'couriers' && <div className="table-list admin-applications">{couriers.map((courier) => <div key={courier.id}><strong>{courier.full_name}</strong><span>{courier.availability_status}</span><div>{courier.availability_status === 'offline' && <button className="btn btn-primary" onClick={() => activateCourier(courier)}>Activate</button>}</div></div>)}</div>}{tab === 'categories' && <><form className="category-admin-form" onSubmit={createCategory}>{[['name_prs','Dari name'],['name_en','English name'],['name_ps','Pashto name'],['slug','Slug']].map(([key,label]) => <label key={key}>{label}<input required value={categoryForm[key]} onChange={(event) => setCategoryForm({ ...categoryForm, [key]: event.target.value })} /></label>)}<label>Type<select value={categoryForm.category_type} onChange={(event) => setCategoryForm({ ...categoryForm, category_type: event.target.value })}><option value="product">Product</option><option value="service">Service</option><option value="both">Both</option></select></label><button className="btn btn-primary">Create category</button></form><div className="table-list">{categories.map((category) => <div key={category.id}><strong>{category.name_en}</strong><span>{category.category_type}</span><button className="text-button danger" onClick={() => deactivateCategory(category)}>Deactivate</button></div>)}</div></>}{tab === 'products' && <div className="table-list admin-applications">{products.map((item) => <div key={item.id}><strong>{item.name}</strong><span>{item.listing_status}</span>{item.listing_status === 'pending' && <div><button className="btn btn-primary" onClick={() => approveListing('products', item, 'active')}>Approve</button><button className="btn btn-secondary" onClick={() => approveListing('products', item, 'rejected')}>Reject</button></div>}</div>)}</div>}{tab === 'services' && <div className="table-list admin-applications">{services.map((item) => <div key={item.id}><strong>{item.name}</strong><span>{item.listing_status}</span>{item.listing_status === 'pending' && <div><button className="btn btn-primary" onClick={() => approveListing('services', item, 'active')}>Approve</button><button className="btn btn-secondary" onClick={() => approveListing('services', item, 'rejected')}>Reject</button></div>}</div>)}</div>}{tab === 'orders' && <><div className="table-list">{orders.map((order) => <div key={order.id}><strong>{order.order_number}</strong><span>{order.order_status}</span><strong>{Number(order.total_amount).toLocaleString()} AFN</strong><button className="btn btn-secondary" onClick={() => showPayments(order)}>Payments</button></div>)}</div>{selectedPayments && <div className="form-section payment-admin"><h2>Payment transactions for order {selectedOrderId}</h2>{selectedPayments.map((payment) => <div className="payment-line" key={payment.id}><span>{payment.payment_method} · {Number(payment.amount).toLocaleString()} {payment.currency}</span><strong>{payment.transaction_status}</strong><div>{payment.transaction_status === 'pending' && <><button className="btn btn-primary" onClick={() => updatePayment(payment, 'successful')}>Verified successful</button><button className="btn btn-secondary" onClick={() => updatePayment(payment, 'failed')}>Failed</button></>}{payment.transaction_status === 'successful' && <button className="btn btn-secondary" onClick={() => updatePayment(payment, 'refunded')}>Refunded</button>}</div></div>)}</div>}</>}{tab === 'coupons' && <><form className="category-admin-form" onSubmit={createCoupon}>
      <label>Code<input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} /></label>
      <label>Description<input value={couponForm.description} onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })} /></label>
      <label>Discount type<select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
      <label>Discount value<input required type="number" min="0.01" step="0.01" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} /></label>
      <label>Minimum order amount<input type="number" min="0" value={couponForm.minimum_order_amount} onChange={(e) => setCouponForm({ ...couponForm, minimum_order_amount: e.target.value })} /></label>
      <label>Per customer limit<input type="number" min="1" value={couponForm.per_customer_limit} onChange={(e) => setCouponForm({ ...couponForm, per_customer_limit: e.target.value })} /></label>
      <label>Starts at<input required type="datetime-local" value={couponForm.starts_at} onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })} /></label>
      <label>Expires at<input required type="datetime-local" value={couponForm.expires_at} onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })} /></label>
      <button className="btn btn-primary">Create coupon</button>
    </form><div className="table-list">{coupons.map((coupon) => <div key={coupon.id}><strong>{coupon.code}</strong><span>{coupon.discount_type} · {coupon.discount_value} · {coupon.is_active ? 'Active' : 'Inactive'}</span><button className="btn btn-secondary" onClick={() => toggleCoupon(coupon)}>{coupon.is_active ? 'Deactivate' : 'Activate'}</button></div>)}</div></>}</div>
  );
}
