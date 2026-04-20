'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado {
    id: number;
    nombre: string;
}

export function usePredio() {
    const [predios, setPredio] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/listaPredio')
            .then(r => setPredio(r.data))
            .catch(() => setError('Error al cargar los predios'))
            .finally(() => setLoading(false));
    }, []);

    return { predios, loading, error };
}