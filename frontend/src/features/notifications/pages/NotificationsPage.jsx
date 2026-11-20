import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { Spinner, EmptyState } from '../../../shared/components/Feedback';

export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const load = () => apiRequest('/notifications').then(setItems);
  useEffect(load, []);
  const markAll = async () => { await apiRequest('/notifications/read-all', { method: 'PATCH' }); load(); };
  if (!items) return <Spinner />;
  return (
    <div className="container page"><div className="page-heading-row"><div><span className="eyebrow">Updates</span><h1>Notifications</h1></div>{items.length > 0 && <button className="btn btn-secondary" onClick={markAll}>Mark all read</button>}</div>{items.length ? <div className="notification-list">{items.map((item) => <button className={item.is_read ? 'notification read' : 'notification'} key={item.id} onClick={async () => { await apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' }); load(); }}><span className="notification-dot" /><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString()}</small></div></button>)}</div> : <EmptyState title="No notifications" description="Order and account updates will appear here." />}</div>
  );
}
