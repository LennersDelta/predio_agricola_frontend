// app/configuracion/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useTiposEstado } from '@/hooks/useTipoEstado';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
type Tabla = 'estados';

interface Registro {
  id: number;
  tipo: string;
  descripcion: string;
}

const TABLAS: {
  key: Tabla;
  label: string;
  descripcion: string;
  icon: string;
}[] = [
  {
    key: 'estados',
    label: 'Tipo de estados',
    descripcion:
      'Categorías de tipos (Tipo Compra, Estado O.C, Estado Factura, Factura Consumo, Renta Contrato)',
    icon:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
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
  transition: 'border-color .18s, box-shadow .18s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.68rem',
  fontWeight: 700,
  color: '#4a7a5a',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 5,
  fontFamily: 'monospace',
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL FORM
// ─────────────────────────────────────────────────────────────────────────────
function ModalForm({
  tabla,
  registro,
  onClose,
  onSaved,
}: {
  tabla: Tabla;
  registro: Registro | null;
  onClose: () => void;
  onSaved: () => void;
}) {
const { tipos } = useTiposEstado();
  const [tipo, setTipo] = useState(registro?.tipo ?? '');
  const [descripcion, setDescripcion] = useState(
    registro?.descripcion ?? ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esEditar = !!registro;

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!tipo.trim()) {
      setError('El tipo es obligatorio.');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }

    setLoading(true);
    setError('');

    try {

      if (esEditar) {

        await api.put(
          `/api/configuracion/${tabla}/${registro!.id}`,
          {
            tipo,
            descripcion,
          }
        );

        toast.success('Registro actualizado correctamente.');

      } else {

        await api.post(
          `/api/configuracion/${tabla}`,
          {
            tipo,
            descripcion,
          }
        );

        toast.success('Registro creado correctamente.');
      }

      onSaved();
      onClose();

    } catch (err: any) {

      const msg =
        err.response?.data?.errors?.descripcion?.[0] ??
        err.response?.data?.errors?.tipo?.[0] ??
        err.response?.data?.message ??
        'Error al guardar.';

      setError(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '28px 32px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
      >
        <h3
          style={{
            fontFamily: '"Barlow Condensed",sans-serif',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#1a2e22',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 20,
          }}
        >
          {esEditar ? 'Editar Registro' : 'Nuevo Registro'}
        </h3>

        <form onSubmit={handleSubmit}>

          {/* TIPO */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Tipo *
            </label>

            <select
              value={tipo}
              onChange={e => {
                setTipo(e.target.value);
                setError('');
              }}
              style={inputStyle}
            >

              <option value="">
                Seleccione un tipo
              </option>

              {tipos.map(t => (
                <option
                  key={t.value}
                  value={t.value}
                >
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Descripción *
            </label>

            <input
              value={descripcion}
              onChange={e => {
                setDescripcion(e.target.value);
                setError('');
              }}
              placeholder="Ingrese la descripción..."
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = '#3a9956';
                e.target.style.boxShadow =
                  '0 0 0 3px rgba(58,153,86,.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor =
                  'rgba(0,0,0,.1)';
                e.target.style.boxShadow = 'none';
              }}
            />

            {error && (
              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: '.6rem',
                  color: '#ef4444',
                  marginTop: 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg
                  style={{ width: 10, height: 10 }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>

                {error}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: '1px solid rgba(0,0,0,.1)',
                background: '#f5f5f5',
                cursor: 'pointer',
                fontFamily:
                  '"Barlow Condensed",sans-serif',
                fontSize: '.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#6b8f75',
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                background:
                  'linear-gradient(135deg,#3aaf64,#7dd494)',
                cursor:
                  loading ? 'not-allowed' : 'pointer',
                fontFamily:
                  '"Barlow Condensed",sans-serif',
                fontSize: '.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#0d2318',
                opacity: loading ? .7 : 1,
              }}
            >
              {loading
                ? 'Guardando...'
                : esEditar
                ? 'Actualizar'
                : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL DE TABLA
// ─────────────────────────────────────────────────────────────────────────────
function PanelTabla({
  tabla,
}: {
  tabla: typeof TABLAS[0];
}) {

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] =
    useState<Registro | null>(null);
  const [buscar, setBuscar] = useState('');

  const cargar = useCallback(() => {

    setLoading(true);

    api
      .get(`/api/configuracion/${tabla.key}`)
      .then(({ data }) => {
        setRegistros(data.data ?? []);
      })
      .catch(() => {
        toast.error('Error al cargar registros');
      })
      .finally(() => {
        setLoading(false);
      });

  }, [tabla.key]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = registros.filter(r =>
    `${r.tipo} ${r.descripcion}`
      .toLowerCase()
      .includes(buscar.toLowerCase())
  );

  return (
    <>
      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,.1)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,.08)',
        }}
      >

        {/* HEADER */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom:
              '1px solid rgba(0,0,0,.06)',
            background: 'rgba(0,0,0,.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 3,
                height: 18,
                borderRadius: 2,
                background:
                  'linear-gradient(180deg,#3aaf64,#3a9956)',
                flexShrink: 0,
              }}
            />

            <div>
              <p
                style={{
                  fontFamily:
                    '"Barlow Condensed",sans-serif',
                  fontSize: '.9rem',
                  fontWeight: 700,
                  color: '#1a2e22',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  lineHeight: 1,
                }}
              >
                {tabla.label}
              </p>

              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: '.58rem',
                  color: '#9ab8a2',
                  marginTop: 2,
                }}
              >
                {tabla.descripcion}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >

            {/* BUSCADOR */}
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 11,
                  height: 11,
                  color: '#9ab8a2',
                  pointerEvents: 'none',
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>

              <input
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
                placeholder="Buscar..."
                style={{
                  ...inputStyle,
                  paddingLeft: 26,
                  width: 200,
                  fontSize: '.75rem',
                }}
                onFocus={e => {
                  e.target.style.borderColor =
                    '#3a9956';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(58,153,86,.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor =
                    'rgba(0,0,0,.1)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* CONTADOR */}
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '.6rem',
                color: '#9ab8a2',
              }}
            >
              <span
                style={{
                  color: '#2e7d46',
                  fontWeight: 700,
                }}
              >
                {filtrados.length}
              </span>{' '}
              registros
            </span>

            {/* BOTÓN NUEVO */}
            <button
              onClick={() => {
                setEditando(null);
                setModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background:
                  'linear-gradient(135deg,#3aaf64,#7dd494)',
                fontFamily:
                  '"Barlow Condensed",sans-serif',
                fontSize: '.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#0d2318',
              }}
            >
              <svg
                style={{ width: 12, height: 12 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>

              Nuevo
            </button>
          </div>
        </div>

        {/* TABLA */}
        {loading ? (

          <div
            style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '.7rem',
              color: '#9ab8a2',
            }}
          >
            Cargando...
          </div>

        ) : filtrados.length === 0 ? (

          <div
            style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: 'monospace',
              fontSize: '.7rem',
              color: '#9ab8a2',
            }}
          >
            No hay registros.
          </div>

        ) : (

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >

            <thead>
              <tr
                style={{
                  background: 'rgba(0,0,0,.03)',
                  borderBottom:
                    '1px solid rgba(0,0,0,.08)',
                }}
              >
                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '.56rem',
                    fontWeight: 600,
                    color: '#9ab8a2',
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                  }}
                >
                  ID
                </th>

                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '.56rem',
                    fontWeight: 600,
                    color: '#9ab8a2',
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                  }}
                >
                  Tipo
                </th>

                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '.56rem',
                    fontWeight: 600,
                    color: '#9ab8a2',
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                  }}
                >
                  Descripción
                </th>

                <th
                  style={{
                    padding: '8px 20px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '.56rem',
                    fontWeight: 600,
                    color: '#9ab8a2',
                    textTransform: 'uppercase',
                    letterSpacing: '.14em',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map(r => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      '1px solid rgba(0,0,0,.04)',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background =
                      '#f5faf6')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background =
                      'transparent')
                  }
                >
                  <td style={{ padding: '11px 20px' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '.65rem',
                        color: '#9ab8a2',
                        fontWeight: 600,
                      }}
                    >
                      #{r.id}
                    </span>
                  </td>

                  <td style={{ padding: '11px 20px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background:
                          'rgba(58,153,86,.1)',
                        color: '#2e7d46',
                        fontFamily: 'monospace',
                        fontSize: '.65rem',
                        fontWeight: 700,
                      }}
                    >
                      {r.tipo}
                    </span>
                  </td>

                  <td style={{ padding: '11px 20px' }}>
                    <span
                      style={{
                        fontSize: '.82rem',
                        color: '#1a2e22',
                      }}
                    >
                      {r.descripcion}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: '11px 20px',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      title="Editar"
                      onClick={() => {
                        setEditando(r);
                        setModalOpen(true);
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'rgba(59,130,246,.1)',
                        color: '#3b82f6',
                        margin: '0 auto',
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.background =
                          'rgba(59,130,246,.22)')
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.background =
                          'rgba(59,130,246,.1)')
                      }
                    >
                      <svg
                        style={{
                          width: 13,
                          height: 13,
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <ModalForm
          tabla={tabla.key}
          registro={editando}
          onClose={() => {
            setModalOpen(false);
            setEditando(null);
          }}
          onSaved={cargar}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {/* PAGE HEADER */}
      <div
        style={{
          marginBottom: 24,
          padding: '0 4px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            padding: '3px 10px 3px 8px',
            borderRadius: 999,
            background: 'rgba(58,153,86,.1)',
            border:
              '1px solid rgba(58,153,86,.25)',
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
            Administración
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
          Configuración de Campos
        </h2>

        <p
          style={{
            fontSize: '.72rem',
            color: '#3d5c47',
            fontFamily: 'monospace',
          }}
        >
          Gestión de valores para los selectores del sistema
        </p>
      </div>

      {/* PANELES */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {TABLAS.map(tabla => (
          <PanelTabla
            key={tabla.key}
            tabla={tabla}
          />
        ))}
      </div>
    </div>
  );
}