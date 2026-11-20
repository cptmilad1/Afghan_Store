import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';

export default function SellerListingForm({ type, categories, onDone, listing }) {
  const [form, setForm] = useState({
    category_id: listing?.category_id || '',
    name: listing?.name || '',
    slug: listing?.slug || '',
    description: listing?.description || '',
    price: listing?.price || '',
    stock_quantity: listing?.stock_quantity ?? '1',
    condition_status: listing?.condition_status || 'new',
    pricing_type: listing?.pricing_type || 'fixed',
    estimated_duration_minutes: listing?.estimated_duration_minutes || '',
    availability_notes: listing?.availability_notes || '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value, ...(name === 'name' && !current.slug ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) }));
  };
  const chooseImage = (event) => {
    if (preview) URL.revokeObjectURL(preview);
    const file = event.target.files?.[0] || null;
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (image && (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(image.type) || image.size > 5 * 1024 * 1024)) {
      setError('Choose a JPG, PNG, WEBP or GIF image up to 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const body = type === 'product'
        ? { category_id: form.category_id, name: form.name, slug: form.slug, description: form.description, price: Number(form.price), stock_quantity: Number(form.stock_quantity), condition_status: form.condition_status }
        : { category_id: form.category_id, name: form.name, slug: form.slug, description: form.description, price: Number(form.price), pricing_type: form.pricing_type, estimated_duration_minutes: form.estimated_duration_minutes ? Number(form.estimated_duration_minutes) : undefined, availability_notes: form.availability_notes || undefined };
      const path = `/${type === 'product' ? 'products' : 'services'}`;
      const savedListing = await apiRequest(listing ? `${path}/${listing.id}` : path, { method: listing ? 'PATCH' : 'POST', body });
      if (image) {
        const upload = new FormData();
        upload.append('image', image);
        const uploaded = await apiRequest('/uploads/image', { method: 'POST', body: upload });
        await apiRequest(`${path}/${savedListing.id}/images`, {
          method: 'POST',
          body: { image_url: uploaded.url, alt_text: form.name, is_primary: true },
        });
      }
      onDone(`${type === 'product' ? 'Product' : 'Service'} ${listing ? 'updated' : 'submitted for approval'}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-section listing-form" onSubmit={submit}>
      <h2>{listing ? 'Edit' : 'New'} {type}</h2>
      {error && <div className="form-error">{error}</div>}
      <div className="profile-form">
        <label>Category<select name="category_id" value={form.category_id} onChange={update} required><option value="">Select category</option>{categories.filter((category) => category.category_type === type || category.category_type === 'both').map((category) => <option value={category.id} key={category.id}>{category.name_en}</option>)}</select></label>
        <label>Name<input name="name" value={form.name} onChange={update} required /></label>
        <label>Slug<input name="slug" value={form.slug} onChange={update} required /></label>
        <label>Price (AFN)<input name="price" type="number" min="0" step="0.01" value={form.price} onChange={update} required /></label>
        {type === 'product' ? <>
          <label>Stock quantity<input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={update} /></label>
          <label>Condition<select name="condition_status" value={form.condition_status} onChange={update}><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></label>
        </> : <>
          <label>Pricing type<select name="pricing_type" value={form.pricing_type} onChange={update}><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="quote">Quote</option></select></label>
          <label>Estimated duration (minutes)<input name="estimated_duration_minutes" type="number" min="1" value={form.estimated_duration_minutes} onChange={update} /></label>
          <label>Availability notes<input name="availability_notes" value={form.availability_notes} onChange={update} /></label>
        </>}
        <label className="wide-field">Description<textarea name="description" value={form.description} onChange={update} required /></label>
        <label className="wide-field">Image (optional)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} />{preview && <img className="upload-preview" src={preview} alt="Selected listing preview" />}</label>
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Submitting...' : listing ? 'Save changes' : 'Submit for approval'}</button>
    </form>
  );
}
