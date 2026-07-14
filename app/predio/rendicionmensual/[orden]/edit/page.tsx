'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';

import { usePredio } from '@/hooks/usePredio';
import { useEstados } from '@/hooks/useEstado';


const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
  outline: 'none', fontFamily: '"Barlow",sans-serif', appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
  textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5, fontFamily: 'monospace',
};
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div data-field={label}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#fca5a5', marginLeft: 2 }}>*</span>}</label>
      {children}
      {error && <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>{error}</p>}
    </div>
  );
}
function FInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }} />;
}
function FInputMoney({ readOnly: ro, value, onChange, placeholder }: { readOnly?: boolean; value: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '.78rem', color: '#6b8f75', fontFamily: 'monospace', fontWeight: 600, pointerEvents: 'none', zIndex: 1, lineHeight: 1 }}>$</span>
      <input type={ro ? 'text' : 'number'} step="1" readOnly={ro} value={value} onChange={onChange} placeholder={placeholder ?? '0'} style={{ ...inputStyle, paddingLeft: 22, ...(ro ? { background: 'rgba(58,153,86,.05)', border: '1px solid rgba(58,153,86,.2)', color: '#2e7d46', fontWeight: 600, cursor: 'default' } : {}) }} onFocus={e => { if (!ro) { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; } }} onBlur={e => { if (!ro) { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; } }} />
    </div>
  );
}
function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, paddingRight: 34, cursor: 'pointer', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center' }} onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}>{children}</select>;
}
function SecTitle({ label }: { label: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} /><span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</span></div>;
}
function Section({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>{children}</div>;
}

function ModalMensaje({
  mensaje,
  predio,
  mes,
  onClose,
}: {
  mensaje: string;
  predio: string;
  mes: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '28px',
          width: '90%',
          maxWidth: 420,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 55,
            height: 55,
            borderRadius: '50%',
            background: '#fff3cd',
            margin: '0 auto 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
        >
          ⚠️
        </div>

        <h3
          style={{
            fontFamily: '"Barlow Condensed",sans-serif',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Atención
        </h3>

            <p
            style={{
                fontFamily: 'monospace',
                color: '#555',
                marginBottom: 10,
            }}
            >
            <strong>Predio:</strong> {predio}
            </p>

            <p style={{fontFamily: 'monospace', color: '#555',  marginBottom: 10,}}           >
            <strong>Mes:</strong> {mes}
            </p>

            <p
            style={{fontFamily: 'monospace',
                color: '#555',
                marginBottom: 24,
            }}
            >
            {mensaje}
            </p>

        <button
          onClick={onClose}
          style={{
            padding: '10px 28px',
            border: 'none',
            borderRadius: 8,
            background: '#3a9956',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

function EditarRendicionMensualPageInner() {
    const router = useRouter();
    const params = useParams();

    const uuid = Array.isArray(params?.orden)
      ? params.orden[0]
      : params?.orden;
    
    const [errors,        setErrors]        = useState<Record<string, string>>({});
    const [loadingData, setLoadingData] = useState(true);
    const [loading, setLoading] = useState(false);
    const [cargando, setCargando] = useState(true);

    const { predios, loading: loadingPredios, error: errorPredios } = usePredio();
    /* MODAL */
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalData, setModalData] = useState({predio: '',  mes: ''});

    const [form, setForm] = useState({
        orden: '',
        predio_id: '',
        predio_nombre: '',

        mes: '',
        item: '',
        total: '',
        fecha: '',

        doe_informa_ab5: '',
        observaciones: '',

        uuid: '',
    });

    const set = (k: string, v: string) => {
      setForm(f => ({ ...f, [k]: v }));

      
      // validación en tiempo real
      setErrors(prev => ({
        ...prev,
        [k]: v.trim() ? '' : 'Campo obligatorio'
      }));
    };
    
    /* FORMATO DE LA FECHA MES-AÑO */
    const formatearMes = (mes: string) => {
        if (!mes) return '';
        const [anio, numeroMes] = mes.split('-');
        const nombreMes = new Date(Number(anio), Number(numeroMes) - 1)
            .toLocaleString('es-CL', { month: 'long' });
        //return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anio}`;
        return `${nombreMes.toUpperCase()} ${anio}`;
    };
  // Cargar datos
  useEffect(() => {
    if (!uuid) return;

    const cargar = async () => {
      try {
        setLoadingData(true);

        const { data } = await api.get(`/api/rendicionmensual/${uuid}`);
        const b = data.data ?? data;

        setForm({
            orden: data.data.orden ?? '',
            predio_id: String(data.data.predio_id ?? ''),
            predio_nombre: data.data.predio_nombre ?? '',

            mes: data.data.mes ?? '',
            item: data.data.item ?? '',
            total: String(data.data.total ?? ''),
            fecha: data.data.fecha ?? '',

            doe_informa_ab5: data.data.doe_informa_ab5 ?? '',
            observaciones: data.data.observaciones ?? '',

            uuid: data.data.uuid ?? '',
        });

      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar el registro');
      } finally {
        setLoadingData(false);
        setCargando(false);
      }
    };

    cargar();
  }, [uuid]);
  const errsFront: Record<string, string> = {};
  const validate = () => {
    const newErrors: Record<string, string> = {};

        if (!form.predio_id)
        newErrors.predio_id = 'Debe seleccionar el predio.';

        if (!form.mes)
        newErrors.mes = 'Debe seleccionar el mes.';

        if (!form.item)
        newErrors.item = 'Debe ingresar el ítem.';

        if (!form.total)
        newErrors.total = 'Debe ingresar el total.';

        if (!form.fecha)
        newErrors.fecha = 'Debe ingresar la fecha.';

        if (!form.doe_informa_ab5)
        newErrors.doe_informa_ab5 = 'Debe indicar si informó a AB5.';

        if (!form.observaciones)
        newErrors.observaciones = 'Debe ingresar las observaciones.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
      const primerCampo = Object.keys(newErrors)[0];
      document
        .querySelector(`[data-field="${primerCampo}"]`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

        formData.append('predio_id', String(form.predio_id));
        formData.append('mes', form.mes);
        formData.append('item', form.item);
        formData.append('total', String(form.total));
        formData.append('fecha', form.fecha);
        formData.append('doe_informa_ab5', form.doe_informa_ab5);
        formData.append('observaciones', form.observaciones);

        if (form.uuid) {formData.append('uuid', form.uuid);}



      await api.post(`/api/rendicionmensual/${uuid}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Actualizado correctamente');

      setTimeout(() => {
        router.push('/predio/rendicionmensual');
      }, 800);

    } catch (err: any) {
        if (err.response?.status === 422) {
            setLoading(false);
            setModalMessage(err.response.data.message);
            setModalData({
                predio: form.predio_nombre,
                mes: formatearMes(form.mes),
            });
            setShowModal(true);
            return;
        }
        toast.error(err.response?.data?.message ?? 'Error al actualizar');
        setLoading(false);
    }
  };
      

  // Loading
  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>
      <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      Cargando registro...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

 return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div style={{ fontFamily: '"Barlow",sans-serif' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '3px 10px 3px 8px', borderRadius: 999, background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500, color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>Gestión Predio Agrícola</span>
            </div>
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>Editar rendición mensual</h2>
          </div>
          <Link href={`/predio/rendicionmensual/`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1a2e22', textDecoration: 'none', background: 'linear-gradient(135deg,#8a6a18,#d4a832)', boxShadow: '0 4px 14px rgba(201,168,76,.3)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} onMouseLeave={e => (e.currentTarget.style.filter = '')}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver
          </Link>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
            <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,.1)'
            }}>
            <Section>
            <SecTitle label="Información General" />
            <div
                style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16
                }}
            >
                <Field label="Predio" error={errors.predio_id}>
                <FSelect
                    disabled
                    value={form.predio_id}
                    onChange={e => set('predio_id', e.target.value)}
                >
                    <option value="">Seleccione</option>

                    {predios.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.nombre}
                    </option>
                    ))}
                </FSelect>
                </Field>

                <Field label="Mes" error={errors.mes}>
                <FInput
                    type="month"
                    value={form.mes}
                    onChange={e => set('mes', e.target.value)}
                />
                </Field>

                <Field label="Ítem" error={errors.item}>
                <FInput
                    value={form.item}
                    onChange={e => set('item', e.target.value)}
                />
                </Field>

                <Field label="Total" error={errors.total}>
                <FInputMoney
                    value={form.total}
                    onChange={e => set('total', e.target.value)}
                />
                </Field>

                <Field label="Fecha" error={errors.fecha}>
                <FInput
                    type="date"
                    value={form.fecha}
                    onChange={e => set('fecha', e.target.value)}
                />
                </Field>
            </div>
            </Section>

            <Section>
            <SecTitle label="Otros" />
            <div
                style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
                gap: 16
                }}
            >
                <Field
                label="DOE Informa A.B.5"
                error={errors.doe_informa_ab5}
                >
                <FInput
                    value={form.doe_informa_ab5}
                    onChange={e => set('doe_informa_ab5', e.target.value)}
                />
                </Field>

                <Field
                label="Observaciones"
                error={errors.observaciones}
                >
                <textarea
                    value={form.observaciones}
                    onChange={e => set('observaciones', e.target.value)}
                    style={{
                    ...inputStyle,
                    minHeight: 90
                    }}
                />
                </Field>
            </div>
            </Section>

            {/* BOTÓN GUARDAR (DERECHA) */}
            <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 20,
            marginBottom: 20,
            paddingRight: 20 
            }}>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 24px',
                    borderRadius: 9,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: '"Barlow Condensed",sans-serif',
                    fontSize: '.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: '#0d2318',
                    background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
                    boxShadow: '0 4px 14px rgba(76,202,122,.28)',
                    opacity: loading ? .7 : 1
                    }}
                    onMouseEnter={e => {
                    if (!loading) e.currentTarget.style.filter = 'brightness(1.08)';
                    }}
                    onMouseLeave={e => {
                    e.currentTarget.style.filter = '';
                    }}
                >
                    {loading ? 'Guardando...' : 'Guardar rendición mensual'}
                </button>
            </div>
            </div>
        </form>
             {showModal && (
                <ModalMensaje
                    mensaje={modalMessage}
                    predio={modalData.predio}
                    mes={modalData.mes}
                    onClose={() => setShowModal(false)}
                />
        )}
      </div>
    </>
  );
}

export default function EditarRendicionMensualPage() {
  return <Suspense><EditarRendicionMensualPageInner /></Suspense>;
}