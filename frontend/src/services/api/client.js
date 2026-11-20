const configuredBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const API_BASE_URL = configuredBase.replace(/\/$/, '').replace(/\/api$/, '/api/v1');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

export function imageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('afghan_connect_token');
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData || typeof options.body === 'string'
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  const payload = await response.json().catch(() => ({ success: false, message: 'The server returned an invalid response.' }));
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('afghan_connect_token');
      localStorage.removeItem('afghan_connect_role');
      window.dispatchEvent(new Event('afghan-connect:session-expired'));
    }
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.details = payload.details;
    throw error;
  }
  return payload.data;
}
