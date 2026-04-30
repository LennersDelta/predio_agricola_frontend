'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado{
    id: number;
    descripcion: string;
}

export function useTipoGrado(){
    const [tipoGrado, setTipoGrado] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/listaTipoGrado')
           .then(r => setTipoGrado(r.data))
           .catch(() => setError ('Error al cargar los tipos de grado'))
           .finally(() => setLoading(false));
    }, []);

    return { tipoGrado, loading, error };

}