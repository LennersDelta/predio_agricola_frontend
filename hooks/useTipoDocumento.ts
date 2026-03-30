'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface TipoDocumento {
    id: number;
    descripcion: string;
    label: string;
    icono: string;
}

export function useTipoDocumento() {
    const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/tipo-documento')
            .then(r => setTipoDocumento(r.data))
            .catch(() => setError('Error al cargar los tipos de documentos'))
            .finally(() => setLoading(false));
    }, []);

    return { tipoDocumento, loading, error };
}