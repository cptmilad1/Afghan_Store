import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { apiRequest, imageUrl } from '../../../services/api/client';
import { useAuth } from '../../../app/providers/authContext';
import { Spinner, ErrorState } from '../../../shared/components/Feedback';
import { Icon } from '../../../shared/components/Icon';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([catalogApi.service(id), apiRequest(`/reviews/services/${id}`)])
      .then(([serviceData, reviewData]) => { setService(serviceData); setReviews(reviewData || []); })
      .catch((err) => setError(err.message));
  }, [id]);

  const requestService = async () => {
    if (!user) return setMessage('Sign in to request this service.');
    try {
      await apiRequest('/cart/items', { method: 'POST', body: { service_id: id, quantity: 1 } });
      setMessage('Added to cart. You can choose a service time during checkout.');
    } catch (err) { setMessage(err.message); }
  };

  if (error) return <ErrorState message={error} />;
  if (!service) return <Spinner />;
  const image = service.images?.find((item) => item.is_primary) || service.images?.[0];
  return (
    <div className="container page">
      <div className="breadcrumbs"><Link to="/services">Services</Link><span>/</span><span>{service.name}</span></div>
      <div className="detail-layout">
        <div className="detail-gallery">{image?.image_url ? <img src={imageUrl(image.image_url)} alt={service.name} /> : <div className="image-placeholder large"><Icon name="grid" size={48} /></div>}</div>
        <div className="detail-info"><span className="badge badge-neutral">{service.pricing_type} price</span><h1>{service.name}</h1><p className="detail-store">{service.store_name}</p><div className="detail-price">{Number(service.price).toLocaleString()} <span>AFN</span></div><p className="detail-description">{service.description}</p>{service.availability_notes && <p><strong>Availability:</strong> {service.availability_notes}</p>}<button className="btn btn-primary" onClick={requestService}>Request this service</button>{message && <p className="inline-message">{message}</p>}</div>
      </div>
      <section className="reviews-section"><h2>Customer reviews</h2>{reviews.length ? reviews.map((review) => <div className="review" key={review.id}><strong>{review.full_name}</strong><div className="rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p>{review.review_text || 'No written comment.'}</p></div>) : <p className="muted">No published reviews yet.</p>}</section>
    </div>
  );
}
