// app/parquevehicular/crear/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAdministrador }    from '@/hooks/useAdministrador';
import { useUso }              from '@/hooks/useUso';
import { toast } from 'sonner';
import DocumentosAdjuntos, { DocAdjunto } from '@/components/DocAdjParqueVehicular';

import { usePredio } from '@/hooks/usePredio';
import { useTipoVehiculo } from '@/hooks/useTipoVehiculo';

// ESTILOS REUTILIZABLES
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
// SUBCOMPONENTES
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

// COMPONENTE PRINCIPAL

export default function CrearParqueVehicularPage() {
  const router      = useRouter();
  const mapRef       = useRef<HTMLDivElement>(null);
  const leaflet      = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const mapInstance  = useRef<any>(null);
  const geoTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({

    orden: '',
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
    //permiso_circulacion_img: '',
    //seguro_obligatorio_img: ''

  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { administrador, loading: loadingAdministrador } = useAdministrador();
  const { uso, loading: loadingUso } = useUso();
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const { predios, loading: loadingPredios, error: errorPredios } = usePredio();
  const { tipoVehiculo, loading: loadingTipoVehiculo, error: errorTipoVehiculo } = useTipoVehiculo();
  


  // DATA PARA ADJUNTAR ARCHIVOS //
  const [docsPermiso, setDocsPermiso] = useState<DocAdjunto[]>([]);
  const [docsSeguro, setDocsSeguro] = useState<DocAdjunto[]>([]);

//  Submit 
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const errsFront: Record<string, string> = {};

      // VALIDACIONES
      if (!form.predio) errsFront.predio = 'Debe seleccionar predio.';
      if (!form.tipo_vehicular) errsFront.tipo_vehiculo = 'Debe seleccionar tipo de vehículo.';
      if (!form.ppu) errsFront.ppu = 'La PPU es obligatoria.';
      if (!form.sigla_institucional) errsFront.sigla_institucional = 'Debe ingresar sigla institucional'
      if (!form.marca) errsFront.marca = 'La marca es obligatoria.';
      if (!form.modelo) errsFront.modelo = 'El modelo es obligatorio.';
      if (!form.anio) errsFront.anio = 'El año es obligatorio.';
      if (!form.fecha_adquisicion) errsFront.fecha_adquisicion = 'La fecha adquisición es obligatoria.';
      if (!form.fondo_adquisicion) errsFront.fondo_adquisicion = 'Debe ingresar el fondo de aquisición.'
      if (!docsPermiso.length) errsFront.docsPermiso = 'Debe adjuntar permiso.';
      if (!docsSeguro.length) errsFront.docsSeguro = 'Debe adjuntar seguro.';


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
      setLoading(true);
      setErrors({});

      const toastId = toast.loading('Guardando parque vehicular...');

      try 
        {
          const fd = new FormData();

          // Campos
          Object.entries(form).forEach(([k, v]) => {
            fd.append(k, v);
          });

          // Documentos permiso
          docsPermiso.forEach((d, i) => {
            fd.append(`permiso[${i}][archivo]`, d.archivo);
            fd.append(`permiso[${i}][tipo_documento_id]`, d.tipoId);
          });

          // Documentos seguro
          docsSeguro.forEach((d, i) => {
            fd.append(`seguro[${i}][archivo]`, d.archivo);
            fd.append(`seguro[${i}][tipo_documento_id]`, d.tipoId);
          });

          await api.post('/api/parquevehicular/insert', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          
          toast.success('Parque vehicular registrado correctamente', {
            id: toastId,
            duration: 3000,
          });

          setTimeout(() => {
            router.push('/predio/parquevehicular');
          }, 1500);

        } 
        catch (err: any) {
          const errorsData = err.response?.data?.errors as Record<string, string[]> | undefined;

          if (errorsData) {
            const mapped: Record<string, string> = {};
            Object.entries(errorsData).forEach(([k, v]) => {
              mapped[k] = v[0];
            });

            setErrors(mapped);

            const primerCampo = Object.keys(errorsData)[0];
            const primerMensaje = errorsData[primerCampo][0];

            toast.error(primerMensaje, { id: toastId });

            document
              .querySelector(`[data-field="${primerCampo}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

          } else {
            toast.error(err.response?.data?.message ?? 'Error al guardar', {
              id: toastId,
            });
          }
        } 
        finally {
          setLoading(false);
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
                Gestión Predio Agrícola
              </span>
            </div>
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                          fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                          letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
              Nuevo Parque Vehicular
            </h2>
            <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
              Complete la información de la ficha de parque vehicular
            </p>
          </div>
          <Link href="/predio/parquevehicular"
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

                  
            {/* VEHÍCULO */}        
            <Section>
                <SecTitle label="Parque Vehicular" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
   
                    <Field label="Predio" error={errors.predio}>
                      <FSelect value={form.predio} onChange={e => set('predio', e.target.value)}>
                        <option value="">
                          {loadingPredios ? 'Cargando...' : errorPredios ? errorPredios : 'Seleccione'}
                        </option>
                        {predios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
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
                            docs={docsPermiso}
                            onChange={setDocsPermiso} 
                            tipoFiltro="1" // Permiso
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
                            docs={docsSeguro}
                            onChange={setDocsSeguro} 
                            tipoFiltro="2" // Seguro
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
                {loading ? 'Guardando...' : 'Guardar parque vehicular'}
            </button>
            </div>

            </div>
            
        </form>
      </div>
    </>
  );
}