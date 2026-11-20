import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api/client';
import { EmptyState, Spinner } from '../../../shared/components/Feedback';

export default function ComparisonsPage() {
  const [comparisons, setComparisons] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const load = () => apiRequest('/comparisons').then(setComparisons).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try { await apiRequest('/comparisons', { method: 'POST', body: { comparison_name: `Comparison ${comparisons.length + 1}` } }); load(); }
    catch (err) { setError(err.message); }
  };
  const open = async (comparison) => {
    try { setSelected(await apiRequest(`/comparisons/${comparison.id}`)); }
    catch (err) { setError(err.message); }
  };
  const removeProduct = async (comparisonId, productId) => {
    try { await apiRequest(`/comparisons/${comparisonId}/items/${productId}`, { method: 'DELETE' }); await open({ id: comparisonId }); }
    catch (err) { setError(err.message); }
  };
  const removeComparison = async (comparisonId) => {
    try { await apiRequest(`/comparisons/${comparisonId}`, { method: 'DELETE' }); setSelected(null); load(); }
    catch (err) { setError(err.message); }
  };
  if (!comparisons) return <Spinner />;
  return <div className="container page"><div className="page-heading-row"><div><span className="eyebrow">Compare products</span><h1>Comparisons</h1></div><button className="btn btn-primary" onClick={create}>New comparison</button></div>{error && <div className="form-error">{error}</div>}{selected ? <section className="form-section"><div className="page-heading-row"><h2>{selected.comparison_name}</h2><button className="text-button danger" onClick={() => removeComparison(selected.id)}>Delete comparison</button></div>{selected.products?.length ? <div className="compare-grid">{selected.products.map((product) => <article key={product.id}><strong>{product.name}</strong><span>{Number(product.price).toLocaleString()} AFN</span><span>{product.condition_status}</span><span>{product.stock_quantity} in stock</span><button className="text-button danger" onClick={() => removeProduct(selected.id, product.id)}>Remove</button></article>)}</div> : <EmptyState title="No products in this comparison" description="Add products from their detail pages." />}</section> : comparisons.length ? <div className="table-list">{comparisons.map((comparison) => <button className="comparison-row" key={comparison.id} onClick={() => open(comparison)}><strong>{comparison.comparison_name}</strong><span>{comparison.item_count} products</span><span>Open comparison</span></button>)}</div> : <EmptyState title="No comparisons yet" description="Create a comparison, then add products from their detail pages." />}</div>;
}
