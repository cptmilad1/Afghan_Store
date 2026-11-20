import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../app/providers/authContext';
import { useLocale } from '../app/providers/LocaleProvider';
import { Icon } from '../shared/components/Icon';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const [theme, setTheme] = useState(localStorage.getItem('afghan_connect_theme') || 'light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('afghan_connect_theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link className="brand" to="/" aria-label="Afghan Connect home" onClick={closeMenu}>
            <span className="brand-mark">A</span><span>Afghan <strong>Connect</strong></span>
          </Link>
          <nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
            <NavLink to="/" onClick={closeMenu}>{t('home')}</NavLink>
            <NavLink to="/marketplace" onClick={closeMenu}>{t('products')}</NavLink>
            <NavLink to="/services" onClick={closeMenu}>{t('services')}</NavLink>
            <NavLink to="/categories" onClick={closeMenu}>{t('categories')}</NavLink>
            <NavLink to="/about" onClick={closeMenu}>{t('about')}</NavLink>
            {user?.role_name === 'seller' && <NavLink to="/seller" onClick={closeMenu}>{t('sellerHub')}</NavLink>}
            {user?.role_name === 'courier' && <NavLink to="/courier" onClick={closeMenu}>{t('courier')}</NavLink>}
            {user?.role_name === 'admin' && <NavLink to="/admin" onClick={closeMenu}>{t('admin')}</NavLink>}
          </nav>
          <div className="topbar-actions">
            <label className="sr-only" htmlFor="language-select">{t('language')}</label>
            <select id="language-select" className="language-select" value={locale} onChange={(e) => setLocale(e.target.value)} aria-label={t('language')}>
              <option value="prs">دری</option><option value="ps">پښتو</option><option value="en">English</option>
            </select>
            <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={t('theme')} aria-label={t('theme')}>
              {theme === 'dark' ? '☀' : '◐'}
            </button>
            {user ? <>
              <Link className="icon-button" to="/notifications" title={t('notifications')} aria-label={t('notifications')}><Icon name="bell" /></Link>
              <Link className="icon-button" to="/profile" title={t('profile')} aria-label={t('profile')}><Icon name="user" /></Link>
              {user.role_name === 'customer' && <Link className="icon-button" to="/cart" title={t('cart')} aria-label={t('cart')}><Icon name="bag" /></Link>}
              <button className="btn btn-ghost" onClick={() => { logout(); closeMenu(); }}>{t('logout')}</button>
            </> : <>
              <Link className="btn btn-ghost" to="/login">{t('signIn')}</Link>
              <Link className="btn btn-primary" to="/register">{t('register')}</Link>
            </>}
            <button className="icon-button mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
          </div>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="footer">
        <div className="container footer-grid">
          <div><div className="brand footer-brand"><span className="brand-mark">A</span><span>Afghan <strong>Connect</strong></span></div><p>{t('footer')}</p></div>
          <div><strong>{t('products')}</strong><Link to="/marketplace">{t('marketplace')}</Link><Link to="/services">{t('services')}</Link><Link to="/categories">{t('categories')}</Link><Link to="/about">{t('about')}</Link><Link to="/contact">{t('contact')}</Link></div>
          <div><strong>{t('account')}</strong>{user ? <Link to="/profile">{t('profile')}</Link> : <Link to="/login">{t('signIn')}</Link>}<Link to="/orders">{'سفارش‌ها / Orders'}</Link><Link to="/seller">{t('becomeSeller')}</Link><Link to="/courier">{t('courier')}</Link></div>
        </div>
        <div className="container footer-bottom">© {new Date().getFullYear()} Afghan Connect</div>
      </footer>
    </div>
  );
}
