import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      document.cookie = 'session_predio_agricola=; Max-Age=0; path=/; SameSite=Lax';
      document.cookie = 'user_role=; Max-Age=0; path=/; SameSite=Lax';
      await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;