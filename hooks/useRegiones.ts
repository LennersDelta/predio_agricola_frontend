'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface Region {
    id: number;
    descripcion: string;
}

export function useRegiones() {
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/regiones')
            .then(r => setRegiones(r.data))
            .catch(() => setError('Error al cargar las regiones'))
            .finally(() => setLoading(false));
    }, []);

    return { regiones, loading, error };
}