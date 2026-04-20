// app/insumosyproductos/crear/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useAdministrador }    from '@/hooks/useAdministrador';
import { useUso }              from '@/hooks/useUso';
import { toast } from 'sonner';


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
const toOptions = (data: any[] = []) =>
  data.map(d => ({
    value: d.id,
    label: d.nombre,
  }));


// COMPONENTE PRINCIPAL

export default function CrearBienPage() {
  const router      = useRouter();
  const mapRef       = useRef<HTMLDivElement>(null);
  const leaflet      = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const mapInstance  = useRef<any>(null);
  const geoTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
  id: '',
  orden: '',
  predio: '',
  producto_servicio: '',
  empresa_cotizacion: '',
  etapa_compra: '',
  numero_orden_compra: '',
  estado_orden_compra: '',
  fecha_orden_compra: '',
  valor_total_orden: '',
  numero_factura: '',
  fecha_factura: '',
  proveedor: '',
  estado_factura: '',
  doerespuesta: '',
  observacion: '',
  fecha_cotizacion: '',
  valor_cotizacion: '',
  tipo_compra: '',

  });


    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const { administrador, loading: loadingAdministrador } = useAdministrador();
    const { uso, loading: loadingUso } = useUso();
    const [errors,  setErrors]  = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const [predios, setPredios] = useState<any[]>([]);
    const [tiposCompra, setTiposCompra] = useState<any[]>([]);
    const [estadosOC, setEstadosOC] = useState<any[]>([]);
    const [estadosFactura, setEstadosFactura] = useState<any[]>([]);


  /* CARGA COMBOX TIPO COMPRA - ESTADO O.C - ESTADO FACTURA - LISTADO PREDIO */
  useEffect(() => {
    const cargarCombos = async () => {
      try {
        const [tc, oc, ef, pr] = await Promise.all([
          api.get('/api/estados/tipoCompra'),
          api.get('/api/estados/estadoOC'),
          api.get('/api/estados/estadoFactura'),
          api.get('/api/listaPredio'),
        ]);

        setTiposCompra(tc.data);
        setEstadosOC(oc.data);
        setEstadosFactura(ef.data);
        setPredios(pr.data);

      } catch (error) {
        console.error(error);
      }
    };
    cargarCombos();
  }, []);





    //  Submit 
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errsFront: Record<string, string> = {};

    // ───── INFORMACIÓN GENERAL ─────        
    //if (!form.predio) errsFront.predio = 'El predio es obligatorio.';
    if (!form.producto_servicio) errsFront.producto_servicio = 'Debe indicar producto o servicio.';

    // ───── COTIZACIÓN ─────
    if (!form.empresa_cotizacion) errsFront.empresa_cotizacion = 'La empresa es obligatoria.';
    if (!form.fecha_cotizacion) errsFront.fecha_cotizacion = 'La fecha de cotización es obligatoria.';
    if (!form.valor_cotizacion || Number(form.valor_cotizacion) === 0)
      errsFront.valor_cotizacion = 'El valor de cotización es obligatorio.';

    // ───── COMPRA ─────
    if (!form.tipo_compra) errsFront.tipo_compra = 'Debe seleccionar tipo de compra.';
    if (!form.etapa_compra) errsFront.etapa_compra = 'Debe indicar la etapa de compra.';

    // ───── ORDEN DE COMPRA ─────
    if (!form.numero_orden_compra) errsFront.numero_orden_compra = 'El número de orden de compra es obligatorio.';
    if (!form.estado_orden_compra) errsFront.estado_orden_compra = 'Debe seleccionar estado de la orden.';
    if (!form.fecha_orden_compra) errsFront.fecha_orden_compra = 'La fecha de orden de compra es obligatoria.';
    if (!form.valor_total_orden || Number(form.valor_total_orden) === 0)
      errsFront.valor_total_orden = 'El valor total de la orden es obligatorio.';

    // ───── FACTURA ─────
    if (!form.numero_factura) errsFront.numero_factura = 'El número de factura es obligatorio.';
    if (!form.fecha_factura) errsFront.fecha_factura = 'La fecha de factura es obligatoria.';
    if (!form.proveedor) errsFront.proveedor = 'El proveedor es obligatorio.';
    if (!form.estado_factura) errsFront.estado_factura = 'Debe seleccionar estado de la factura.';

    // ───── DOE ─────
    if (!form.doerespuesta) errsFront.doerespuesta = 'El DOE es obligatorio.';

    // ───── VALIDACIÓN FINAL ─────
    if (Object.keys(errsFront).length > 0) {
      setErrors(errsFront);

      toast.error(Object.values(errsFront)[0], { duration: 5000 });

      const primerCampo = Object.keys(errsFront)[0];
      document
        .querySelector(`[data-field="${primerCampo}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return;
    }

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value ?? '');
      });

      await api.post('/api/insumosproducto/insert', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Guardado correctamente');
      setTimeout(() => {
        router.push('/predio/insumosproductos'); 
      }, 1000);

    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al guardar', {
        duration: 5000,
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
                Gestión Predio Agrícola
              </span>
            </div>
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                          fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                          letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
              Nuevo Adquisición de insumos y productos
            </h2>
            <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
              Complete la información de la ficha de Adquisición de insumos y productos
            </p>
          </div>
          <Link href="/predio/insumosproductos"
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

            {/* ───────────────────────────── */}
            {/* SECCIÓN 1 — GENERAL */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Información General" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
            
                <Field label="Predio" error={errors.predio}>
                  <FSelect
                    value={form.predio}
                    onChange={(e: any) => set('predio', e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {toOptions(predios).map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </FSelect>
                </Field>               
                
                <Field label="Producto / Servicio" error={errors.producto_servicio}>
                    <FInput value={form.producto_servicio} onChange={e => set('producto_servicio', e.target.value)} />
                </Field>

            </div>
            </Section>

            {/* ───────────────────────────── */}
            {/* SECCIÓN 2 — COTIZACIÓN */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Cotización" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                
                <Field label="Empresa" error={errors.empresa_cotizacion}>
                <FInput value={form.empresa_cotizacion} onChange={e => set('empresa_cotizacion', e.target.value)} />
                </Field>

                <Field label="Fecha" error={errors.fecha_cotizacion}>
                <FInput type="date" value={form.fecha_cotizacion} onChange={e => set('fecha_cotizacion', e.target.value)} />
                </Field>

                <Field label="Valor" error={errors.valor_cotizacion}>
                <FInputMoney value={form.valor_cotizacion} onChange={e => set('valor_cotizacion', e.target.value)} />
                </Field>

            </div>
            </Section>

            {/* ───────────────────────────── */}
            {/* SECCIÓN 3 — COMPRA */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Compra" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                
                <Field label="Tipo Compra" error={errors.tipo_compra}>
                  <FSelect
                    value={form.tipo_compra}
                    onChange={e => set('tipo_compra', e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {toOptions(tiposCompra).map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </FSelect>
                </Field>

                <Field label="Etapa" error={errors.etapa_compra}>
                <FInput value={form.etapa_compra} onChange={e => set('etapa_compra', e.target.value)} />
                </Field>

            </div>
            </Section>

            {/* ───────────────────────────── */}
            {/* SECCIÓN 4 — ORDEN DE COMPRA */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Orden de Compra" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                
                <Field label="N° Orden" error={errors.numero_orden_compra}>
                <FInput value={form.numero_orden_compra} onChange={e => set('numero_orden_compra', e.target.value)} />
                </Field>

                <Field label="Estado" error={errors.estado_orden_compra}>
                  <FSelect
                      value={form.estado_orden_compra}
                      onChange={e => set('estado_orden_compra', e.target.value)}
                    >
                      <option value="">Seleccione</option>
                      {toOptions(estadosOC).map(o => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                  </FSelect>
                </Field>

                <Field label="Fecha" error={errors.fecha_orden_compra}>
                <FInput type="date" value={form.fecha_orden_compra} onChange={e => set('fecha_orden_compra', e.target.value)} />
                </Field>

                <Field label="Valor Total" error={errors.valor_total_orden}>
                <FInputMoney value={form.valor_total_orden} onChange={e => set('valor_total_orden', e.target.value)} />
                </Field>

            </div>
            </Section>

            {/* ───────────────────────────── */}
            {/* SECCIÓN 5 — FACTURA */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Factura" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                
                <Field label="N° Factura" error={errors.numero_factura}>
                <FInput value={form.numero_factura} onChange={e => set('numero_factura', e.target.value)} />
                </Field>

                <Field label="Fecha" error={errors.fecha_factura}>
                <FInput type="date" value={form.fecha_factura} onChange={e => set('fecha_factura', e.target.value)} />
                </Field>

                <Field label="Proveedor" error={errors.proveedor}>
                <FInput value={form.proveedor} onChange={e => set('proveedor', e.target.value)} />
                </Field>

                <Field label="Estado" error={errors.estado_factura}>
                  <FSelect
                    value={form.estado_factura}
                    onChange={e => set('estado_factura', e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    {toOptions(estadosFactura).map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </FSelect>
                </Field>

            </div>
            </Section>

            {/* ───────────────────────────── */}
            {/* SECCIÓN 6 — OTROS */}
            {/* ───────────────────────────── */}
            <Section>
            <SecTitle label="Otros" />
            
            <Field label="DOE de respuesta B.5 por pago de factura" error={errors.doerespuesta}>
                <FInput value={form.doerespuesta} onChange={e => set('doerespuesta', e.target.value)} />
            </Field>

            <div style={{ marginTop: 16 }}>
                <Field label="Observación">
                <textarea
                    value={form.observacion}
                    onChange={e => set('observacion', e.target.value)}
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
                <Link href="/predio/insumosproductos"
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
                  {loading ? 'Guardando...' : 'Guardar insumos y productos'}
                </button>
              </div>
            </div>

          </div>
            
        </form>
      </div>
    </>
  );
}