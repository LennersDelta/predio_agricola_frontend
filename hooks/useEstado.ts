'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado {
    id: number;
    nombre: string;
}

export function useEstados(tipo: string) {
    const [estados, setEstado] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get(`/api/estados/${tipo}`)
            .then(r => setEstado(r.data))
            .catch(() => setError('Error al cargar los estados de factura'))
            .finally(() => setLoading(false));
    }, []);

    return { estados, loading, error };
}