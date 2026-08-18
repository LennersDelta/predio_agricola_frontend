'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
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
      style={inputStyle}
    />
  );
}
function FSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        paddingRight: 34,
        cursor: 'pointer',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 11px center',
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

function EditarLuzPageInner() {
  const params = useParams();
  const router = useRouter();

  const uuid = Array.isArray(params?.orden)
    ? params.orden[0]
    : params?.orden;

  const [cargando, setCargando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const {estados, loading: loadingEstados, error: errorEstados,} = useEstados('factura_consumo');
  const {predios, loading: loadingPredios, error: errorPredios,} = usePredio();

  const [form, setForm] = useState({
    id: '',
    predio_id: '',
    predio_nombre: '',
    n_factura: '',
    mes_consumo: '',
    valor: '',
    proveedor: '',
    uuid: '',
    doe: '',
    consumo: '',
    estado_id: '',
    estado_nombre: '',
    user_id: '',
    created_at: '',
    updated_at: '',
  });

  /* SETEO LA FECHA EN MM/YYYY */
  const formatearMesInput = (fecha: string) => {
    if (!fecha) return '';

    return fecha.substring(0, 7);
  };


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Cargar factura */
  useEffect(() => {
    if (!uuid) return;
    const cargar = async () => {      try {
        setLoadingData(true);
        const { data } = await api.get(`/api/factura/luz/${uuid}`);
        const b = data.data ?? data;

        setForm({
          id: String(b.id ?? ''),
          predio_id: String(b.predio_id ?? ''),
          predio_nombre: b.predio_nombre ?? '',
          n_factura: b.n_factura ?? '',
          mes_consumo: formatearMesInput(b.mes_consumo),
          valor: String(b.valor ?? ''),
          proveedor: b.proveedor ?? '',
          uuid: b.uuid ?? '',
          doe: b.doe ?? '',
          consumo: String(b.consumo ?? ''),
          estado_id: String(b.estado_id ?? ''),
          estado_nombre: b.estado_nombre ?? '',
          user_id: String(b.user_id ?? ''),
          created_at: b.created_at ?? '',
          updated_at: b.updated_at ?? '',
        });

      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la factura luz');
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [uuid]);

  /* Guardar cambios */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!uuid) {
      toast.error('No se encontró el identificador de la factura');
      return;
    }

    if (!form.predio_id) {
      toast.error('Debe seleccionar un predio');
      return;
    }

    if (!form.n_factura.trim()) {
      toast.error('Debe ingresar el número de factura');
      return;
    }

    if (!form.mes_consumo) {
      toast.error('Debe seleccionar el mes de consumo');
      return;
    }

    if (!form.valor) {
      toast.error('Debe ingresar el valor');
      return;
    }

    if (!form.estado_id) {
      toast.error('Debe seleccionar el estado de la factura');
      return;
    }

    setGuardando(true);

    try {
      const mesConsumo = `${form.mes_consumo}-01`;

      const payload = {
        predio_id: Number(form.predio_id),
        n_factura: form.n_factura,
        mes_consumo: mesConsumo,
        valor: Number(form.valor),
        proveedor: form.proveedor,
        doe: form.doe,
        consumo: form.consumo,
        estado_id: Number(form.estado_id),
      };

      await api.put(
        `/api/factura/luz/${uuid}`,
        payload
      );

      toast.success('Factura de luz actualizada correctamente');

      router.push('/predio/factura/luz');

    } catch (error: any) {
      console.error(error);

      const mensaje =
        error?.response?.data?.message ??
        'No se pudo actualizar la factura de luz';

      toast.error(mensaje);

    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          fontFamily: 'monospace',
          fontSize: '.7rem',
          color: '#9ab8a2',
        }}
      >
        Cargando Factura Luz...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {/* HEADER */}
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
              fontFamily: '"Barlow Condensed",sans-serif',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#1a2e22',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Editar factura luz
          </h2>

        </div>

        <Link
          href="/predio/factura/luz"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 8,
            fontFamily: '"Barlow Condensed",sans-serif',
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

      {/* FORM */}
      <form onSubmit={handleSubmit}>

        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,.1)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,.1)',
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

              {/* PREDIO */}
              <Field label="Predio">

                <FSelect
                  name="predio_id"
                  value={form.predio_id}
                  onChange={handleChange}
                >
                  <option value="">
                    {loadingPredios
                      ? 'Cargando...'
                      : errorPredios
                        ? errorPredios
                        : 'Seleccione'}
                  </option>

                  {predios.map(p => (
                    <option
                      key={p.id}
                      value={String(p.id)}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>

              </Field>

              {/* N° FACTURA */}
              <Field label="N° de Factura">

                <FInput
                  name="n_factura"
                  value={form.n_factura}
                  onChange={handleChange}
                />

              </Field>

              {/* MES DE CONSUMO */}
              <Field label="Mes de Consumo">

                <FInput
                  name="mes_consumo"
                  type="month"
                  value={form.mes_consumo}
                  onChange={handleChange}
                />

              </Field>

              {/* VALOR */}
              <Field label="Valor Total ($)">

                <FInput
                  name="valor"
                  type="number"
                  min="0"
                  value={form.valor}
                  onChange={handleChange}
                />

              </Field>

              {/* PROVEEDOR */}
              <Field label="Proveedor">

                <FInput
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                />

              </Field>

              {/* ESTADO */}
              <Field label="Estado Factura">

                <FSelect
                  name="estado_id"
                  value={form.estado_id}
                  onChange={handleChange}
                >
                  <option value="">
                    {loadingEstados
                      ? 'Cargando...'
                      : errorEstados
                        ? errorEstados
                        : 'Seleccione'}
                  </option>

                  {estados.map(e => (
                    <option
                      key={e.id}
                      value={String(e.id)}
                    >
                      {e.nombre}
                    </option>
                  ))}
                </FSelect>

              </Field>

              {/* DOE */}
              <Field label="DOE Respuesta B.5">

                <FInput
                  name="doe"
                  value={form.doe}
                  onChange={handleChange}
                />

              </Field>

              {/* CONSUMO */}
              <Field label="Consumo (Kilos)">

                <FInput
                  name="consumo"
                  type="number"
                  value={form.consumo}
                  onChange={handleChange}
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
              <Link href="/predio/factura/luz"
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
  );
}

export default function EditarLuzPage() {
  return (
    <Suspense>
      <EditarLuzPageInner />
    </Suspense>
  );
}

