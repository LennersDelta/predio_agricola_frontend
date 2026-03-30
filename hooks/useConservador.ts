'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface Region {
    id: number;
    descripcion: string;
}

export function useConservador() {
    const [conservador, setConservador] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/conservador')
            .then(r => setConservador(r.data))
            .catch(() => setError('Error al cargar los conservadores'))
            .finally(() => setLoading(false));
    }, []);

    return { conservador, loading, error };
}