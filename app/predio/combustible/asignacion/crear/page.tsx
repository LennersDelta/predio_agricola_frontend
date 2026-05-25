'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { usePredio } from '@/hooks/usePredio';

// ESTILOS
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

// COMPONENTES
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      {children}

      {error && (
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '.6rem',
            color: '#ef4444',
            marginTop: 4,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
function FInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = '#3a9956';
        e.target.style.boxShadow =
          '0 0 0 3px rgba(58,153,86,.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor =
          'rgba(0,0,0,.1)';
        e.target.style.boxShadow = 'none';
      }}
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
      onFocus={(e) => {
        e.target.style.borderColor = '#3a9956';
        e.target.style.boxShadow =
          '0 0 0 3px rgba(58,153,86,.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor =
          'rgba(0,0,0,.1)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {children}
    </select>
  );
}
function SecTitle({
  label,
}: {
  label: string;
}) {
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
          background:
            'linear-gradient(180deg,#3aaf64,#3a9956)',
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontFamily:
            '"Barlow Condensed",sans-serif',
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
        borderBottom:
          '1px solid rgba(0,0,0,.06)',
      }}
    >
      {children}
    </div>
  );
}

// PAGE
export default function CrearAsignacionPage() {
  const router = useRouter();
  const { predios } = usePredio();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({predio: '', mes: '',  monto: '',});

  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const set = (
    key: string,
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  // VALIDAR
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.predio) {errs.predio ='Debe seleccionar un predio.';}
    if (!form.mes) {errs.mes ='Debe seleccionar un mes.';}
    if (!form.monto) {errs.monto ='Debe ingresar un monto.';}
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // SUBMIT
  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) {
    toast.error('Complete los campos requeridos.');
    return;
  }
  try {
    setLoading(true);
    await api.post('/api/combustible/asignacion', form);
    toast.success('Asignación creada correctamente');
    router.push('/predio/combustible/asignacion');
  } catch (error: any) {
    if (error?.response?.status === 422) {
      setModalMessage(error?.response?.data?.message || 'Ya existe una asignación.');
      setOpenModal(true);
    } else {
      toast.error(error?.response?.data?.message || 'Error al guardar' );
    }
  } finally {
    setLoading(false);
  }
};

  // RENDER
  return (
    <div
      style={{
        fontFamily:
          '"Barlow",sans-serif',
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent:
            'space-between',
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
              padding:
                '3px 10px 3px 8px',
              borderRadius: 999,
              background:
                'rgba(58,153,86,.1)',
              border:
                '1px solid rgba(58,153,86,.25)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background:
                  '#3a9956',
              }}
            />

            <span
              style={{
                fontFamily:
                  'monospace',
                fontSize: '.58rem',
                fontWeight: 500,
                color: '#2e7d46',
                letterSpacing:
                  '.12em',
                textTransform:
                  'uppercase',
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
              textTransform:
                'uppercase',
              letterSpacing:
                '.06em',
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            Nueva asignación
          </h2>

          <p
            style={{
              fontSize: '.72rem',
              color: '#3d5c47',
              fontFamily:
                'monospace',
            }}
          >
            Registro de asignación
            mensual de combustible
          </p>
        </div>

        <Link
          href="/predio/combustible/asignacion"
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
            letterSpacing:
              '.07em',
            textTransform:
              'uppercase',
            color: '#1a2e22',
            textDecoration:
              'none',
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
            border:
              '1px solid rgba(0,0,0,.1)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow:
              '0 4px 24px rgba(0,0,0,.1)',
          }}
        >
          <Section>
            <SecTitle label="Datos de asignación" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(220px,1fr))',
                gap: 16,
              }}
            >
              <Field
                label="Predio"
                error={errors.predio}
              >
                <FSelect
                  value={form.predio}
                  onChange={(e) =>
                    set(
                      'predio',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccione
                  </option>

                  {predios.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>

              <Field
                label="Mes"
                error={errors.mes}
              >
                <FInput
                  type="month"
                  value={form.mes}
                  onChange={(e) =>
                    set(
                      'mes',
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="Monto Asignado"
                error={errors.monto}
              >
                <FInput
                  type="number"
                  value={form.monto}
                  onChange={(e) =>
                    set(
                      'monto',
                      e.target.value
                    )
                  }
                />
              </Field>
            </div>
          </Section>

          {/* BOTÓN */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              marginTop: 20,
              marginBottom: 20,
              paddingRight: 20,
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                display:
                  'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding:
                  '10px 24px',
                borderRadius: 9,
                border: 'none',
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                fontFamily:
                  '"Barlow Condensed",sans-serif',
                fontSize: '.85rem',
                fontWeight: 700,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '.07em',
                color: '#0d2318',
                background:
                  'linear-gradient(135deg,#3aaf64,#7dd494)',
                boxShadow:
                  '0 4px 14px rgba(76,202,122,.28)',
                opacity: loading
                  ? .7
                  : 1,
              }}
            >
              {loading
                ? 'Guardando...'
                : 'Guardar asignación'}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL ERROR */}
      {openModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow:
                '0 20px 60px rgba(0,0,0,.25)',
            }}
          >
            {/* HEADER */}

            <div
              style={{
                padding: '18px 22px',
                borderBottom:
                  '1px solid rgba(0,0,0,.08)',
                background:
                  'linear-gradient(135deg,#fff1f2,#fff)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: '#dc2626',
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily:
                    '"Barlow Condensed",sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Registro duplicado
              </h3>
            </div>

            {/* BODY */}

            <div
              style={{
                padding: 24,
                fontSize: '.9rem',
                color: '#374151',
                lineHeight: 1.5,
                fontFamily: '"Barlow",sans-serif',
              }}
            >
              {modalMessage}
            </div>

            {/* FOOTER */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '0 20px 20px',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenModal(false)
                }
                style={{
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background:
                    'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}