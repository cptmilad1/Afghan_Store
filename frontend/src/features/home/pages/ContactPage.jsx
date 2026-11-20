import { useLocale } from '../../../app/providers/LocaleProvider';
import { CONTACT_PHONE } from '../../../app/config/contact';
export default function ContactPage() {
  const { locale } = useLocale();
  const labels = { prs: ['تماس با ما', 'شماره تماس'], ps: ['اړیکه', 'د اړیکې شمېره'], en: ['Contact us', 'Contact phone'] };
  return <div className="container page about-page"><span className="eyebrow">Afghan Connect</span><h1>{labels[locale][0]}</h1><p>{labels[locale][1]}: <strong>{CONTACT_PHONE || ({ prs: 'شماره تماس به‌زودی اضافه می‌شود.', ps: 'د اړیکې شمېره به ژر زیاته شي.', en: 'Contact phone number will be added soon.' }[locale])}</strong></p></div>;
}
