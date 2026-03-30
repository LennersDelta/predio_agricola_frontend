// hooks/useUsuarios.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface Usuario {
  id: number;
  name: string;
  apellido_ap: string;
  apellido_mat: string;
  rut: string;
  rut_formateado: string;
  email: string | null;
  grado: string;
  tipo_contratacion: string;
  telefono: string;
  area_id: number | null;
  role: string;
  roles: string[];
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/usuarios');
      setUsuarios(data.data ?? data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id: number): Promise<void> => {
    await api.delete(`/api/usuarios/${id}`);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

  return { usuarios, loading, error, recargar: cargar, eliminar };
}