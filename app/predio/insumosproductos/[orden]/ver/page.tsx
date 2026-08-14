'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

import { toast } from 'sonner';

import { useEstados } from '@/hooks/useEstado';
import { usePredio } from '@/hooks/usePredio';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8,
  color: '#1a2e22',
  fontSize: '.82rem',
  padding: '9px 13px',
  outline: 'none',
  fontFamily: '"Barlow",sans-serif',
  appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};
const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'rgba(58,153,86,.04)',
  border: '1px solid rgba(58,153,86,.15)',
  color: '#2e4938',
  cursor: 'default',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.58rem',
  fontWeight: 600,
  color: '#9ab8a2',
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  marginBottom: 5,
  fontFamily: 'monospace',
};
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div data-field={label}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
function FInput({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      readOnly
      style={readOnlyStyle}
    />
  );
}
function FInputMoney({
  value,
}: {
  value: string | number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          left: 11,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '.78rem',
          color: '#6b8f75',
          fontFamily: 'monospace',
          fontWeight: 600,
          pointerEvents: 'none',
          zIndex: 1,
          lineHeight: 1,
        }}
      >
        $
      </span>

      <input
        type="text"
        value={value}
        readOnly
        style={{
          ...readOnlyStyle,
          paddingLeft: 22,
          fontWeight: 600,
        }}
      />
    </div>
  );
}
function FSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      disabled
      style={{
        ...readOnlyStyle,
        paddingRight: 34,
        cursor: 'default',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 11px center',
        opacity: 1,
      }}
    >
      {children}
    </select>
  );
}
function SecTitle({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: 'linear-gradient(180deg,#3aaf64,#3a9956)',
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontFamily: '"Barlow Condensed",sans-serif',
          fontSize: '.8rem',
          fontWeight: 700,
          color: '#2e7d46',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}
      >
        {label}
      </span>
    </div>
  );
}
function Section({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '26px 28px',
        borderBottom: '1px solid rgba(0,0,0,.06)',
      }}
    >
      {children}
    </div>
  );
}

function VerInsumoProductoPageInner() {
  const params = useParams();

  const orden = Array.isArray(params?.orden)
    ? params.orden[0]
    : params?.orden;

  const [loadingData, setLoadingData] = useState(true);
  const [cargando, setCargando] = useState(true);

  const {
    estados: TipoCompra,
    loading: loadingTipoCompra,
    error: errorTipoCompra,
  } = useEstados('tipoCompra');

  const {
    estados: OrdenCompra,
    loading: loadingOrdenCompra,
    error: errorOrdenCompra,
  } = useEstados('estadoOC');

  const {
    estados: EstadoFactura,
    loading: loadingEstadosFactura,
    error: errorEstadosFactura,
  } = useEstados('estadoFactura');

  const {
    predios,
    loading: loadingPredios,
    error: errorPredios,
  } = usePredio();

  const [form, setForm] = useState({
    id: '',
    orden: '',
    uuid: '',

    predio: '',

    producto_servicio: '',
    empresa: '',

    fecha_cotizacion: '',
    valor_cotizacion: '',

    tipo_compra: '',
    etapa: '',

    numero_orden: '',
    estado_orden: '',
    fecha_orden: '',
    valor_total: '',

    numero_factura: '',
    fecha_factura: '',

    proveedor: '',
    estado_factura: '',

    doerespuesta: '',
    observaciones: '',
  });

  useEffect(() => {
    if (!orden) return;

    const cargar = async () => {
      try {
        setLoadingData(true);

        const { data } = await api.get(
          `/api/insumosproducto/${orden}`
        );

        const b = data.data ?? data;

        setForm({
          id: String(b.id ?? ''),
          orden: String(b.orden ?? ''),
          uuid: b.uuid ?? '',

          predio: String(
            b.predio_id ??
            b.predio ??
            ''
          ),

          producto_servicio:
            b.producto_servicio ?? '',

          empresa:
            b.empresa ?? '',

          fecha_cotizacion:
            b.fecha_cotizacion ?? '',

          valor_cotizacion:
            String(b.valor_cotizacion ?? ''),

          tipo_compra:
            String(b.tipo_compra ?? ''),

          etapa:
            b.etapa ?? '',

          numero_orden:
            b.numero_orden ?? '',

          estado_orden:
            String(b.estado_orden ?? ''),

          fecha_orden:
            b.fecha_orden ?? '',

          valor_total:
            String(b.valor_total ?? ''),

          numero_factura:
            b.numero_factura ?? '',

          fecha_factura:
            b.fecha_factura ?? '',

          proveedor:
            b.proveedor ?? '',

          estado_factura:
            String(b.estado_factura ?? ''),

          doerespuesta:
            b.doerespuesta ?? '',

          observaciones:
            b.observaciones ?? '',
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
  }, [orden]);

  /*
   * Buscar nombre del predio
   */
  const nombrePredio =
    predios.find(
      (p) => String(p.id) === String(form.predio)
    )?.nombre ?? '';

  /*
   * Buscar nombre de los estados
   */
  const nombreTipoCompra =
    TipoCompra.find(
      (p) => String(p.id) === String(form.tipo_compra)
    )?.nombre ?? '';

  const nombreEstadoOrden =
    OrdenCompra.find(
      (p) => String(p.id) === String(form.estado_orden)
    )?.nombre ?? '';

  const nombreEstadoFactura =
    EstadoFactura.find(
      (p) => String(p.id) === String(form.estado_factura)
    )?.nombre ?? '';

  /*
   * Loading
   */
  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          gap: 12,
          fontFamily: 'monospace',
          fontSize: '.7rem',
          color: '#9ab8a2',
        }}
      >
        <svg
          style={{
            width: 20,
            height: 20,
            animation: 'spin 1s linear infinite',
          }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            style={{ opacity: 0.25 }}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />

          <path
            style={{ opacity: 0.75 }}
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>

        Cargando registro...

        <style>
          {`
            @keyframes spin {
              to {
                transform: rotate(360deg)
              }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div
        style={{
          fontFamily: '"Barlow",sans-serif',
        }}
      >

        {/* PAGE HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24,
            padding: '0 4px',
          }}
        >
          <div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                padding: '3px 10px 3px 8px',
                borderRadius: 999,
                background: 'rgba(58,153,86,.1)',
                border: '1px solid rgba(58,153,86,.25)',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#3a9956',
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '.58rem',
                  fontWeight: 500,
                  color: '#2e7d46',
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                }}
              >
                Gestión Predio Agrícola
              </span>
            </div>

            <h2
              style={{
                fontFamily:
                  '"Barlow Condensed",sans-serif',
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#1a2e22',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              Visualizar Adquisición de Insumos y Productos
            </h2>

            <p
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '.65rem',
                color: '#9ab8a2',
              }}
            >
              Registro N.º {form.orden || orden}
            </p>
          </div>

          <Link
            href="/predio/insumosproductos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              borderRadius: 8,
              fontFamily:
                '"Barlow Condensed",sans-serif',
              fontSize: '.8rem',
              fontWeight: 700,
              letterSpacing: '.07em',
              textTransform: 'uppercase',
              color: '#1a2e22',
              textDecoration: 'none',
              background:
                'linear-gradient(135deg,#8a6a18,#d4a832)',
              boxShadow:
                '0 4px 14px rgba(201,168,76,.3)',
            }}
          >
            <svg
              style={{
                width: 13,
                height: 13,
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>

            Volver
          </Link>
        </div>

        {/* CONTENIDO */}
        <div
          style={{
            background: '#fff',
            border:
              '1px solid rgba(0,0,0,.1)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow:
              '0 4px 24px rgba(0,0,0,.1)',
          }}
        >

          {/* INFORMACIÓN GENERAL */}
          <Section>
            <SecTitle label="Información General" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="Predio">
                <FInput
                  value={
                    loadingPredios
                      ? 'Cargando...'
                      : errorPredios
                        ? errorPredios
                        : nombrePredio
                  }
                />
              </Field>

              <Field label="Producto / Servicio">
                <FInput
                  value={form.producto_servicio}
                />
              </Field>

              <Field label="N.º Registro">
                <FInput
                  value={form.orden}
                />
              </Field>

            </div>
          </Section>

          {/* COTIZACIÓN */}
          <Section>
            <SecTitle label="Cotización" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="Empresa">
                <FInput
                  value={form.empresa}
                />
              </Field>

              <Field label="Fecha">
                <FInput
                  type="date"
                  value={form.fecha_cotizacion}
                />
              </Field>

              <Field label="Valor">
                <FInputMoney
                  value={form.valor_cotizacion}
                />
              </Field>

            </div>
          </Section>

          {/* COMPRA */}
          <Section>
            <SecTitle label="Compra" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="Tipo Compra">
                <FSelect
                  value={form.tipo_compra}
                >
                  <option value="">
                    {loadingTipoCompra
                      ? 'Cargando...'
                      : errorTipoCompra
                        ? errorTipoCompra
                        : nombreTipoCompra || 'Sin información'}
                  </option>

                  {TipoCompra.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>

              <Field label="Etapa">
                <FInput
                  value={form.etapa}
                />
              </Field>

            </div>
          </Section>

          {/* ORDEN DE COMPRA */}
          <Section>
            <SecTitle label="Orden de Compra" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="N.º Orden">
                <FInput
                  value={form.numero_orden}
                />
              </Field>

              <Field label="Estado">
                <FSelect
                  value={form.estado_orden}
                >
                  <option value="">
                    {loadingOrdenCompra
                      ? 'Cargando...'
                      : errorOrdenCompra
                        ? errorOrdenCompra
                        : nombreEstadoOrden ||
                          'Sin información'}
                  </option>

                  {OrdenCompra.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>

              <Field label="Fecha">
                <FInput
                  type="date"
                  value={form.fecha_orden}
                />
              </Field>

              <Field label="Valor Total Pagado">
                <FInputMoney
                  value={form.valor_total}
                />
              </Field>

            </div>
          </Section>

          {/* FACTURA */}
          <Section>
            <SecTitle label="Factura" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="N.º Factura">
                <FInput
                  value={form.numero_factura}
                />
              </Field>

              <Field label="Fecha Factura">
                <FInput
                  type="date"
                  value={form.fecha_factura}
                />
              </Field>

              <Field label="Proveedor">
                <FInput
                  value={form.proveedor}
                />
              </Field>

              <Field label="Estado">
                <FSelect
                  value={form.estado_factura}
                >
                  <option value="">
                    {loadingEstadosFactura
                      ? 'Cargando...'
                      : errorEstadosFactura
                        ? errorEstadosFactura
                        : nombreEstadoFactura ||
                          'Sin información'}
                  </option>

                  {EstadoFactura.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>

            </div>
          </Section>

          {/* OTROS */}
          <Section>
            <SecTitle label="Otros" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16,
              }}
            >

              <Field label="DOE de Respuesta B.5 por Pago de Factura">
                <FInput
                  value={form.doerespuesta}
                />
              </Field>

              <Field label="Observaciones">
                <textarea
                  value={form.observaciones}
                  readOnly
                  style={{
                    ...readOnlyStyle,
                    minHeight: 80,
                    resize: 'vertical',
                  }}
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
              </div>
            </div>  

        </div>
      </div>
    </>
  );
}

export default function VerInsumoProductoPage() {
  return (
    <Suspense>
      <VerInsumoProductoPageInner />
    </Suspense>
  );
}