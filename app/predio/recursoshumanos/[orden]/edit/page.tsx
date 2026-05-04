'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';


import DocumentosAdjuntos, { DocAdjunto, DocGuardado } from '@/components/DocAdjParqueVehicular';
import { usePredio } from '@/hooks/usePredio';
import { useTipoGrado } from '@/hooks/useTipoGrado';
import { useTipoContrato } from '@/hooks/useTipoContrato';


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


function EditarParqueVehicularPageInner() {
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
    const { tipoGrado, loading: loadingTipoGrado, error: errorTipoGrado } = useTipoGrado();    
    const { tipoContrato, loading: loadingTipoContrato, error: errorTipoContrato } = useTipoContrato();
    
    const [form, setForm] = useState({

        id: '',
        orden: '',
        uuid: '',

        predio_id: '',
        predio_nombre: '',

        grado_id: '',
        grado_nombre:'',

        tipo_contrato_id: '',
        tipo_contrato_nombre:'', 
        nombres_apellidos: '',
        rut: '',

        cargo_contratado: '',
        area_funciones: '',
        funcion_actual: '',

        fecha_inicio_contrato: '',
        anios_servicio: '',
        ultima_calificacion: '',

        capacitado_prevencion_riesgo: ''
    
  });

  const set = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  // Cargar datos
  useEffect(() => {
    if (!uuid) return;

    const cargar = async () => {
      try {
        setLoadingData(true);
        console.log('Esto es el resultado : ', uuid);
        const { data } = await api.get(`/api/recursoshumanos/${uuid}`);
        const b = data.data ?? data;

        setForm({
                id: String(b.id ?? ''),
                orden: String(b.orden ?? ''),
                uuid: b.uuid ?? '',

                // IMPORTANTE: usar IDs reales, no nombres
                predio_id: String(b.predio_id ?? ''),
                predio_nombre: String(b.predio_nombre ?? ''),

                grado_id: String(b.grado_id ?? ''),
                grado_nombre: String(b.grado_nombre ?? ''),

                tipo_contrato_id: String(b.tipo_contrato_id ?? ''),
                tipo_contrato_nombre: String(b.tipo_contrato_nombre ?? ''),

                nombres_apellidos: b.nombres_apellidos ?? '',
                rut: b.rut ?? '',

                cargo_contratado: b.cargo_contratado ?? '',
                area_funciones: b.area_funciones ?? '',
                funcion_actual: b.funcion_actual ?? '',

                fecha_inicio_contrato: b.fecha_inicio_contrato ?? '',
                anios_servicio: String(b.anios_servicio ?? ''),

                ultima_calificacion: b.ultima_calificacion ?? '',

                capacitado_prevencion_riesgo: b.capacitado_prevencion_riesgo ? 'si' : 'no'
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


    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        setLoading(true);

        await api.put(`/api/recursoshumanos/update/${uuid}`, {
        predio_id: form.predio_id,
        grado_id: form.grado_id,
        tipo_contrato_id: form.tipo_contrato_id,

        nombres_apellidos: form.nombres_apellidos,
        rut: form.rut,

        cargo_contratado: form.cargo_contratado,
        area_funciones: form.area_funciones,
        funcion_actual: form.funcion_actual,

        fecha_inicio_contrato: form.fecha_inicio_contrato,
        anios_servicio: form.anios_servicio,

        ultima_calificacion: form.ultima_calificacion,

        capacitado_prevencion_riesgo:
            form.capacitado_prevencion_riesgo === 'si' ? 1 : 0
        });

        toast.success('Actualizado correctamente');

        setTimeout(() => {
        router.push('/predio/recursoshumanos');
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
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>Editar recursos humanos</h2>
          </div>
          <Link href={`/predio/recursoshumanos/`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1a2e22', textDecoration: 'none', background: 'linear-gradient(135deg,#8a6a18,#d4a832)', boxShadow: '0 4px 14px rgba(201,168,76,.3)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} onMouseLeave={e => (e.currentTarget.style.filter = '')}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
             {/* SECCIÓN 1 — GENERAL */}
              <Section>
                <SecTitle label="Información General" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>   
                  {/* Predio desde hook */}
                    <Field label="Predio" error={errors.predio}>
                      <FSelect value={form.predio_id} onChange={e => set('predio', e.target.value)}>
                        <option value="">
                          {loadingPredios ? 'Cargando...' : errorPredios ? errorPredios : 'Seleccione'}
                        </option>
                        {predios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </FSelect>
                    </Field>    
                </div>
              </Section>
              {/* SECCIÓN 2 — PERSONAL */}
                <Section>
                  <SecTitle label="Información del Personal" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>

                    <Field label="Nombres y Apellidos" error={errors.nombresApellidos}>
                      <FInput value={form.nombres_apellidos} onChange={e => set('nombresApellidos', e.target.value)} />
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

                    <Field label="Tipo Contrato" error={errors.tipoContrato}>
                      <FSelect
                        value={form.tipo_contrato_id}
                        onChange={e => set('tipoContrato', e.target.value)}
                      >
                        <option value="">
                          {loadingTipoContrato
                            ? 'Cargando...'
                            : errorTipoContrato
                            ? errorTipoContrato
                            : 'Seleccione'}
                        </option>

                        {!loadingTipoContrato &&
                          !errorTipoContrato &&
                          tipoContrato.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                      </FSelect>
                    </Field>

                    <Field label="Grado" error={errors.grado}>
                      <FSelect
                        value={form.grado_id}
                        onChange={e => set('grado', e.target.value)}
                      >
                        <option value="">
                          {loadingTipoGrado
                            ? 'Cargando...'
                            : errorTipoGrado
                            ? errorTipoGrado
                            : 'Seleccione'}
                        </option>

                        {!loadingTipoGrado &&
                          !errorTipoGrado &&
                          tipoGrado.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.descripcion}
                            </option>
                          ))}
                      </FSelect>
                    </Field>

                    <Field label="Cargo Contratado" error={errors.cargoContratado}>
                      <FInput value={form.cargo_contratado} onChange={e => set('cargoContratado', e.target.value)} />
                    </Field>

                    <Field label="Área" error={errors.area}>
                      <FInput value={form.area_funciones} onChange={e => set('area', e.target.value)} />
                    </Field>

                    <Field label="Función Actual" error={errors.funcionActual}>
                      <FInput value={form.funcion_actual} onChange={e => set('funcionActual', e.target.value)} />
                    </Field>

                    <Field label="Fecha Inicio Contrato" error={errors.fechaInicioContrato}>
                      <FInput
                        type="date"
                        value={form.fecha_inicio_contrato}
                        onChange={e => set('fechaInicioContrato', e.target.value)}
                      />
                    </Field>

                    <Field label="Años de Servicio" error={errors.aniosServicio}>
                      <FInput
                        type="number"
                        value={form.anios_servicio}
                        onChange={e => set('aniosServicio', e.target.value)}
                      />
                    </Field>

                    <Field label="Última Calificación" error={errors.ultimaCalificacion}>
                      <FInput value={form.ultima_calificacion} onChange={e => set('ultimaCalificacion', e.target.value)} />
                    </Field>

                    <Field label="Capacitado en Prevención de Riesgo" error={errors.capacitadoPrevencionRiesgo}>
                      <FSelect
                        value={form.capacitado_prevencion_riesgo}
                        onChange={e => set('capacitadoPrevencionRiesgo', e.target.value)}
                      >
                        <option value="">Seleccione</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </FSelect>
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
                <Link href="/predio/parquevehicular"
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

export default function EditarParqueVehicularPage() {
  return <Suspense><EditarParqueVehicularPageInner /></Suspense>;
}