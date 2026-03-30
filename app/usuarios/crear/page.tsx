'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import UsuarioForm, { UsuarioFormData } from '@/components/usuarios/UsuarioForm';

export default function CrearUsuarioPage() {
  const router  = useRouter();
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UsuarioFormData & { rut?: string }) => {
    setLoading(true);
    setErrors({});
    const toastId = toast.loading('Creando usuario...');

    try {
      await api.post('/api/usuarios', data);

      toast.success('Usuario creado correctamente', {
        id: toastId,
        description: `${data.name} ${data.apellido_ap}`,
        duration: 3000,
      });
      setTimeout(() => router.push('/usuarios'), 1500);

    } catch (err: any) {
      const errorsData = err.response?.data?.errors as Record<string, string[]> | undefined;
      if (errorsData) {
        const mapped: Record<string, string> = {};
        Object.entries(errorsData).forEach(([k, v]) => { mapped[k] = v[0]; });
        setErrors(mapped);
        const primerCampo   = Object.keys(errorsData)[0];
        const primerMensaje = errorsData[primerCampo][0];
        toast.error(primerMensaje, { id: toastId, duration: 5000 });
        document.querySelector(`[data-field="${primerCampo}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast.error(err.response?.data?.message ?? 'Error al crear usuario',
          { id: toastId, duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                        padding: '3px 10px 3px 8px', borderRadius: 999,
                        background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                            color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Administración / Usuarios
            </span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                        fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                        letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Nuevo Usuario
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
            Complete la información para crear un nuevo acceso al sistema
          </p>
        </div>
        <Link href="/usuarios"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                    fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                    color: '#1a2e22', textDecoration: 'none',
                    background: 'linear-gradient(135deg,#8a6a18,#d4a832)',
                    boxShadow: '0 4px 14px rgba(201,168,76,.3)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      </div>

      <UsuarioForm
        modo="crear"
        errors={errors}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}