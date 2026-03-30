'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface TipoPropiedad {
    id: number;
    descripcion: string;
}

export function useTipoPropiedad() {
    const [tipos, setTipos] = useState<TipoPropiedad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/tipo-propiedad')
            .then(r => setTipos(r.data))
            .catch(() => setError('Error al cargar tipos de propiedad'))
            .finally(() => setLoading(false));
    }, []);

    return { tipos, loading, error };
}