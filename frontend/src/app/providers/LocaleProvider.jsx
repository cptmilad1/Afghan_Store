import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../services/api/client';

const dictionaries = {
  prs: {
    home:'خانه', products:'محصولات', services:'خدمات', categories:'دسته‌بندی‌ها', about:'درباره ما', contact:'تماس با ما',
    marketplace:'بازار آنلاین', signIn:'ورود', register:'ثبت‌نام', logout:'خروج', account:'حساب کاربری', cart:'سبد خرید',
    wishlist:'علاقه‌مندی‌ها', notifications:'اعلان‌ها', profile:'پروفایل', sellerHub:'پنل فروشنده', courier:'پنل پیک',
    admin:'مدیریت', search:'جستجو', theme:'تغییر پوسته', language:'زبان', light:'روشن', dark:'تاریک',
    intro:'بازار آنلاین افغانستان برای خریدوفروش کالا و یافتن خدمات محلی.', explore:'کاوش بازار', becomeSeller:'فروشنده شوید',
    footer:'افغان کانکت؛ پیوند مردم با کالاها و خدمات در سراسر افغانستان.', noPhone:'شماره تماس به‌زودی اضافه می‌شود.',
    welcome:'به افغان کانکت خوش آمدید', accountText:'حساب خود را مدیریت کنید و در بازار آنلاین گشت‌وگذار کنید.',
    heroEyebrow:'بازار آنلاین افغانستان', heroTitle:'هرچه نیاز دارید پیدا کنید.', heroSubtitle:'محصولات و متخصصان محلی را از سراسر افغانستان پیدا کنید.',
    browse:'کاوش', popular:'دسته‌بندی‌های محبوب', latest:'تازه‌ترین محصولات', browseMarket:'دیدن بازار', servicesTitle:'خدمات محلی', searchProducts:'جستجوی محصولات یا خدمات', howWorks:'چگونه کار می‌کند؟',
  },
  ps: {
    home:'کور', products:'توکي', services:'خدمتونه', categories:'وېشنيزې', about:'زموږ په اړه', contact:'اړیکه',
    marketplace:'انلاین بازار', signIn:'ننوتل', register:'نوم‌لیکنه', logout:'وتل', account:'حساب', cart:'د پېرودلو ټوکرۍ',
    wishlist:'د خوښې لېست', notifications:'خبرتیاوې', profile:'پروفایل', sellerHub:'د پلورونکي برخه', courier:'د لېږد برخه',
    admin:'مدیریت', search:'لټون', theme:'بڼه بدلول', language:'ژبه', light:'روښانه', dark:'تیاره',
    intro:'د افغانستان انلاین بازار؛ د توکو پېر او پلور او د سیمه‌ییزو خدمتونو موندل.', explore:'بازار وپلټئ', becomeSeller:'پلورونکی شئ',
    footer:'افغان کنېکټ؛ په ټول افغانستان کې خلک له توکو او خدمتونو سره نښلوي.', noPhone:'د اړیکې شمېره به ژر زیاته شي.',
    welcome:'افغان کنېکټ ته ښه راغلاست', accountText:'خپل حساب اداره کړئ او انلاین بازار وپلټئ.',
    heroEyebrow:'د افغانستان انلاین بازار', heroTitle:'هر څه چې غواړئ ومومئ.', heroSubtitle:'د افغانستان له بېلابېلو سیمو څخه توکي او سیمه‌ییز مسلکي کسان ومومئ.',
    browse:'وپلټئ', popular:'مشهورې وېشنيزې', latest:'نوي توکي', browseMarket:'بازار وګورئ', servicesTitle:'سیمه‌ییز خدمتونه', searchProducts:'د توکو یا خدمتونو لټون', howWorks:'څنګه کار کوي؟',
  },
  en: {
    home:'Home', products:'Products', services:'Services', categories:'Categories', about:'About', contact:'Contact',
    marketplace:'Marketplace', signIn:'Sign in', register:'Create account', logout:'Log out', account:'Account', cart:'Cart',
    wishlist:'Wishlist', notifications:'Notifications', profile:'Profile', sellerHub:'Seller hub', courier:'Courier',
    admin:'Admin', search:'Search', theme:'Toggle theme', language:'Language', light:'Light', dark:'Dark',
    intro:'Afghanistan’s marketplace for buying and selling goods and finding local services.', explore:'Explore marketplace', becomeSeller:'Become a seller',
    footer:'Afghan Connect brings people together with products and services across Afghanistan.', noPhone:'Contact phone number will be added soon.',
    welcome:'Welcome to Afghan Connect', accountText:'Manage your account and explore the marketplace.',
    heroEyebrow:'Afghanistan’s online marketplace', heroTitle:'Find what you need.', heroSubtitle:'Discover products and local professionals from communities across Afghanistan.',
    browse:'Explore', popular:'Popular categories', latest:'Latest products', browseMarket:'Browse marketplace', servicesTitle:'Local services', searchProducts:'Search products or services', howWorks:'How it works',
  }
};

const LocaleContext = createContext(null);
export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => { const saved = localStorage.getItem('afghan_connect_language'); return ['prs', 'ps', 'en'].includes(saved) ? saved : 'prs'; });
  useEffect(() => {
    const rtl = locale !== 'en';
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    localStorage.setItem('afghan_connect_language', locale);
    if (localStorage.getItem('afghan_connect_token')) apiRequest('/users/me', { method: 'PATCH', body: { preferred_language: locale } }).catch(() => {});
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key) => dictionaries[locale]?.[key] ?? key }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};
