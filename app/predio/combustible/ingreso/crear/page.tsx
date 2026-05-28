'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';

// ======================================================
// TYPES
// ======================================================

interface Asignacion {
  id: number;
  predio: string;
  mes: string;
  saldo: number;
  monto_asignado?: number;
  monto_utilizado?: number;
  nombre: string;
}

interface Patente {
  orden: number;
  ppu: string;
  nombre: string;
}
// ======================================================
// ESTILOS
// ======================================================

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

// ======================================================
// COMPONENTES
// ======================================================

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

export default function CrearIngresoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] =  useState<File | null>(null);
  const [asignaciones, setAsignaciones] =  useState<Asignacion[]>([]);

  const [patentes, setPatentes] = useState<Patente[]>([]);
  const [loadingPatentes, setLoadingPatentes] = useState(false);

  const [form, setForm] = useState({
    asignacion_id: '',
    nroFactura: '',
    proveedor: '',
    estadoFactura: '',
    doeRespuestaB5: '',
    cantidadConsumoLitros: '',
    monto: '',
    patente: '',
  });

  // MODAL
  const [openModal, setOpenModal] =  useState(false);
  const [modalMessage, setModalMessage] =  useState('');

  // LOAD
  useEffect(() => {
    loadAsignaciones();
  }, []);

  const loadAsignaciones = async () => {
    try {
      const { data } = await api.get(
        '/api/combustible/asignacion/disponibles'
      );

      setAsignaciones(data);

    } catch (error) {
      console.error(error);
    }
  };
 
  // SE AGREGAN LAS PATENTES SEGUN PREDIO SELECCIONADO
  const loadPatentes = async (
    asignacionId: string
  ) => {
    if (!asignacionId) {
      setPatentes([]);
      return;
    }
    try {
      setLoadingPatentes(true);
      const { data } = await api.get(
        `/api/combustible/asignacion/${asignacionId}/patentes`
      );
      setPatentes(data);
    } catch (error) {
      console.error(error);
      setPatentes([]);

    } finally {
      setLoadingPatentes(false);
    }
  };




  // ======================================================
  // SET
  // ======================================================

  const set = (
    key: string,
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  // ======================================================
  // ASIGNACIÓN SELECCIONADA
  // ======================================================

  const asignacionSeleccionada =
    useMemo(() => {
      return asignaciones.find(
        (a) =>
          String(a.id) ===
          String(form.asignacion_id)
      );
    }, [
      asignaciones,
      form.asignacion_id,
    ]);

  // ======================================================
  // VALIDAR
  // ======================================================

  const validate = () => {
    const errs: Record<string, string> =
      {};

    if (!form.asignacion_id) {
      errs.asignacion_id =
        'Debe seleccionar una asignación.';
    }


    if (!form.nroFactura) {
      errs.nroFactura =
        'Debe ingresar número factura.';
    }

    if (!form.proveedor) {
      errs.proveedor =
        'Debe ingresar proveedor.';
    }

    if (!form.estadoFactura) {
      errs.estadoFactura =
        'Debe seleccionar estado.';
    }

    if (!form.doeRespuestaB5) {
      errs.doeRespuestaB5 =
        'Debe ingresar DOE.';
    }

    if (!form.cantidadConsumoLitros) {
      errs.cantidadConsumoLitros =
        'Debe ingresar litros.';
    }

    if (!form.monto) {
      errs.monto =
        'Debe ingresar monto.';
    }

    if (!file) {
      errs.comprobante =
        'Debe adjuntar comprobante.';
    }

    if (!form.patente) {
      errs.patente =
        'Debe ingresar patente.';
    }
    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validate()) {
      toast.error(
        'Complete los campos requeridos.'
      );
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      Object.entries(form).forEach(
        ([k, v]) => {
          fd.append(k, v);
        }
      );

      if (file) {
        fd.append(
          'comprobante',
          file
        );
      }

      await api.post(
        '/api/combustible/ingreso',
        fd,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      toast.success(
        'Ingreso registrado correctamente'
      );

      router.push(
        '/predio/combustible/ingreso'
      );

    } catch (error: any) {

      if (
        error?.response?.data?.message
      ) {
        setModalMessage(
          error.response.data.message
        );

        setOpenModal(true);

      } else {

        toast.error(
          'Error al guardar'
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

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
            Nuevo ingreso combustible
          </h2>

          <p
            style={{
              fontSize: '.72rem',
              color: '#3d5c47',
              fontFamily:
                'monospace',
            }}
          >
            Registro de consumo y carga
            de combustible
          </p>
        </div>

        <Link
          href="/predio/combustible/ingreso"
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
            <SecTitle label="Datos del ingreso" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(220px,1fr))',
                gap: 16,
              }}
            >
              {/* ASIGNACIÓN ESTO SOLO MUESTRA EL PREDIO | FECHA --> CENTINELA | 2026-01-25 */}

             {/* <Field
                label="Asignación"
                error={
                  errors.asignacion_id
                }
              >
                <FSelect
                  value={
                    form.asignacion_id
                  }
                  onChange={(e) =>
                    set(
                      'asignacion_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccione
                  </option>

                  {asignaciones.map(
                    (a) => (
                      <option
                        key={a.id}
                        value={a.id}
                      >
                        {a.predio} |{' '}
                        {a.mes}
                      </option>
                    )
                  )}
                </FSelect>
              </Field>
            */}

              {/* ASIGNACIÓN */}
              <Field
                label="Asignación"
                error={errors.asignacion_id}
              >
                <FSelect
                  value={form.asignacion_id}
                  onChange={(e) => {

                    const value =
                      e.target.value;

                    // guardar asignación
                    set(
                      'asignacion_id',
                      value
                    );

                    // limpiar patente seleccionada
                    set(
                      'patente',
                      ''
                    );

                    // limpiar lista anterior
                    setPatentes([]);

                    // cargar nuevas patentes
                    loadPatentes(value);
                  }}
                >
                  <option value="">
                    Seleccione
                  </option>

                  {asignaciones.map((a) => (
                    <option
                      key={a.id}
                      value={a.id}
                    >
                      {a.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>
              
              {/*<Field
                label="Asignación"
                error={errors.asignacion_id}
              >
                <FSelect
                  value={form.asignacion_id}
                  onChange={(e) =>
                    set(
                      'asignacion_id',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccione
                  </option>

                  {asignaciones.map((a) => (
                    <option
                      key={a.id}
                      value={a.id}
                    >
                      {a.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>*/}

              {/* PRESUPUESTO */}

              {asignacionSeleccionada && (
                <div
                  style={{
                    gridColumn:
                      '1 / -1',
                  }}
                >
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg,#f0fdf4,#ffffff)',
                      border:
                        '1px solid rgba(58,153,86,.18)',
                      borderRadius: 12,
                      padding:
                        '18px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 24,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize:
                              '.6rem',
                            color:
                              '#6b7280',
                            textTransform:
                              'uppercase',
                            letterSpacing:
                              '.1em',
                            marginBottom: 6,
                            fontFamily:
                              'monospace',
                          }}
                        >
                          Presupuesto asignado
                        </div>

                        <div
                          style={{
                            fontSize:
                              '1.4rem',
                            fontWeight: 800,
                            color:
                              '#166534',
                          }}
                        >
                          $
                          {Number(
                            asignacionSeleccionada.monto_asignado ||
                              0
                          ).toLocaleString(
                            'es-CL'
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize:
                              '.6rem',
                            color:
                              '#6b7280',
                            textTransform:
                              'uppercase',
                            letterSpacing:
                              '.1em',
                            marginBottom: 6,
                            fontFamily:
                              'monospace',
                          }}
                        >
                          Utilizado
                        </div>

                        <div
                          style={{
                            fontSize:
                              '1.2rem',
                            fontWeight: 700,
                            color:
                              '#b45309',
                          }}
                        >
                          $
                          {Number(
                            asignacionSeleccionada.monto_utilizado ||
                              0
                          ).toLocaleString(
                            'es-CL'
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize:
                              '.6rem',
                            color:
                              '#6b7280',
                            textTransform:
                              'uppercase',
                            letterSpacing:
                              '.1em',
                            marginBottom: 6,
                            fontFamily:
                              'monospace',
                          }}
                        >
                          Saldo disponible
                        </div>

                        <div
                          style={{
                            fontSize:
                              '1.2rem',
                            fontWeight: 700,
                            color:
                              '#1d4ed8',
                          }}
                        >
                          $
                          {Number(
                            asignacionSeleccionada.saldo ||
                              0
                          ).toLocaleString(
                            'es-CL'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              <Field
                label="N° Factura"
                error={
                  errors.nroFactura
                }
              >
                <FInput
                  value={
                    form.nroFactura
                  }
                  onChange={(e) =>
                    set(
                      'nroFactura',
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="Proveedor"
                error={
                  errors.proveedor
                }
              >
                <FInput
                  value={
                    form.proveedor
                  }
                  onChange={(e) =>
                    set(
                      'proveedor',
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="Estado factura"
                error={
                  errors.estadoFactura
                }
              >
                <FSelect
                  value={
                    form.estadoFactura
                  }
                  onChange={(e) =>
                    set(
                      'estadoFactura',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccione
                  </option>

                  <option value="pagada">
                    Pagada
                  </option>

                  <option value="pendiente">
                    Pendiente
                  </option>
                </FSelect>
              </Field>

              <Field
                label="DOE DE RESPUESTA B.5"
                error={
                  errors.doeRespuestaB5
                }
              >                
                <FInput
                  value={
                    form.doeRespuestaB5
                  }
                  onChange={(e) =>
                    set(
                      'doeRespuestaB5',
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="PPU"
                error={errors.patente}
              >
                <FSelect
                  value={form.patente}
                  disabled={
                    !form.asignacion_id ||
                    loadingPatentes
                  }
                  onChange={(e) =>
                    set(
                      'patente',
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    {loadingPatentes
                      ? 'Cargando...'
                      : 'Seleccione'}
                  </option>

                  {patentes.map((p) => (
                    <option
                      key={p.orden}
                      value={p.ppu}
                    >
                      {p.nombre}
                    </option>
                  ))}
                </FSelect>
              </Field>


              <Field
                label="Litros"
                error={
                  errors.cantidadConsumoLitros
                }
              >
                <FInput
                  type="number"
                  value={
                    form.cantidadConsumoLitros
                  }
                  onChange={(e) =>
                    set(
                      'cantidadConsumoLitros',
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="Monto"
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

              <Field
                label="Comprobante"
                error={
                  errors.comprobante
                }
              >
                <FInput
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const f =
                      e.target.files?.[0];

                    if (f) {
                      setFile(f);
                    }
                  }}
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
                : 'Guardar ingreso'}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL */}

      {openModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,.45)',
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
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.06em',
                }}
              >
                Atención
              </h3>
            </div>

            <div
              style={{
                padding: 24,
                fontSize: '.9rem',
                color: '#374151',
                lineHeight: 1.5,
                fontFamily:
                  '"Barlow",sans-serif',
              }}
            >
              {modalMessage}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                padding:
                  '0 20px 20px',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenModal(false)
                }
                style={{
                  border: 'none',
                  padding:
                    '10px 20px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background:
                    'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '.8rem',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.05em',
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