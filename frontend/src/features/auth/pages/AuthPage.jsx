import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { authApi } from '../../../services/endpoints/auth';
import { useAuth } from '../../../app/providers/authContext';
import { useLocale } from '../../../app/providers/LocaleProvider';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { locale } = useLocale();
  const words = {
    prs: { welcome:'خوش آمدید', join:'به افغان کانکت بپیوندید', login:'ورود به حساب', signup:'ایجاد حساب کاربری', continue:'برای خرید یا مدیریت حساب ادامه دهید.', fullName:'نام کامل', email:'ایمیل', phone:'شماره تماس', password:'رمز عبور', language:'زبان ترجیحی', wait:'لطفاً صبر کنید...', signIn:'ورود', create:'ایجاد حساب', newUser:'تازه به افغان کانکت پیوسته‌اید؟', existing:'از قبل حساب دارید؟', emailPhone:'ایمیل یا شماره تماس', emailOrPhone:'(یا شماره تماس در پایین)', phoneOrEmail:'(یا ایمیل در بالا)' },
    ps: { welcome:'بېرته ښه راغلاست', join:'له افغان کنېکټ سره یوځای شئ', login:'خپل حساب ته ننوتل', signup:'خپل حساب جوړ کړئ', continue:'د پېرودلو یا حساب اداره کولو لپاره دوام ورکړئ.', fullName:'بشپړ نوم', email:'برېښنالیک', phone:'د اړیکې شمېره', password:'پټ نوم', language:'غوره ژبه', wait:'مهرباني وکړئ انتظار وکړئ...', signIn:'ننوتل', create:'حساب جوړول', newUser:'افغان کنېکټ ته نوي یاست؟', existing:'له مخکې حساب لرئ؟', emailPhone:'برېښنالیک یا د اړیکې شمېره', emailOrPhone:'(یا لاندې د اړیکې شمېره)', phoneOrEmail:'(یا پورته برېښنالیک)' },
    en: { welcome:'Welcome back', join:'Join Afghan Connect', login:'Sign in to your account', signup:'Create your account', continue:'Continue shopping or manage your account.', fullName:'Full name', email:'Email', phone:'Phone', password:'Password', language:'Preferred language', wait:'Please wait...', signIn:'Sign in', create:'Create account', newUser:'New to Afghan Connect?', existing:'Already have an account?', emailPhone:'Email or phone', emailOrPhone:'(or phone below)', phoneOrEmail:'(or email above)' }
  }[locale];
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', identifier: '', email: '', phone: '', password: '', preferred_language: 'prs' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isLogin && !form.email.trim() && !form.phone.trim()) {
      setError('Enter an email address or phone number.');
      return;
    }
    setBusy(true);
    try {
      const body = isLogin
        ? { identifier: form.identifier, password: form.password }
        : { full_name: form.full_name, password: form.password, preferred_language: form.preferred_language, ...(form.email ? { email: form.email } : { phone: form.phone }) };
      const result = isLogin ? await authApi.login(body) : await authApi.register(body);
      login(result);
      navigate('/');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/"><span className="brand-mark">A</span><span>Afghan <strong>Connect</strong></span></Link>
        <span className="eyebrow">{isLogin ? words.welcome : words.join}</span>
        <h1>{isLogin ? words.login : words.signup}</h1>
        <p className="auth-copy">{isLogin ? words.continue : (locale === 'prs' ? 'ثبت‌نام عمومی یک حساب مشتری ایجاد می‌کند.' : locale === 'ps' ? 'عامه نوم‌لیکنه د پېرودونکي حساب جوړوي.' : 'Public registration creates a customer account.')}</p>
        {error && <div className="form-error">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          {!isLogin && <label>{words.fullName}<input name="full_name" value={form.full_name} onChange={update} required minLength="2" /></label>}
          {isLogin && <label>{words.emailPhone}<input name="identifier" value={form.identifier} onChange={update} required /></label>}
          {!isLogin && <>
            <label>{words.email} <span className="optional">{words.emailOrPhone}</span><input name="email" type="email" value={form.email} onChange={update} /></label>
            <label>{words.phone} <span className="optional">{words.phoneOrEmail}</span><input name="phone" value={form.phone} onChange={update} /></label>
          </>}
          <label>{words.password}<input name="password" type="password" value={form.password} onChange={update} required minLength={isLogin ? undefined : 8} /></label>
          {!isLogin && <label>{words.language}<select name="preferred_language" value={form.preferred_language} onChange={update}><option value="prs">دری</option><option value="ps">پښتو</option><option value="en">English</option></select></label>}
          <button className="btn btn-primary btn-full" disabled={busy}>{busy ? words.wait : isLogin ? words.signIn : words.create}</button>
        </form>
        <p className="auth-switch">{isLogin ? words.newUser : words.existing} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? words.create : words.signIn}</Link></p>
      </div>
    </div>
  );
}
