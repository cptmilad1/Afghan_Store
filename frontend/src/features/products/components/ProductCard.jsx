import { Link } from 'react-router';
import { imageUrl } from '../../../services/api/client';
import { Icon } from '../../../shared/components/Icon';

export default function ProductCard({ product, onWishlist }) {
  const primary = product.images?.find((image) => image.is_primary) || product.images?.[0];
  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product.id}`}>
        {primary?.image_url
          ? <img src={imageUrl(primary.image_url)} alt={primary.alt_text || product.name} />
          : <div className="image-placeholder"><Icon name="grid" size={28} /></div>}
        {product.condition_status && product.condition_status !== 'new' && <span className="badge badge-warning">{product.condition_status}</span>}
      </Link>
      {onWishlist && <button className="card-favorite" onClick={() => onWishlist(product)} title="Save to wishlist"><Icon name="heart" size={18} /></button>}
      <div className="product-card-body">
        <Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link>
        <p className="store-name">{product.store_name}</p>
        <div className="product-card-footer"><strong>{Number(product.price).toLocaleString()} AFN</strong>{product.stock_quantity > 0 ? <span className="stock">In stock</span> : <span className="stock out">Out of stock</span>}</div>
      </div>
    </article>
  );
}
