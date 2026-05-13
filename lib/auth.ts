import axios from 'axios';
import api from './axios';

export type UserData = {
  id: number;
  name: string;
  rut: string;
  rut_formateado: string;
  email: string | null;
  grado: string;
  role: string;
  roles: string[];
};

export async function login(rut: string, password: string): Promise<UserData> {
  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/login`,
    { rut, password },
    { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
  );

  localStorage.setItem('auth_token', data.token);

  const userRes = await api.get('/api/user');
  const user = userRes.data.data;
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export async function logout() {
  try { await api.post('/logout'); } catch {}
  localStorage.removeItem('user');
  localStorage.removeItem('auth_token');
  document.cookie = 'session_predio_agricola=; Max-Age=0; path=/; SameSite=Lax';
  document.cookie = 'user_role=; Max-Age=0; path=/; SameSite=Lax';
  await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
  window.location.href = '/login';
}

export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getUserRole(): string { return getUser()?.role ?? 'usuario'; }
export function isAdmin(): boolean { return getUserRole() === 'administrador'; }