'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface Predio {
    id: number;
    nombre: string;
}

interface UsePredioReturn {
    predios: Predio[];
    loading: boolean;
    error: string | null;
}

export function usePredio(): UsePredioReturn {

    const [predios, setPredios] = useState<Predio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let activo = true;

        api.get('/api/listaPredio')
            .then(({ data }) => {

                if (!activo) return;

                setPredios(
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.data)
                            ? data.data
                            : []
                );
            })
            .catch((err) => {
                console.error(err);
                if (!activo) return;
                setError('Error al cargar los predios');
                setPredios([]);
            })
            .finally(() => {

                if (activo) {
                    setLoading(false);
                }
            });

        return () => {
            activo = false;
        };

    }, []);

    return {
        predios,
        loading,
        error
    };
}