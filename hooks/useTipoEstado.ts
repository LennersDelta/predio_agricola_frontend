'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface TipoEstado {
  value: string;
  label: string;
}

export function useTiposEstado() {

  const [tipos, setTipos] = useState<TipoEstado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const cargar = async () => {

      try {

        const { data } = await api.get(
          '/api/configuracion/estados/tipos'
        );

        const unicos: string[] = data.data ?? [];

        const formateados: TipoEstado[] =
          unicos.map((tipo: string) => ({
            value: tipo,
            label: tipo,
          }));

        setTipos(formateados);

      } catch (error) {

        console.error(
          'Error cargando tipos',
          error
        );

      } finally {

        setLoading(false);
      }
    };

    cargar();

  }, []);

  return {
    tipos,
    loading,
  };
}