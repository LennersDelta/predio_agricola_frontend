// hooks/useUso.ts
'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export interface Uso {
  id: number;
  descripcion: string;
}

export function useUso() {
  const [uso,     setUso]     = useState<Uso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/uso')
      .then(({ data }) => setUso(data.data ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { uso, loading };
}