'use client';

import { useEffect, useState } from 'react';
import { getUser, type UserData } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    isAdmin:   user?.role === 'administrador',
    isUsuario: user?.role === 'usuario',
    hasRole:   (role: string) => user?.roles?.includes(role) ?? false,
  };
}
