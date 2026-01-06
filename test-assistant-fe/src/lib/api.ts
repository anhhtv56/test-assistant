import axios from 'axios';
import { useAuthStore } from '../state/auth';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Before send request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  config.headers = config.headers || {};
  if (token) {
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return config;
})

// After get response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if(error.response?.status === 401) {
      // Clear auth state
      const authStore = useAuthStore.getState();
      authStore.logout();

      // Redirect to login page
      if(window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
  
);

export default api;