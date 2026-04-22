'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface estado {
    id: number;
    nombre: string;
}

export function useTipoVehiculo() {
    const [tipoVehiculo, setTipoVehiculo] = useState<estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/listaTipoVehiculos')
            .then(r => setTipoVehiculo(r.data))
            .catch(() => setError('Error al cargar los tipo vehiculos'))
            .finally(() => setLoading(false));
    }, []);

    return { tipoVehiculo, loading, error };
}