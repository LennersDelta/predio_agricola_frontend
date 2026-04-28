'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';


import DocumentosAdjuntos, { DocAdjunto, DocGuardado } from '@/components/DocAdjParqueVehicular';
import { usePredio } from '@/hooks/usePredio';
import { useTipoVehiculo } from '@/hooks/useTipoVehiculo';


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
    const { tipoVehiculo, loading: loadingTipoVehiculo, error: errorTipoVehiculo } = useTipoVehiculo();

    // DATA PARA ADJUNTAR ARCHIVOS //

    const [docsPermiso, setDocsPermiso] = useState<DocGuardado[]>([]);
    const [docsSeguro, setDocsSeguro] = useState<DocGuardado[]>([]);

    const [docsLocalPermiso, setDocsLocalPermiso] = useState<DocAdjunto[]>([]);
    const [docsLocalSeguro, setDocsLocalSeguro] = useState<DocAdjunto[]>([]);


    const [form, setForm] = useState({

      orden:  '',
      predio: '',
      tipo_vehicular: '',
      ppu: '',
      sigla_institucional: '',
      marca: '',
      modelo: '',
      anio: '',

      fecha_adquisicion: '',
      fondo_adquisicion: '', 
      vencimiento_permiso: '',
      vencimiento_seguro: '',
      ultima_mantencion: '',

      permiso_img: '',
      seguro_img:'',
    
  });

  const set = (k: string, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  // Cargar datos
  useEffect(() => {
    if (!uuid) return;

    const cargar = async () => {
      try {
        setLoadingData(true);

        const { data } = await api.get(`/api/parquevehicular/${uuid}`);
        const b = data.data ?? data;

        setForm({
          orden: String(b.orden ?? ''),
          predio: String(b.predio ?? ''),
          tipo_vehicular: String(b.tipo_vehicular_id ?? ''),
          ppu: b.ppu ?? '',
          sigla_institucional: b.sigla_institucional ?? '',
          marca: b.marca ?? '',
          modelo: b.modelo ?? '',
          anio: String(b.anio ?? ''),
          fecha_adquisicion: b.fecha_adquisicion ?? '',
          fondo_adquisicion: b.fondo_adquisicion ?? '',
          vencimiento_permiso: b.vencimiento_permiso_circulacion ?? '',
          vencimiento_seguro: b.vencimiento_seguro_obligatorio ?? '',
          ultima_mantencion: b.ultima_mantencion ?? '',
          permiso_img: b.permiso_circulacion_img ?? '',
          seguro_img: b.seguro_obligatorio_img ?? '',
        });

    // documentos existentes

    if (b.permiso_circulacion_url) {
      setDocsPermiso([
        {
          id: 1,
          uuid: uuid,
          nombre_original: b.permiso_circulacion_url?.split('/').pop() || 'Permiso',
          mime_type:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          peso: 0,
          url: b.permiso_circulacion_url,
          tipo_id: 1,
          tipo_label: 'Permiso Circulación',
          permiso_img: b.permiso_circulacion_img,
          seguro_img: '',
        }
      ]);
    }

    if (b.seguro_obligatorio_url) {
      setDocsSeguro([
        {
          id: 2,
          uuid: uuid,
          nombre_original: b.seguro_obligatorio_url?.split('/').pop() || 'Seguro',
          mime_type:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          peso: 0,
          url: b.seguro_obligatorio_url,
          tipo_id: 2,
          tipo_label: 'Seguro Obligatorio',
          permiso_img: '',
          seguro_img: b.seguro_obligatorio_img,
        }
      ]);
    }



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

    const formData = new FormData();

    // campos normales
    formData.append('predio', form.predio);
    formData.append('tipo_vehicular', form.tipo_vehicular);
    formData.append('ppu', form.ppu);
    formData.append('sigla_institucional', form.sigla_institucional);
    formData.append('marca', form.marca);
    formData.append('modelo', form.modelo);
    formData.append('anio', form.anio);

    formData.append('fecha_adquisicion', form.fecha_adquisicion);
    formData.append('fondo_adquisicion', form.fondo_adquisicion);

    formData.append('vencimiento_permiso', form.vencimiento_permiso);
    formData.append('vencimiento_seguro', form.vencimiento_seguro);
    formData.append('ultima_mantencion', form.ultima_mantencion);


    // Archivos nuevos
    if (docsLocalPermiso?.length > 0 && docsLocalPermiso[0]?.archivo) {
      formData.append(
        'permiso[0][archivo]',
        docsLocalPermiso[0].archivo
      );
    }

    if (docsLocalSeguro?.length > 0 && docsLocalSeguro[0]?.archivo) {
      formData.append(
        'seguro[0][archivo]',
        docsLocalSeguro[0].archivo
      );
    }


    await api.post(
      `/api/parquevehicular/${uuid}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    toast.success('Actualizado correctamente');

    setTimeout(() => {
      router.push('/predio/parquevehicular');
    }, 800);

  } catch (err:any) {
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
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>Editar parque vehicular</h2>
          </div>
          <Link href={`/predio/parquevehicular/`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#1a2e22', textDecoration: 'none', background: 'linear-gradient(135deg,#8a6a18,#d4a832)', boxShadow: '0 4px 14px rgba(201,168,76,.3)' }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')} onMouseLeave={e => (e.currentTarget.style.filter = '')}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>

            {/* SECCIÓN 1 */}
            <Section>
              <SecTitle label="Información General" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                    <Field label="Predio" required error={errors.predio}>
                        <FSelect
                            value={form.predio}
                            onChange={(e) => set('predio', e.target.value)}
                            disabled={loadingPredios}
                        >
                            <option value="" disabled>
                            {loadingPredios ? 'Cargando...' : errorPredios ? errorPredios : 'Seleccione'}
                            </option>

                            {predios.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                            ))}
                        </FSelect>
                    </Field>

                    <Field label="Tipo Vehiculo" error={errors.tipo_vehicular}>
                      <FSelect
                        value={form.tipo_vehicular}
                        onChange={e => set('tipo_vehicular', e.target.value)}
                      >
                        <option value="">
                          {loadingTipoVehiculo
                            ? 'Cargando...'
                            : errorTipoVehiculo
                            ? errorTipoVehiculo
                            : 'Seleccione'}
                        </option>

                        {!loadingTipoVehiculo &&
                          !errorTipoVehiculo &&
                          tipoVehiculo.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                      </FSelect>
                    </Field>  
                    <Field label="PPU" error={errors.ppu}>
                        <FInput
                        value={form.ppu}
                        onChange={e =>
                            set('ppu', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                        }
                        />
                    </Field>          
                    <Field label="Sigla Institucional" error={errors.sigla_institucional}>
                        <FInput
                        value={form.sigla_institucional}
                        onChange={e => set('sigla_institucional', e.target.value)}
                        />
                    </Field>  
                    <Field label="Marca" error={errors.marca}>
                        <FInput value={form.marca} onChange={e => set('marca', e.target.value)} />
                    </Field>

                    <Field label="Modelo" error={errors.modelo}>
                        <FInput value={form.modelo} onChange={e => set('modelo', e.target.value)} />
                    </Field>    

                    <Field label="Año" error={errors.anio}>
                        <FInput type="number" value={form.anio} onChange={e => set('anio', e.target.value)} />
                    </Field>

                    <Field label="Fecha Adquisición" error={errors.fecha_adquisicion}>
                        <FInput type="date" value={form.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)} />
                    </Field>

                    <Field label="Fondos Adquisición" error={errors.fondo_adquisicion}>
                        <FInput value={form.fondo_adquisicion} onChange={e => set('fondo_adquisicion', e.target.value)} />
                    </Field>                                                                  
                </div>
            </Section>
            {/* PERMISO */}
            <Section>
                <SecTitle label="Permiso Circulación / Seguro Obligatorio" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                
                    <Field label="Venc. Permiso Circulación">
                        <FInput
                        type="date"
                        value={form.vencimiento_permiso}
                        onChange={e => set('vencimiento_permiso', e.target.value)}
                        />
                    </Field>

                    <div style={{ gridColumn: '1 / -1' }} data-field="docsPermiso">
                      <DocumentosAdjuntos
                        docs={docsLocalPermiso}
                        onChange={setDocsLocalPermiso}
                        docsGuardados={docsPermiso}
                        onDocsGuardadosChange={setDocsPermiso}
                        tipoFiltro="1"
                      />
                    </div>
                    <Field label="Venc. Seguro Obligatorio">
                        <FInput
                        type="date"
                        value={form.vencimiento_seguro}
                        onChange={e => set('vencimiento_seguro', e.target.value)}
                        />
                    </Field>
                    <div style={{ gridColumn: '1 / -1' }} data-field="docsSeguro">
                      <DocumentosAdjuntos
                        docs={docsLocalSeguro}   // o el state real
                        onChange={setDocsLocalSeguro}
                        docsGuardados={docsSeguro}
                        onDocsGuardadosChange={setDocsSeguro}
                        tipoFiltro="2"
                      />
                    </div>                    

            {/* SEGURO */}
           
                    <Field label="Última Mantención">
                        <FInput
                        type="date"
                        value={form.ultima_mantencion}
                        onChange={e => set('ultima_mantencion', e.target.value)}
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