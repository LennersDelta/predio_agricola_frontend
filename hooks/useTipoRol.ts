'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado{
    id: number;
    name: string;
}

export function useTipoRol(){
    const [tipoRol, setTipoRol] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/listaTipoRol')
           .then(r => setTipoRol(r.data))
           .catch(() => setError ('Error al cargar los tipos de roles'))
           .finally(() => setLoading(false));
    }, []);

    return { tipoRol, loading, error };

}