'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado{
    id: number;
    nombre: string;
}

export function useTipoContrato(){
    const [tipoContrato, setTipoContrato] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/listaTipoContrato')
           .then(r => setTipoContrato(r.data))
           .catch(() => setError ('Error al cargar los tipos de contrato'))
           .finally(() => setLoading(false));
    }, []);

    return { tipoContrato, loading, error };

}