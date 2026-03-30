// lib/auth.ts
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

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(rut: string, password: string): Promise<UserData> {
  await api.get('/sanctum/csrf-cookie');
  await api.post('/login', { rut, password });

  const { data } = await api.get('/api/user');
  const user = data.data;

  localStorage.setItem('user', JSON.stringify(user));

  return user;
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout() {
  try {
    await api.post('/logout');
  } catch {
    // continuar aunque falle el logout en Laravel
  }

  localStorage.removeItem('user');

  // Limpiar cookies via API route
  await fetch('/api/session', { method: 'DELETE' });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserRole(): string {
  return getUser()?.role ?? 'usuario';
}

export function isAdmin(): boolean {
  return getUserRole() === 'administrador';
}