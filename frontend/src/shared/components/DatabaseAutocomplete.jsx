import { useEffect, useRef, useState } from 'react';
import { catalogApi } from '../../services/endpoints/catalog';
import { apiRequest } from '../../services/api/client';

/** Search suggestions are fetched from the real public catalog API; no mock options are used. */
export default function DatabaseAutocomplete({ kind = 'products', value, onChange, onSelect, placeholder, ariaLabel }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) { setItems([]); setOpen(false); return undefined; }
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { search: query, limit: 6 };
        const result = kind === 'cities' ? await apiRequest(`/suggestions/cities?${new URLSearchParams({ search: query })}`) : kind === 'services' ? await catalogApi.services(params) : await catalogApi.products(params);
        if (alive) { setItems((result.items || []).map((item) => kind === 'cities' ? ({ ...item, name: item.value, id: item.value }) : item)); setOpen((result.items || []).length > 0); setActive(-1); }
      } catch {
        if (alive) { setItems([]); setOpen(false); }
      } finally { if (alive) setLoading(false); }
    }, 280);
    return () => { alive = false; clearTimeout(timer); };
  }, [kind, value]);

  useEffect(() => {
    const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (item) => {
    onChange(item.name || item.value || '');
    onSelect?.(item);
    setOpen(false);
  };
  const keyDown = (event) => {
    if (event.key === 'ArrowDown' && items.length) { event.preventDefault(); setOpen(true); setActive((n) => (n + 1) % items.length); }
    if (event.key === 'ArrowUp' && items.length) { event.preventDefault(); setActive((n) => (n <= 0 ? items.length - 1 : n - 1)); }
    if (event.key === 'Enter' && open && active >= 0) { event.preventDefault(); choose(items[active]); }
    if (event.key === 'Escape') setOpen(false);
  };

  return <div className="database-autocomplete" ref={root}>
    <input value={value} onChange={(event) => { onChange(event.target.value); setOpen(true); }} onFocus={() => items.length && setOpen(true)} onKeyDown={keyDown} placeholder={placeholder} aria-label={ariaLabel || placeholder} aria-autocomplete="list" aria-expanded={open} />
    {loading && <span className="autocomplete-loading" aria-hidden="true">…</span>}
    {open && items.length > 0 && <div className="autocomplete-options" role="listbox">
      {items.map((item, index) => <button type="button" role="option" aria-selected={active === index} className={active === index ? 'autocomplete-option active' : 'autocomplete-option'} key={item.id} onMouseEnter={() => setActive(index)} onClick={() => choose(item)}>
        <span>{item.name}</span><small>{kind === 'cities' ? '' : (item.store_name || item.city || item.condition_status || '')}</small>
      </button>)}
    </div>}
  </div>;
}
