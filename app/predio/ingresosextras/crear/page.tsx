// app/predio/ingresosextras/crear/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAdministrador }    from '@/hooks/useAdministrador';
import { useUso }              from '@/hooks/useUso';
import { toast } from 'sonner';

import { useEstados } from '@/hooks/useEstado';
import { usePredio } from '@/hooks/usePredio';

// ESTILOS REUTILIZABLES
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
  outline: 'none', fontFamily: '"Barlow",sans-serif', appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};
const lblStyle: React.CSSProperties = {
  display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
  textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5, fontFamily: 'monospace',
};
// SUBCOMPONENTES
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div data-field={label}>
      <label style={lblStyle}>
        {label}
        {required && <span style={{ color: '#fca5a5', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#ef4444',
                    marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
function FInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={inputStyle}
      onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}
function FInputMoney({ readOnly: ro, value, onChange, placeholder, style: extraStyle }: {
  readOnly?: boolean;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        fontSize: '.78rem', color: '#6b8f75', fontFamily: 'monospace',
        fontWeight: 600, pointerEvents: 'none', zIndex: 1, lineHeight: 1,
      }}>$</span>
      <input
        type={ro ? 'text' : 'number'} step="1" readOnly={ro}
        value={value} onChange={onChange} placeholder={placeholder ?? '0'}
        style={{
          ...inputStyle, paddingLeft: 22,
          ...(ro ? { background: 'rgba(58,153,86,.05)', border: '1px solid rgba(58,153,86,.2)',
                      color: '#2e7d46', fontWeight: 600, cursor: 'default' } : {}),
          ...extraStyle,
        }}
        onFocus={e => { if (!ro) { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; } }}
        onBlur={e  => { if (!ro) { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; } }}
      />
    </div>
  );
}
function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{
      ...inputStyle, paddingRight: 34, cursor: 'pointer',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center',
    }}
      onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  );
}
function SecTitle({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2,
                    background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} />
      <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                      fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase',
                      letterSpacing: '.12em' }}>
        {label}
      </span>
    </div>
  );
}
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)', ...style }}>
      {children}
    </div>
  );
}
const siStyle: React.CSSProperties = {
  appearance: 'none', width: '100%', background: '#fff',
  border: '1px solid rgba(0,0,0,.1)', color: '#1a2e22', fontSize: '.8rem',
  borderRadius: 7, padding: '8px 12px', outline: 'none',
  fontFamily: '"Barlow",sans-serif', transition: 'border-color .18s, box-shadow .18s',
};
const selectArrow = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

// COMPONENTE PRINCIPAL

export default function CrearIngresosExtrasPage() {
  const router      = useRouter();
  const mapRef       = useRef<HTMLDivElement>(null);
  const leaflet      = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const mapInstance  = useRef<any>(null);
  const geoTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [form, setForm] = useState({
    predio_id: '',
    item_venta: '',
    dte_resolucion: '',
    valor_total: '',
    fecha: '',
    estado_pago: '0',
    doe_informa_ab5: '',
    observaciones: '',
    uuid: '',
    });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const { uso, loading: loadingUso } = useUso();
  const [loading, setLoading] = useState(false);

  const { predios, loading: loadingPredios, error: errorPredios } = usePredio();
  const { estados: EstadoCompra, loading: loadingEstadosCompra, error: errorEstadosCompra } = useEstados('estadoFactura');

  /* PARA LOS USUARIO CON UN PREDIO YA SELECCIONADO */
  useEffect(() => {
    if (loadingPredios || predios.length === 0) return;

    // Si solamente tiene un predio, se selecciona automáticamente
    if (predios.length === 1) {
        setForm(prev => ({
            ...prev,
            predio_id: String(predios[0].id),
            predio_nombre: predios[0].nombre,
        }));
    }
  }, [predios, loadingPredios]);

  //  Submit 
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errsFront: Record<string, string> = {};

    if (!form.predio_id)
    errsFront.predio_id = 'Debe seleccionar el predio.';

    if (!form.item_venta)
    errsFront.item_venta = 'Debe ingresar el ítem de venta.';

    if (!form.dte_resolucion)
    errsFront.dte_resolucion = 'Debe ingresar el DTE o Resolución.';

    if (!form.valor_total)
    errsFront.valor_total = 'Debe ingresar el valor total.';

    if (!form.fecha)
    errsFront.fecha = 'Debe ingresar la fecha.';

    if (form.estado_pago === '')
    errsFront.estado_pago = 'Debe seleccionar el estado de pago.';

    if (!form.doe_informa_ab5)
    errsFront.doe_informa_ab5 = 'Debe ingresar el DOE informa B.5.';
   
    // ───── VALIDACIÓN FINAL ─────
    if (Object.keys(errsFront).length > 0) {
        setErrors(errsFront);
        toast.error(Object.values(errsFront)[0]);
        const primerCampo = Object.keys(errsFront)[0];
        document
          .querySelector(`[data-field="${primerCampo}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    try{
      const fd = new FormData();
        
      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value ?? '');
      });

      await api.post('/api/ingresosextras/insert', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Guardado correctamente');
      setTimeout(() => {
        router.push('/predio/ingresosextras'); 
      }, 1000);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al guardar', {
        duration:5000,
      });
    }
}; 
return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div style={{ fontFamily: '"Barlow",sans-serif' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                          padding: '3px 10px 3px 8px', borderRadius: 999,
                          background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%',
                              background: '#3a9956', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                              color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Gestión Predio Agricola
              </span>
            </div>
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                          fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                          letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
              Nuevo Ingreso Extra 
            </h2>
            <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
               Complete la información del ingreso extra.
            </p>
          </div>
          <Link href="/predio/ingresosextras"
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
                        gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                        gap: 16
                    }}
                >

                    {/* Hook PREDIO */}
                    <div>
                        <label style={lblStyle}>Predio</label>
                        <select
                            value={form.predio_id}
                            onChange={e => {
                                const predio = predios.find(
                                    p => String(p.id) === e.target.value
                                );

                                setForm(prev => ({
                                    ...prev,
                                    predio_id: e.target.value,
                                    predio_nombre: predio?.nombre ?? '',
                                }));
                            }}
                            disabled={loadingPredios || predios.length === 0 || predios.length === 1}
                            style={{
                                ...siStyle,
                                paddingRight: 32,
                                cursor: loadingPredios
                                    ? 'wait'
                                    : predios.length === 1
                                    ? 'not-allowed'
                                    : 'pointer',
                                backgroundImage: selectArrow,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 10px center',
                                opacity: loadingPredios ? 0.7 : 1,
                            }}
                        >
                            {loadingPredios ? (
                                <option value="">Cargando...</option>
                            ) : predios.length === 1 ? (
                                // Usuario normal: muestra directamente su predio
                                <option value={String(predios[0].id)}>
                                    {predios[0].nombre}
                                </option>
                            ) : (
                                // Administrador / Super Administrador
                                <>
                                    <option value="">Seleccione</option>

                                    {predios.map(p => (
                                        <option key={p.id} value={String(p.id)}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>

                        {errors.predio_id && (
                            <p
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: '.6rem',
                                    color: '#ef4444',
                                    marginTop: 4,
                                }}
                            >
                                {errors.predio_id}
                            </p>
                        )}
                    </div>

                    <Field label="Ítem Venta" error={errors.item_venta}>
                        <FInput
                            value={form.item_venta}
                            onChange={e => set('item_venta', e.target.value)}
                        />
                    </Field>

                    <Field label="DTE / Resolución" error={errors.dte_resolucion}>
                        <FInput
                            value={form.dte_resolucion}
                            onChange={e => set('dte_resolucion', e.target.value)}
                        />
                    </Field>

                    <Field label="Valor Total" error={errors.valor_total}>
                        <FInputMoney
                            value={form.valor_total}
                            onChange={e => set('valor_total', e.target.value)}
                        />
                    </Field>

                    <Field label="Fecha" error={errors.fecha}>
                        <FInput
                            type="date"
                            value={form.fecha}
                            onChange={e => set('fecha', e.target.value)}
                        />
                    </Field>

                    <Field label="Estado Pago" error={errors.estado_pago}>
                        <FSelect
                            value={form.estado_pago}
                            onChange={e => set('estado_pago', e.target.value)}
                        >
                            <option value="0">Pendiente</option>
                            <option value="1">Pagado</option>
                        </FSelect>
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
                        label="DOE Informa B.5"
                        error={errors.doe_informa_ab5}
                    >
                        <FInput
                            value={form.doe_informa_ab5}
                            onChange={e => set('doe_informa_ab5', e.target.value)}
                        />
                    </Field>

                    <Field label="Observaciones">
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 12, padding: '20px 28px',
                          background: 'rgba(0,0,0,.03)', borderTop: '1px solid rgba(0,0,0,.06)' }}>
              <p style={{ fontSize: '.65rem', color: '#9ab8a2', fontFamily: 'monospace' }}>
                <span style={{ color: '#fca5a5' }}>*</span> Campos obligatorios
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link href="/predio/ingresosextras"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', borderRadius: 9,
                            fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                            color: '#6b8f75', background: '#eaf3ec',
                            border: '1px solid rgba(0,0,0,.1)', textDecoration: 'none' }}>
                  Cancelar
                </Link>
                
                <button type="submit" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '10px 24px', borderRadius: 9, border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                            color: '#0d2318',
                            background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
                            boxShadow: '0 4px 14px rgba(76,202,122,.28)',
                            opacity: loading ? .7 : 1 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  {loading ? (
                    <svg className="animate-spin" style={{ width: 14, height: 14 }}
                      fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {loading ? 'Guardando...' : 'Guardar ingresos extras'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}