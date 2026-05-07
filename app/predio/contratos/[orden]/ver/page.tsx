'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter, useParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';

import { usePredio } from '@/hooks/usePredio';
import { useEstados } from '@/hooks/useEstado';

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
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-field={label}>
      <label style={labelStyle}>
        {label}
        {required && (
          <span style={{ color: '#fca5a5', marginLeft: 2 }}>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '.6rem',
            color: '#ef4444',
            marginTop: 4
          }}
        >
          {error}
        </p>
      )}
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
        paddingRight: 34
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
        marginBottom: 20
      }}
    >
      <div
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: 'linear-gradient(180deg,#3aaf64,#3a9956)'
        }}
      />

      <span
        style={{
          fontFamily: '"Barlow Condensed",sans-serif',
          fontSize: '.8rem',
          fontWeight: 700,
          color: '#2e7d46',
          textTransform: 'uppercase',
          letterSpacing: '.12em'
        }}
      >
        {label}
      </span>
    </div>
  );
}
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)' }} >
      {children}
    </div>
  );
}

function VerContratosPageInner() {

  const router = useRouter();
  const params = useParams();

  const uuid = Array.isArray(params?.orden)
    ? params.orden[0]
    : params?.orden;

  const [errors] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const {predios, loading: loadingPredios, error: errorPredios} = usePredio();
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

  useEffect(() => {
    if (!uuid) return;
    const cargar = async () => {
      try {
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
        toast.error('No se pudo cargar el contrato');
      } finally {
        setCargando(false);
      }
    };cargar();
  }, [uuid]);

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
          color: '#9ab8a2'
        }}
      >
        Cargando contrato...
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
          padding: '0 4px'
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
              border: '1px solid rgba(58,153,86,.25)'
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#3a9956'
              }}
            />

            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '.58rem',
                fontWeight: 500,
                color: '#2e7d46',
                letterSpacing: '.12em',
                textTransform: 'uppercase'
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
              letterSpacing: '.06em'
            }}
          >
            Ver contrato
          </h2>

        </div>

        <Link
          href={`/predio/contratos/`}
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
            background: 'linear-gradient(135deg,#8a6a18,#d4a832)'
          }}
        >
          Volver
        </Link>

      </div>

      {/* FORM */}
      <form>

        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,.1)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,.1)'
          }}
        >

          <Section>
            <SecTitle label="Información General" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 16
              }}
            >

              <Field label="Predio">
                <FSelect
                  disabled
                  value={form.predio_id}
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

              <Field label="Contrato">
                <FInput
                  readOnly
                  value={form.contrato}
                />
              </Field>

              <Field label="Fecha">
                <FInput
                  readOnly
                  type="date"
                  value={form.fecha}
                />
              </Field>

              <Field label="Empresa o Persona">
                <FInput
                  readOnly
                  value={form.empresa_persona}
                />
              </Field>

              <Field label="RUT">
                <FInput
                  readOnly
                  value={form.rut}
                />
              </Field>

              <Field label="Valor Renta ($)">
                <FInput
                  readOnly
                  value={form.valor_renta}
                />
              </Field>

              <Field label="Tipo Renta">
                <FSelect
                  disabled
                  value={form.renta_id}
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

              <Field label="Fecha Vencimiento">
                <FInput
                  readOnly
                  type="date"
                  value={form.fecha_vencimiento}
                />
              </Field>

              <Field label="Vigencia Contrato">
                <FInput
                  readOnly
                  value={form.vigencia_contrato}
                />
              </Field>
            </div>

          </Section>

          <Section>
            <SecTitle label="Otros" />
            <Field label="DOE de respuesta B.5">
              <FInput
                readOnly
                value={form.doe_respuesta_b5}
              />
            </Field>

            <div style={{ marginTop: 16 }}>

              <Field label="Observaciones">
                <textarea
                  readOnly
                  value={form.observaciones}
                  style={{
                    ...inputStyle,
                    minHeight: 80
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
                <Link href="/predio/contratos"
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
      </form>
    </div>
  );
}

export default function VerContratosPage() {
  return (
    <Suspense>
      <VerContratosPageInner />
    </Suspense>
  );
}