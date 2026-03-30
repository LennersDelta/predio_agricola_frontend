// hooks/useAdministrador.ts
'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export interface Administrador {
  id: number;
  descripcion: string;
}

export function useAdministrador() {
  const [administrador, setAdministrador] = useState<Administrador[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    api.get('/api/administrador')
      .then(({ data }) => setAdministrador(data.data ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { administrador, loading };
}