import { apiRequest } from '../api/client';

export const catalogApi = {
  categories: (params = {}) => apiRequest(`/categories?${new URLSearchParams(params)}`),
  products: (params = {}) => apiRequest(`/products?${new URLSearchParams(params)}`),
  product: (id) => apiRequest(`/products/${id}`),
  services: (params = {}) => apiRequest(`/services?${new URLSearchParams(params)}`),
  service: (id) => apiRequest(`/services/${id}`),
};
