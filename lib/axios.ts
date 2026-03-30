// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ── Interceptor request — refrescar CSRF en mutaciones ───────────────────────
api.interceptors.request.use(async config => {
  const method = config.method?.toUpperCase();
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method ?? '');

  if (isMutation && typeof document !== 'undefined') {
    const hasCsrf = document.cookie
      .split(';')
      .some(c => c.trim().startsWith('XSRF-TOKEN='));

    if (!hasCsrf) {
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
        { withCredentials: true }
      );
    }
  }

  return config;
});

// ── Interceptor response ──────────────────────────────────────────────────────
api.interceptors.response.use(
  response => response,
  async error => {
    const status  = error.response?.status;
    const url     = error.config?.url ?? '';

    // 419 = CSRF expirado — refrescar y reintentar UNA vez
    if (status === 419) {
      try {
        await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
          { withCredentials: true }
        );
        return api.request(error.config);
      } catch {
        // si falla el reintento, continuar con el error original
      }
    }

    // 401 SOLO si viene de /api/user = sesión realmente expirada
    // Para otros endpoints, NO redirigir — puede ser problema de permisos
    if (status === 401 && url.includes('/api/user') && typeof window !== 'undefined') {
      localStorage.removeItem('user');
      await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export default api;