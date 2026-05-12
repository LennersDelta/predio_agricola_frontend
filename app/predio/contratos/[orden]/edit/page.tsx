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

/* SETEA RUT CON FORMATO CHILENO CON PUNTOS Y GUION */
const formatearRut = (rut: string) => {
  // limpiar todo lo inválido
  let limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();

  // evitar largo excesivo
  if (limpio.length > 9) limpio = limpio.slice(0, 9);

  // si es muy corto, no formatear aún
  if (limpio.length <= 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  // formatear con puntos
  const cuerpoConPuntos = cuerpo
    .split('')
    .reverse()
    .join('')
    .match(/.{1,3}/g)
    ?.join('.')
    .split('')
    .reverse()
    .join('') ?? '';

  return `${cuerpoConPuntos}-${dv}`;
};
const validarRut = (rut: string) => {
  // limpiar formato
  const limpio = rut.replace(/\./g, '').replace('-', '').toUpperCase();

  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  let dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;

  // cálculo módulo 11
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperadoNum = 11 - (suma % 11);
  let dvEsperado = '';

  if (dvEsperadoNum === 11) dvEsperado = '0';
  else if (dvEsperadoNum === 10) dvEsperado = 'K';
  else dvEsperado = String(dvEsperadoNum);

  return dv === dvEsperado;
};


function EditarContratosPageInner() {
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
    const {estados: TipoRenta, loading: loadingTipoRenta,error: errorTipoRenta } = useEstados('rentaContrato');

    const [form, setForm] = useState({

        orden: '',
        predio_id: '',
        predio_nombre: '',
        contrato: '',
        fecha: '',
        empresa_persona: '',
        rut: '',
        valor_renta: '',
        renta_id: '',
        renta_nombre: '',
        fecha_vencimiento: '',
        vigencia_contrato: '',
        doe_respuesta_b5: '',
        observaciones: '',
        uuid: ''
    
  });

const set = (k: string, v: string) => {
  setForm(f => ({ ...f, [k]: v }));

  // validación en tiempo real
  setErrors(prev => ({
    ...prev,
    [k]: v.trim() ? '' : 'Campo obligatorio'
  }));
};

  // Cargar datos
  useEffect(() => {
    if (!uuid) return;

    const cargar = async () => {
      try {
        setLoadingData(true);

        const { data } = await api.get(`/api/contratos/${uuid}`);
        const b = data.data ?? data;

        setForm({
            orden: String(b.orden ?? ''),
            predio_id: String(b.predio_id ?? ''),
            predio_nombre: String(b.predio_nombre ?? ''),
            contrato: b.contrato ?? '',
            fecha: b.fecha ?? '',
            empresa_persona: b.empresa_persona ?? '',
            rut: b.rut ?? '',
            valor_renta: String(b.valor_renta ?? ''),
            renta_id: String(b.renta_id ?? ''),
            renta_nombre: String(b.renta_nombre ?? ''),
            fecha_vencimiento: b.fecha_vencimiento ?? '',
            vigencia_contrato: b.vigencia_contrato ?? '',
            doe_respuesta_b5: b.doe_respuesta_b5 ?? '',
            observaciones: b.observaciones ?? '',
            uuid: b.uuid ?? ''
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

    if (!form.predio_id) errsFront.predio_id = 'Debe ingresar el predio.';
    if (!form.contrato) errsFront.contrato = 'El tipo de contrato es obligatorio.';
    if (!form.fecha) errsFront.fecha = 'La fecha es obligatoria.';
    if (!form.empresa_persona) errsFront.empresa_persona = 'Debe ingresar la empresa o persona.';
    if (!form.rut) {
    errsFront.rut = 'El RUT es obligatorio.';
    } else if (!validarRut(form.rut)) {
      errsFront.rut = 'El RUT no es válido.';
    }
    if (!form.valor_renta) errsFront.valor_renta = 'El valor de renta es obligatorio.';
    if (!form.renta_id) errsFront.renta_id = 'Debe seleccionar el tipo de renta.';
    if (!form.fecha_vencimiento) errsFront.fecha_vencimiento = 'La fecha de vencimiento es obligatoria.';
    if (!form.vigencia_contrato) errsFront.vigencia_contrato = 'La vigencia del contrato es obligatoria.';
    if (!form.doe_respuesta_b5) errsFront.doe_respuesta_b5 = 'Debe ingresar el DOE B.5.';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

        formData.append('predio_id', String(form.predio_id));
        formData.append('contrato', form.contrato);
        formData.append('fecha', form.fecha);
        formData.append('empresa_persona', form.empresa_persona);
        formData.append('rut', form.rut);
        formData.append('valor_renta', String(form.valor_renta));
        formData.append('renta_id', String(form.renta_id));
        formData.append('fecha_vencimiento', form.fecha_vencimiento);
        formData.append('vigencia_contrato', form.vigencia_contrato);
        formData.append('doe_respuesta_b5', form.doe_respuesta_b5);
        form.observaciones != null && formData.append('observaciones', String(form.observaciones));

      await api.post(
        `/api/contratos/${uuid}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Actualizado correctamente');

      setTimeout(() => {
        router.push('/predio/contratos');
      }, 800);

    } catch (err: any) {
      toast.error(
        err.response?.data?.message ?? 'Error al actualizar'
      );
    } finally {
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
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>Editar contratos</h2>
          </div>
          <Link href={`/predio/contratos/`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1a2e22', textDecoration: 'none', background: 'linear-gradient(135deg,#8a6a18,#d4a832)', boxShadow: '0 4px 14px rgba(201,168,76,.3)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} onMouseLeave={e => (e.currentTarget.style.filter = '')}>
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

            {/* SECCIÓN 1 — GENERAL */}
            <Section>
              <SecTitle label="Información General" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
              
                {/* hook PREDIO */}
                <Field label="Predio" error={errors.predio_id}>
                  <FSelect
                    value={form.predio_id}
                    onChange={e => set('predio_id', e.target.value)}
                  >
                    <option value="">
                      {loadingPredios
                        ? 'Cargando...'
                        : errorPredios
                        ? errorPredios
                        : 'Seleccione'}
                    </option>

                    {predios.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </FSelect>
                </Field>

                <Field label="Contrato" error={errors.contrato}>
                  <FInput
                    value={form.contrato}
                    onChange={e => set('contrato', e.target.value)}
                  />
                </Field>

                <Field label="Fecha" error={errors.fecha}>
                  <FInput
                    type="date"
                    value={form.fecha}
                    onChange={e => set('fecha', e.target.value)}
                  />
                </Field>

                <Field label="Empresa o Persona" error={errors.empresa_persona}>
                  <FInput
                    value={form.empresa_persona}
                    onChange={e => set('empresa_persona', e.target.value)}
                  />
                </Field>

                <Field label="RUT" error={errors.rut}>
                    <FInput
                      value={form.rut}
                      onChange={e => {
                        const value = formatearRut(e.target.value);
                        set('rut', value);

                        if (value.length > 7) {
                          if (!validarRut(value)) {
                            setErrors(prev => ({ ...prev, rut: 'RUT inválido' }));
                          } else {
                            setErrors(prev => ({ ...prev, rut: '' }));
                          }
                        }
                      }}
                    />
                </Field>
                <Field label="Valor Renta ($)" error={errors.valor_renta}>
                  <FInputMoney value={form.valor_renta} onChange={e => set('valor_renta', e.target.value)} />
                </Field>
                {/* <Field label="Valor Renta ($)" error={errors.valor_renta}>
                    <FInput
                        type="text"
                        value={
                        form.valor_renta
                            ? Number(form.valor_renta).toLocaleString('es-CL')
                            : ''
                        }
                        onChange={e => {
                        const rawValue = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                        set('valor_renta', rawValue);
                        }}
                        placeholder="$ 0"
                    />
               </Field>*/}

                <Field label="Tipo Renta" error={errors.renta_id}>
                  <FSelect
                    value={form.renta_id}
                    onChange={e => set('renta_id', e.target.value)}
                  >
                    <option value="">
                      {loadingTipoRenta
                        ? 'Cargando...'
                        : errorTipoRenta
                        ? errorTipoRenta
                        : 'Seleccione'}
                    </option>

                    {TipoRenta.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </FSelect>
                </Field>

                <Field label="Fecha Vencimiento" error={errors.fecha_vencimiento}>
                  <FInput
                    type="date"
                    value={form.fecha_vencimiento}
                    onChange={e => set('fecha_vencimiento', e.target.value)}
                  />
                </Field>

                <Field label="Vigencia Contrato" error={errors.vigencia_contrato}>
                  <FInput
                    value={form.vigencia_contrato}
                    onChange={e => set('vigencia_contrato', e.target.value)}
                    placeholder="Ej: 12 meses"
                  />
                </Field>
              </div>
              </Section>

              {/*<Section>
              <SecTitle label="Otros" />              
                <Field label="DOE de respuesta B.5 por pago de factura" error={errors.doe_respuesta_b5}>
                    <FInput value={form.doe_respuesta_b5} onChange={e => set('doe_respuesta_b5', e.target.value)} />
                </Field>
                <div style={{ marginTop: 16 }}>
                    <Field label="Observación">
                    <textarea
                        value={form.observaciones}
                        onChange={e => set('observaciones', e.target.value)}
                        style={{ ...inputStyle, minHeight: 80 }}
                    />
                    </Field>
                </div>
              </Section>*/}
            <Section>
                <SecTitle label="Otros" />
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                    <Field label="DOE DE RESPUESTA B.5 POR PAGO" required error={errors.doe_respuesta_b5}>
                      <FInput value={form.doe_respuesta_b5} onChange={e => set('doerespuesta', e.target.value)} required /></Field>
                        <Field label="observaciones">
                        <textarea
                            value={form.observaciones}
                            onChange={e => set('observaciones', e.target.value)}
                            style={{ ...inputStyle, minHeight: 80 }}
                        />
                        </Field>
                  </div>             
            </Section>              
            

            {/* FOOTER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 12, padding: '20px 28px',
                          background: 'rgba(0,0,0,.03)', borderTop: '1px solid rgba(0,0,0,.06)' }}>
              <p style={{ fontSize: '.65rem', color: '#9ab8a2', fontFamily: 'monospace' }}>
                <span style={{ color: '#fca5a5' }}>*</span> Campos obligatorios
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link href="/predio/contratos"
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
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>  

            </div>
            
        </form>
      </div>
    </>
  );
}

export default function EditarContratosPage() {
  return <Suspense><EditarContratosPageInner /></Suspense>;
}