'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface EstadoPropiedad {
    id: number;
    descripcion: string;
}

export function useEstadoPropiedad() {
    const [estados, setEstado] = useState<EstadoPropiedad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/estado-propiedad')
            .then(r => setEstado(r.data))
            .catch(() => setError('Error al cargar los estados de propiedad'))
            .finally(() => setLoading(false));
    }, []);

    return { estados, loading, error };
}