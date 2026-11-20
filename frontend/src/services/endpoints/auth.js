import { apiRequest } from '../api/client';

export const authApi = {
  register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  me: () => apiRequest('/users/me'),
  updateMe: (body) => apiRequest('/users/me', { method: 'PATCH', body }),
  changePassword: (body) => apiRequest('/users/me/password', { method: 'PATCH', body }),
};
