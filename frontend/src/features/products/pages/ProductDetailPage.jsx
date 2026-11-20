import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { catalogApi } from '../../../services/endpoints/catalog';
import { apiRequest, imageUrl } from '../../../services/api/client';
import { useAuth } from '../../../app/providers/authContext';
import { Spinner, ErrorState } from '../../../shared/components/Feedback';
import { Icon } from '../../../shared/components/Icon';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([catalogApi.product(id), apiRequest(`/reviews/products/${id}`)])
      .then(([productData, reviewData]) => { setProduct(productData); setReviews(reviewData || []); })
      .catch((err) => setError(err.message));
  }, [id]);

  const addToCart = async () => {
    if (!user) return setMessage('Sign in to add this product to your cart.');
    try {
      await apiRequest('/cart/items', { method: 'POST', body: { product_id: id, quantity } });
      setMessage('Added to cart.');
    } catch (err) { setMessage(err.message); }
  };
  const addToComparison = async () => {
    if (!user) return setMessage('Sign in to compare products.');
    try {
      const comparisons = await apiRequest('/comparisons');
      const comparison = comparisons?.[0] || await apiRequest('/comparisons', { method: 'POST', body: { comparison_name: 'My comparison' } });
      await apiRequest(`/comparisons/${comparison.id}/items`, { method: 'POST', body: { product_id: id } });
      setMessage('Added to comparison.');
    } catch (err) { setMessage(err.message); }
  };

  if (error) return <ErrorState message={error} />;
  if (!product) return <Spinner />;
  const primary = product.images?.find((image) => image.is_primary) || product.images?.[0];
  return (
    <div className="container page">
      <div className="breadcrumbs"><Link to="/marketplace">Marketplace</Link><span>/</span><span>{product.name}</span></div>
      <div className="detail-layout">
        <div className="detail-gallery">{primary?.image_url ? <img src={imageUrl(primary.image_url)} alt={product.name} /> : <div className="image-placeholder large"><Icon name="grid" size={48} /></div>}</div>
        <div className="detail-info">
          <span className="badge badge-neutral">{product.condition_status}</span>
          <h1>{product.name}</h1>
          <p className="detail-store">{product.store_name}</p>
          <div className="detail-price">{Number(product.price).toLocaleString()} <span>AFN</span></div>
          {product.compare_at_price && <div className="compare-price">{Number(product.compare_at_price).toLocaleString()} AFN</div>}
          <p className="detail-description">{product.description}</p>
          <div className="stock-row"><span className={product.stock_quantity > 0 ? 'dot in' : 'dot'} />{product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}</div>
          {product.stock_quantity > 0 && <div className="purchase-row"><label>Quantity <input type="number" min="1" max={product.stock_quantity} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><button className="btn btn-primary" onClick={addToCart}>Add to cart</button></div>}
          {user?.role_name === 'customer' && <button className="btn btn-secondary compare-button" onClick={addToComparison}>Add to comparison</button>}
          {message && <p className="inline-message">{message}</p>}
        </div>
      </div>
      <section className="reviews-section"><h2>Customer reviews</h2>{reviews.length ? reviews.map((review) => <div className="review" key={review.id}><strong>{review.full_name}</strong><div className="rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div><p>{review.review_text || 'No written comment.'}</p>{review.seller_reply && <div className="seller-reply"><strong>Seller reply</strong><p>{review.seller_reply}</p></div>}</div>) : <p className="muted">No published reviews yet.</p>}</section>
    </div>
  );
}
