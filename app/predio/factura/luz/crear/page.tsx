// app/predio/factura/luz/crear/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useEstados } from '@/hooks/useEstado';
import { usePredio } from '@/hooks/usePredio';

// ── Estilos ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
  outline: 'none', fontFamily: '"Barlow",sans-serif', appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
  textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5,
  fontFamily: 'monospace',
};

// ── Subcomponentes ─────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div data-field={label}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#fca5a5', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
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
      <div style={{ width: 3, height: 16, borderRadius: 2, background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} />
      <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase', letterSpacing: '.12em' }}>
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

// ── Componente principal ───────────────────────────────────────────────────
export default function CrearFacturaLuzPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    predio:               '',
    nroFactura:           '',
    mesConsumo:           '',
    valorTotal:           '',
    proveedor:            '',
    estadoFactura:        '',
    doeRespuestaB5:       '',
    cantidadConsumoKilos: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Hooks ──────────────────────────────────────────────────────────────
  const { estados, loading: loadingEstados, error: errorEstados } = useEstados('factura_consumo');
  const { predios, loading: loadingPredios, error: errorPredios } = usePredio();
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errsFront: Record<string, string> = {};

    if (!form.predio)               errsFront.predio               = 'Debe seleccionar un predio.';
    if (!form.nroFactura)           errsFront.nroFactura           = 'El número de factura es obligatorio.';
    if (!form.mesConsumo)           errsFront.mesConsumo           = 'El mes de consumo es obligatorio.';
    if (!form.valorTotal)           errsFront.valorTotal           = 'El valor total es obligatorio.';
    if (!form.proveedor)            errsFront.proveedor            = 'El proveedor es obligatorio.';
    if (!form.estadoFactura)        errsFront.estadoFactura        = 'Debe seleccionar el estado de la factura.';
    if (!form.doeRespuestaB5)       errsFront.doeRespuestaB5       = 'Debe ingresar el DOE de respuesta B.5.';
    if (!form.cantidadConsumoKilos) errsFront.cantidadConsumoKilos = 'La cantidad de consumo en kilos es obligatoria.';

    if (Object.keys(errsFront).length > 0) {
      setErrors(errsFront);
      toast.error(Object.values(errsFront)[0]);
      document
        .querySelector(`[data-field="${Object.keys(errsFront)[0]}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Guardando factura de luz...');

    try {
      await api.post('/api/factura/luz', {
        predio:               form.predio,
        nroFactura:           form.nroFactura,
        mesConsumo:           form.mesConsumo,
        valorTotal:           form.valorTotal,
        proveedor:            form.proveedor,
        estadoFactura:        form.estadoFactura,
        doeRespuestaB5:       form.doeRespuestaB5,
        cantidadConsumoKilos: form.cantidadConsumoKilos,
      });

      toast.success('Factura de luz guardada correctamente.', { id: toastId, duration: 3000 });
      router.push('/predio/factura/luz');

    } catch (err: any) {
      const errorsData = err.response?.data?.errors as Record<string, string[]> | undefined;
      if (errorsData) {
        const mapped: Record<string, string> = {};
        Object.entries(errorsData).forEach(([k, v]) => { mapped[k] = v[0]; });
        setErrors(mapped);
        const primerCampo   = Object.keys(errorsData)[0];
        const primerMensaje = errorsData[primerCampo][0];
        toast.error(primerMensaje, { id: toastId, duration: 5000 });
        document
          .querySelector(`[data-field="${primerCampo}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast.error(err.response?.data?.message ?? 'Error al guardar', { id: toastId, duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '3px 10px 3px 8px', borderRadius: 999, background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500, color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Gestión Predio Agrícola
            </span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Nueva Factura Luz
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
            Complete la información de la ficha de factura luz
          </p>
        </div>
        <Link href="/predio/factura/luz"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1a2e22', textDecoration: 'none', background: 'linear-gradient(135deg,#8a6a18,#d4a832)', boxShadow: '0 4px 14px rgba(201,168,76,.3)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </Link>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>

          <Section>
            <SecTitle label="Información General" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>

              <Field label="Predio" error={errors.predio}>
                <FSelect value={form.predio} onChange={e => set('predio', e.target.value)}>
                  <option value="">
                    {loadingPredios ? 'Cargando...' : errorPredios ? errorPredios : 'Seleccione'}
                  </option>
                  {predios.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </FSelect>
              </Field>

              <Field label="N° de Factura" error={errors.nroFactura}>
                <FInput value={form.nroFactura} onChange={e => set('nroFactura', e.target.value)} />
              </Field>

              <Field label="Mes de Consumo" error={errors.mesConsumo}>
                <FInput
                  type="month"
                  value={form.mesConsumo}
                  onChange={e => set('mesConsumo', e.target.value)}
                />
              </Field>

              <Field label="Valor Total ($)" error={errors.valorTotal}>
                <FInput
                  type="number"
                  value={form.valorTotal}
                  onChange={e => set('valorTotal', e.target.value)}
                />
              </Field>

              <Field label="Proveedor" error={errors.proveedor}>
                <FInput value={form.proveedor} onChange={e => set('proveedor', e.target.value)} />
              </Field>

              <Field label="Estado Factura" error={errors.estadoFactura}>
                <FSelect value={form.estadoFactura} onChange={e => set('estadoFactura', e.target.value)}>
                  <option value="">
                    {loadingEstados ? 'Cargando...' : errorEstados ? errorEstados : 'Seleccione'}
                  </option>
                  {estados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </FSelect>
              </Field>

              <Field label="DOE Respuesta B.5" error={errors.doeRespuestaB5}>
                <FInput
                  value={form.doeRespuestaB5}
                  onChange={e => set('doeRespuestaB5', e.target.value)}
                />
              </Field>

              <Field label="Consumo (Kilos)" error={errors.cantidadConsumoKilos}>
                <FInput
                  type="number"
                  value={form.cantidadConsumoKilos}
                  onChange={e => set('cantidadConsumoKilos', e.target.value)}
                />
              </Field>

            </div>
          </Section>

          {/* BOTÓN GUARDAR */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, marginBottom: 20, paddingRight: 20 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 24px', borderRadius: 9, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                color: '#0d2318', background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
                boxShadow: '0 4px 14px rgba(76,202,122,.28)', opacity: loading ? .7 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
            >
              {loading ? 'Guardando...' : 'Guardar factura luz'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}