'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export interface Comuna {
    id: number;
    descripcion: string;
}

export function useComunas() {
    const [comunas, setComunas] = useState<Comuna[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargar = async (provincia_id: string) => {
        if (!provincia_id) { setComunas([]); return; }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/api/comunas/${provincia_id}`);
            setComunas(data);
        } catch {
            setError('Error al cargar comunas');
            setComunas([]);
        } finally {
            setLoading(false);
        }
    };

    const limpiar = () => setComunas([]);

    return { comunas, loading, error, cargar, limpiar };
}