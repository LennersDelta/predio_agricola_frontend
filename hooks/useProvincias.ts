'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export interface Provincia {
    id: number;
    descripcion: string;
}

export function useProvincias() {
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargar = async (region_id: string) => {
        if (!region_id) { setProvincias([]); return; }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/api/provincias/${region_id}`);
            setProvincias(data);
        } catch {
            setError('Error al cargar provincias');
            setProvincias([]);
        } finally {
            setLoading(false);
        }
    };

    const limpiar = () => setProvincias([]);

    return { provincias, loading, error, cargar, limpiar };
}