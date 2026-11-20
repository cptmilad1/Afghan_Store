import { useEffect, useMemo, useState } from 'react';
import { authApi } from '../../services/endpoints/auth';
import { AuthContext } from './authContext';
import { useLocale } from './LocaleProvider';

export function AuthProvider({ children }) {
  const { setLocale } = useLocale();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('afghan_connect_token')));

  useEffect(() => {
    const expireSession = () => { setUser(null); setLoading(false); };
    window.addEventListener('afghan-connect:session-expired', expireSession);
    if (!localStorage.getItem('afghan_connect_token')) {
      return () => window.removeEventListener('afghan-connect:session-expired', expireSession);
    }
    authApi.me()
      .then((currentUser) => { setUser(currentUser); if (currentUser.preferred_language) setLocale(currentUser.preferred_language); })
      .catch(() => {
        localStorage.removeItem('afghan_connect_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
    return () => window.removeEventListener('afghan-connect:session-expired', expireSession);
  }, []);

  const login = (result) => {
    localStorage.setItem('afghan_connect_token', result.token);
    setUser(result.user);
    if (result.user.preferred_language) setLocale(result.user.preferred_language);
  };
  const logout = () => {
    localStorage.removeItem('afghan_connect_token');
    setUser(null);
  };
  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
