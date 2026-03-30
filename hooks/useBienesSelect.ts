// hooks/useBienesSelect.ts
'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export interface BienOpcion {
  id: number;
  uuid: string;
  carpeta: string;
  nombre_conjunto: string | null;
  rol_avaluo: string;
  fojas: string | null;
  numero: string | null;
  ano_registro: string | null;
  direccion: string | null;
  decreto_destinacion: string | null;
  superficie: number | null;
  metros_construidos: number | null;
  tasacion_comercial: number | null;
  avaluo_fiscal_terreno: number | null;
  avaluo_fiscal_construccion: number | null;
  avaluo_fiscal_total: number | null;
  observaciones: string | null;
  tipo_propiedad: string;
  estado_propiedad: string;
  region: string;
  provincia: string;
  comuna: string;
  conservador: string;
}

export function useBienesSelect(enabled: boolean) {
  const [bienes,  setBienes]  = useState<BienOpcion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    api.get('/api/bienes-select')
      .then(({ data }) => setBienes(data.data ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [enabled]);

  return { bienes, loading };
}