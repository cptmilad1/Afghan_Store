import { useLocale } from '../../../app/providers/LocaleProvider';
export default function AboutPage() {
  const { locale } = useLocale();
  const content = {
    prs: { title: 'درباره افغان کانکت', body: 'افغان کانکت یک بازار آنلاین چندمنظوره برای افغانستان است که مردم را به هم وصل می‌کند تا محصولات نو و دست‌دوم خود را خریدوفروش کنند و خدمات محلی و تخصصی را پیدا یا معرفی کنند. هدف ما آسان‌ترساختن دسترسی به کالاها و خدمات، ایجاد ارتباط مستقیم و پشتیبانی از زبان‌های دری، پشتو و انگلیسی است.' },
    ps: { title: 'د افغان کنېکټ په اړه', body: 'افغان کنېکټ د افغانستان لپاره یو څو موخیز انلاین بازار دی چې خلک سره نښلوي، څو نوي او کارول شوي توکي واخلي او وپلوري او سیمه‌ییز او مسلکي خدمتونه ومومي یا یې معرفي کړي. موخه یې توکو او خدمتونو ته اسانه لاسرسی، مستقیمه اړیکه او د دري، پښتو او انګلیسي ژبو ملاتړ دی.' },
    en: { title: 'About Afghan Connect', body: 'Afghan Connect is a multi-purpose marketplace for Afghanistan. It connects people to buy and sell new and used products and to discover or offer local and professional services. Its goal is to make goods and services easier to access, enable direct connections, and support Dari, Pashto, and English.' }
  };
  return <div className="container page about-page"><span className="eyebrow">Afghan Connect</span><h1>{content[locale].title}</h1><p>{content[locale].body}</p></div>;
}
