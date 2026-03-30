'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import UsuarioForm, { UsuarioFormData } from '@/components/usuarios/UsuarioForm';
import { Usuario } from '@/hooks/useUsuarios';

export default function EditarUsuarioPage() {
  const router    = useRouter();
  const { id }    = useParams<{ id: string }>();
  const [usuario,  setUsuario]  = useState<Usuario | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar datos del usuario
  useEffect(() => {
    api.get(`/api/usuarios/${id}`)
      .then(({ data }) => setUsuario(data.data ?? data))
      .catch(() => toast.error('No se pudo cargar el usuario'))
      .finally(() => setCargando(false));
  }, [id]);

  const handleSubmit = async (data: UsuarioFormData) => {
    setLoading(true);
    setErrors({});
    const toastId = toast.loading('Guardando cambios...');

    try {
      await api.put(`/api/usuarios/${id}`, data);

      toast.success('Usuario actualizado correctamente', {
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
        toast.error(err.response?.data?.message ?? 'Error al guardar',
          { id: toastId, duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 300, gap: 12, fontFamily: 'monospace',
                    fontSize: '.7rem', color: '#9ab8a2' }}>
        <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }}
          fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando usuario...
      </div>
    );
  }

  if (!usuario) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#ef4444' }}>
          Usuario no encontrado
        </p>
        <Link href="/usuarios" style={{ color: '#2e7d46', fontSize: '.78rem' }}>
          Volver al listado
        </Link>
      </div>
    );
  }

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
            Editar Usuario
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
            {usuario.rut_formateado} — {[usuario.name, usuario.apellido_ap, usuario.apellido_mat].filter(Boolean).join(' ')}
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
        modo="editar"
        rutSoloLectura={usuario.rut_formateado}
        inicial={{
          name:              usuario.name              ?? '',
          apellido_ap:       usuario.apellido_ap       ?? '',
          apellido_mat:      usuario.apellido_mat      ?? '',
          email:             usuario.email             ?? '',
          grado:             usuario.grado             ?? '',
          tipo_contratacion: usuario.tipo_contratacion ?? '',
          telefono:          usuario.telefono          ?? '',
          area_id:           String(usuario.area_id    ?? ''),
          role:              usuario.role              ?? 'usuario',
          password:          '',
          password_confirmation: '',
        }}
        errors={errors}
        loading={loading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}