'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'sonner';

import { usePredio } from '@/hooks/usePredio';
import { useAuth } from '@/hooks/useAuth';

interface Combustible{  
  id: number;
  predio: string;
  mes: string;
  monto_asignado: number;
  monto_utilizado: number;
  saldo: number;
}
interface IngresoCombustible {
  id: number;
  numero_factura: string;
  proveedor: string;
  estado_factura: string;
  doe_respuesta: string;
  litros: number;
  monto: number;
  comprobante: string;
  patente: string;
  created_at: string;
}

// MODAL ELIMINAR
function ModalEliminar({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, padding: '32px 28px', maxWidth: 340, width: '90%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, margin: '0 auto 16px', background: 'rgba(252,165,165,.1)', border: '1px solid rgba(252,165,165,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: 22, height: 22, color: '#fca5a5' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          ¿Eliminar registro?
        </h3>
        <p style={{ fontSize: '.78rem', color: '#6b8f75', lineHeight: 1.6, marginBottom: 24 }}>
          Esta acción no se puede deshacer.<br />El detalle del combustible será eliminado permanentemente.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,.1)', background: '#eaf3ec', color: '#3d5c47', fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 700, fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#991b1b,#dc2626)', color: '#fff', fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 700, fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
// FILTROS
const siStyle: React.CSSProperties = {
  appearance: 'none', width: '100%', background: '#fff',
  border: '1px solid rgba(0,0,0,.1)', color: '#1a2e22', fontSize: '.8rem',
  borderRadius: 7, padding: '8px 12px', outline: 'none',
  fontFamily: '"Barlow",sans-serif', transition: 'border-color .18s, box-shadow .18s',
};
const lblStyle: React.CSSProperties = {
  display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
  textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5, fontFamily: 'monospace',
};
function FI({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <input {...p} style={siStyle}
        onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}
function FS({ label, options, ...p }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <select {...p} style={{ ...siStyle, paddingRight: 32, cursor: 'pointer', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
        <option value="">Todos</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
const selectArrow = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";
const PAGE_SIZES = [10, 25, 50, 100];

/* MODAL DETALLE DE COMBUSTIBLE */
function ModalDetalleCombustible({
  open,
  onClose,
  data,
  setData,
  loading,
  info,
  deleteId,
  setDeleteId,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  data: IngresoCombustible[];
  setData: React.Dispatch<React.SetStateAction<IngresoCombustible[]>>;
  loading: boolean;
  info: {
    predio: string;
    mes: string;
    monto_asignado: number;
    monto_utilizado: number;
    saldo: number;
  };
  deleteId: number | null;
  setDeleteId: React.Dispatch<React.SetStateAction<number | null>>;
  onDelete: () => void;
})  {
  if (!open) return null;
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0,0,0,.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: '"Barlow Condensed",sans-serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: 0,
                color: '#1a2e22',
              }}
            >
              Detalle Combustible
            </h2>

            <p
              style={{
                marginTop: 6,
                fontSize: '.75rem',
                color: '#6b8f75',
                fontFamily: 'monospace',
                
              }}
            >
                     <b style={{ color: '#2b3831' }}>Predio:</b> <b>{info.predio}</b>
              {' | '}<b style={{ color: '#2b3831' }}>Mes:</b>  {formatearMes(info.mes)
  .replace(/^./, c => c.toUpperCase())}
              {' | '}<b style={{ color: '#2b3831' }}>Asignado:</b> <b  style={{ color: '#000' }}>${Number(info.monto_asignado).toLocaleString('es-CL')}</b>
              {' | '}<b style={{ color: '#2b3831' }}>Utilizado:</b> <b style={{ color: '#991b1b' }}>${Number(info.monto_utilizado).toLocaleString('es-CL')}</b>
              {' | '}<b style={{ color: '#2b3831' }}>Saldo:</b> <b style={{ color: '#000' }}>${Number(info.saldo).toLocaleString('es-CL')}</b>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,.1)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              Cargando detalle...
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              No existen registros
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f6f8f7',
                    }}
                  >
                    {[
                      'Factura',
                      'Proveedor',
                      'Patente',
                      'Litros',
                      'Monto Utilizado',
                      'Saldo Disponible',
                      'Estado',
                      'DOE',
                      'Acciones'
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: 12,
                          textAlign: 'left',
                          fontSize: '.7rem',
                          fontFamily: 'monospace',
                          color: '#6b8f75',
                          borderBottom:
                            '1px solid rgba(0,0,0,.08)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let saldoDisponible = Number(info.monto_asignado);

                    return (
                      <>
                        {/* FILA INICIAL */}
                        <tr
                          style={{
                            background: '#f8faf8',
                            borderBottom: '1px solid rgba(0,0,0,.08)',
                          }}
                        >
                          <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>-</td>
                          <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                            <strong>Asignación Inicial</strong>
                          </td>
                          <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>-</td>
                          <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>-</td>
                          <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: '#16a34a',
                              }}
                            >
                              +${Number(info.monto_asignado).toLocaleString('es-CL')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: '#1a2e22',
                              }}
                            >
                              ${saldoDisponible.toLocaleString('es-CL')}
                            </span>
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                        {/* MOVIMIENTOS */}
                        {data.map((item) => {
                          saldoDisponible -= Number(item.monto);
                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderBottom: '1px solid rgba(0,0,0,.05)',
                              }}
                            >
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {item.numero_factura}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {item.proveedor}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {item.patente}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {Number(item.litros).toLocaleString('es-CL')}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#991b1b' }}>
                                  ${Number(item.monto).toLocaleString('es-CL')}
                                </span>
                              </td>
                              {/* SALDO ACUMULADO */}
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '.82rem',
                                    fontWeight: 700,
                                    color: saldoDisponible < 0 ? '#dc2626' : '#1a2e22',
                                  }}
                                >
                                  ${saldoDisponible.toLocaleString('es-CL')}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {item.estado_factura}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>
                                  {item.doe_respuesta}
                                </span>
                              </td>
                              <td style={{ padding: 12 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                  }}
                                >

                                  {item.comprobante && (
                                    <a
                                      href={item.comprobante}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Ver archivo"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background: "rgba(46,125,70,.1)",
                                        color: "#2e7d46",
                                        border: "1px solid rgba(46,125,70,.2)",
                                        textDecoration: "none",
                                      }}
                                    >
                                      👁
                                    </a>
                                  )}

                                  <button
                                    title="Eliminar"
                                    onClick={() => setDeleteId(item.id)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: 34,
                                      height: 34,
                                      borderRadius: 8,
                                      cursor: "pointer",
                                      border: "1px solid rgba(220,38,38,.2)",
                                      background: "rgba(220,38,38,.08)",
                                      color: "#dc2626",
                                    }}
                                  >
                                    🗑
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
        {deleteId !== null && (
          <ModalEliminar
            onCancel={() => setDeleteId(null)}
            onConfirm={onDelete}
          />
        )}
    </div>
  );
}

/* MODAL UPDATE ASIGNACION COMBUSTIBLE */
function ModalEditarAsignacion({
    open,
    onClose,
    form,
    setForm,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    form: any;
    setForm: any;
    onSave: () => void;
}) {

    if (!open) return null;

    return (
        <div
            /*onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}*/
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: 20,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 520,
                    background: "#fff",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
                }}
            >
                {/* HEADER */}

                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid rgba(0,0,0,.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontFamily: '"Barlow Condensed",sans-serif',
                                fontSize: "1.35rem",
                                fontWeight: 700,
                                color: "#1a2e22",
                            }}
                        >
                            Actualizar Asignación
                        </h2>
                        <p
                            style={{
                                marginTop: 6,
                                fontSize: ".75rem",
                                color: "#6b8f75",
                                fontFamily: "monospace",
                                lineHeight: 1.7,
                            }}
                        >
                            <b style={{ color: "#2b3831" }}>Predio:</b>{" "}
                            <b>{form.predio}</b>

                            {" | "}

                            <b style={{ color: "#2b3831" }}>Mes:</b>{" "}
                              {formatearMes(form.mes)
                                .replace(/^./, c => c.toUpperCase())}
                        </p>

                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            border: "1px solid rgba(0,0,0,.1)",
                            background: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* BODY */}

                <div
                    style={{
                        padding: 24,
                    }}
                >
                    <div>
                        <label style={lblStyle}>
                            Monto Asignado
                        </label>
                        <input
                            type="number"
                            value={form.monto_asignado}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    monto_asignado: e.target.value,
                                })
                            }
                            style={siStyle}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    style={{
                      padding: 20,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      borderTop: "1px solid rgba(0,0,0,.08)",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            height: 41,
                            padding: "10px 0",
                            borderRadius: 9,
                            cursor: "pointer",
                            border: "1px solid rgba(0,0,0,.1)",
                            background: "#eaf3ec",
                            color: "#6b8f75",
                            fontFamily: '"Barlow Condensed",sans-serif',
                            fontWeight: 700,
                            fontSize: ".85rem",
                            textTransform: "uppercase",
                            letterSpacing: ".07em",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        style={{
                          flex: 1,
                          height: 41,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                          padding: "10px 0",
                          borderRadius: 9,
                          border: "none",
                          cursor: "pointer",
                          fontFamily: '"Barlow Condensed",sans-serif',
                          fontSize: ".85rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          color: "#0d2318",
                          background: "linear-gradient(135deg,#3aaf64,#7dd494)",
                          boxShadow: "0 4px 14px rgba(76,202,122,.28)",
                          transition: "all .2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow =
                                "0 8px 20px rgba(76,202,122,.35)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                                "0 4px 14px rgba(76,202,122,.28)";
                        }}
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
/* SETEO DE MES */
  const formatearMes = (mes: string) => {
  if (!mes) return '';
  const [anio, numeroMes] = mes.substring(0, 7).split('-');
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const indice = Number(numeroMes) - 1;

  if (!anio || indice < 0 || indice > 11) {
    return mes;
  }
  return `${meses[indice]} ${anio}`;
};  
       
// COMPONENTE PRINCIPAL
function CombustiblePageInner() {
  const searchParams = useSearchParams();
  const [tab] = useState<'predio' | 'borradores'>(searchParams.get('tab') === 'borradores' ? 'borradores' : 'predio');
  const [data, setData] = useState<Combustible[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* MODAL */
  const [modalDetalle, setModalDetalle] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleData, setDetalleData] = useState<IngresoCombustible[]>([]);
  const [detalleInfo, setDetalleInfo] = useState({ predio: '',  mes: '',  monto_asignado: 0,  monto_utilizado: 0,  saldo: 0,});
 /*-------------------*/

// Filtros
  const [fPredio, setFPredio] = useState('');
  const [fMes, setFMes] = useState('');
  const [applied, setApplied] = useState({ predio: '', mes: '', });

// Tabla
  const [search,   setSearch]   = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);
  const [sortCol, setSortCol]   = useState<keyof Combustible>('id');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

  
  const { predios, loading: loadingPredios, error: errorPredios } = usePredio();






  //  Cargar datos 
  const cargaCombustible = useCallback(() => {
      setLoading(true);

      api.get('/api/combustible/asignacion')
        .then(({ data: r }) => setData(r.data ?? r))
        .catch(() =>
          toast.error('Error al cargar asignaciones')
        )
        .finally(() => setLoading(false));
    }, []);

  useEffect(() => {
    cargaCombustible();
  }, [cargaCombustible]);

  /* MODAL */
  const abrirDetalle = async (item: Combustible) => {
    try {
      setDetalleLoading(true);
      setModalDetalle(true);
      setDetalleInfo({
        predio: item.predio,
        mes: item.mes,
        monto_asignado: item.monto_asignado,
        monto_utilizado: item.monto_utilizado,
        saldo: item.saldo,
      });
      const response = await api.get(
        `/api/combustible/asignacion/${item.id}/detalle`
      );
      setDetalleData(response.data.data ?? []);
    } catch (error) {
      toast.error('Error al cargar detalle');
      setModalDetalle(false);
    } finally {
      setDetalleLoading(false);
    }
  };

  const [modalEditar, setModalEditar] = useState(false);
  const [formEditar, setFormEditar] = useState({id: 0, predio: '', mes: '', monto_asignado: '',});

  const abrirEditar = (item: Combustible) => {
  setFormEditar({
      id: item.id,
      predio: item.predio,
      mes: item.mes,
      monto_asignado: String(item.monto_asignado),
    });

    setModalEditar(true);
  };

  const actualizarAsignacion = async () => {
    try {
      await api.put(`/api/combustible/asignacion/${formEditar.id}`, 
        { monto_asignado: Number(formEditar.monto_asignado), }
      );
      toast.success("Asignación actualizada");
      setModalEditar(false);
      cargaCombustible();
    } catch {
      toast.error("No fue posible actualizar la asignación");
    }
  };

  //  Opciones dinámicas para filtros 
  const opPredios = [
    ...new Set(data.map(b => b.predio).filter(Boolean)),
  ].sort();
  const opMeses = [
    ...new Set(
      data
        .map(b => formatearMes(b.mes))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  //  Aplicar filtros 
  const aplicar = () => {
    setApplied({predio: fPredio, mes: fMes,});
    setPage(1);
  };

  const limpiar = () => {
    setFPredio(''); setFMes('');
    setApplied({predio: '', mes: '',});

    setSearch('');
    setPage(1);
  };
  const filtrosActivos = Object.values(applied).filter(Boolean).length;

  const filtered = useMemo(() => {
    return data
      .filter(b => {
        const predio = b.predio ?? '';
        const mes = formatearMes(b.mes);

        const textSearch = search.toLowerCase();

        return (
          (!applied.predio ||
            predio.toLowerCase().includes(applied.predio.toLowerCase())) &&
          (!applied.mes || mes === applied.mes) &&
          (!search ||
            [
              b.id,
              b.predio,
              b.mes,
              b.monto_asignado,
              b.monto_utilizado,
              b.saldo,
            ]
              .join(' ')
              .toLowerCase()
              .includes(textSearch))
        );
      })
      .sort((a, b) => {
        const av = String(a[sortCol] ?? '');
        const bv = String(b[sortCol] ?? '');

        const cmp = av.localeCompare(bv, 'es', {
          numeric: true,
        });

        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, applied, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: keyof Combustible) => {
    if (sortCol === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // ELIMINAR DETALLE DE COMBUSTIBLE //
  const handleDelete = async () => {
      if (deleteId === null) return;
      const toastId = toast.loading("Eliminando...");

      try {
          await api.delete(`/api/combustible/deleteDetalleCombustible/${deleteId}`);
          // eliminar del detalle
          setDetalleData(prev =>
              prev.filter(x => x.id !== deleteId)
          );
          // recargar la tabla principal
          await cargaCombustible();
          toast.success("Registro eliminado correctamente", {
              id: toastId,
              duration: 3000,
          });
      } catch (err: any) {
          toast.error(
              err.response?.data?.message ?? "Error al eliminar",
              {
                  id: toastId,
                  duration: 4000,
              }
          );
      } finally {
          setDeleteId(null);
      }
  };

    const SortIcon = ({ col }: { col: string }) => (
      <span style={{ marginLeft: 4, fontSize: '.65rem', color: sortCol === col ? '#3a9956' : '#9ab8a2', opacity: sortCol === col ? 1 : .5 }}>
        {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
    const thS = (align = 'left'): React.CSSProperties => ({
      padding: '9px 14px', fontSize: '.56rem', fontWeight: 600, letterSpacing: '.16em',
      textTransform: 'uppercase', color: '#9ab8a2', borderBottom: '1px solid rgba(0,0,0,.1)',
      whiteSpace: 'nowrap', textAlign: align as any, fontFamily: 'monospace',
      background: 'rgba(0,0,0,.03)', cursor: 'pointer', userSelect: 'none',
    });

    // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '3px 10px 3px 8px', borderRadius: 999, background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500, color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>Combustible</span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Combustible
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>Gestión Combustible</p>
        </div>
        <Link href="/predio/combustible/asignacion/crear"
          style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#0d2318', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3aaf64,#7dd494)', boxShadow: '0 4px 16px rgba(76,202,122,.3)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva asignacion
        </Link>
      </div>    

      {tab === 'predio' && <>

          {/* FILTROS */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
            <svg style={{ width: 13, height: 13, color: '#2e7d46', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Filtros
            </span>

            {filtrosActivos > 0 && (
              <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(58,153,86,.12)', border: '1px solid rgba(58,153,86,.25)', color: '#2e7d46' }}>
                {filtrosActivos} {filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}
              </span>
            )}
          </div>

          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: 12, alignItems: 'end' }}>

              {/* Predio desde hook */}
              <div>
                 <label style={lblStyle}>Predio</label>
                  <select
                    value={fPredio}
                    onChange={e => setFPredio(e.target.value)}
                    disabled={loadingPredios || predios.length === 0}
                    style={{
                        ...siStyle,
                        paddingRight: 32,
                        cursor: loadingPredios ? 'wait' : 'pointer',
                        backgroundImage: selectArrow,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        opacity: loadingPredios ? 0.7 : 1
                    }}
                >
                    {loadingPredios ? (
                        <option value="">Cargando...</option>
                    ) : predios.length > 1 ? (
                        <option value="">Todos</option>
                    ) : null}

                    {predios.map(p => (
                        <option key={p.id} value={p.nombre}>
                            {p.nombre}
                        </option>
                    ))}
                </select>
              </div>

              <FS
                label="Mes"
                options={opMeses}
                value={fMes}
                onChange={e => {
                  setFMes(e.target.value);
                  aplicar();
                }}
              />
            

              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <button
                  onClick={aplicar}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: '"Barlow Condensed",sans-serif',
                    fontSize: '.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#0d2318',
                    background: 'linear-gradient(135deg,#3aaf64,#7dd494)'
                  }}
                >
                  <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  Buscar
                </button>

                <button
                  onClick={limpiar}
                  title="Limpiar"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 7,
                    flexShrink: 0,
                    background: '#eaf3ec',
                    border: '1px solid rgba(0,0,0,.1)',
                    color: '#6b8f75',
                    cursor: 'pointer'
                  }}
                >
                  <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>

          {/* TABLA */}

          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>

            {/* Header tabla */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,.06)', background: 'rgba(0,0,0,.02)' }}>
              <div>
                <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.9rem', fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.08em', lineHeight: 1 }}>Listado de Predio</p>
                <p style={{ fontSize: '.65rem', color: '#6b8f75', marginTop: 2, fontFamily: 'monospace' }}>
                  <span style={{ fontWeight: 600, color: '#2e7d46' }}>{filtered.length.toLocaleString('es-CL')}</span> registros encontrados
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#9ab8a2', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input type="text" placeholder="Buscar en tabla..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ padding: '6px 12px 6px 28px', borderRadius: 7, fontSize: '.75rem', border: '1px solid rgba(0,0,0,.1)', background: '#fff', color: '#1a2e22', outline: 'none', fontFamily: 'monospace', width: 190 }}
                    onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  style={{ padding: '6px 28px 6px 10px', borderRadius: 7, fontFamily: 'monospace', fontSize: '.72rem', border: '1px solid rgba(0,0,0,.1)', background: '#fff', color: '#3d5c47', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / pág</option>)}
                </select>
              
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <svg style={{ width: 24, height: 24, color: '#3a9956', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p style={{ fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>Cargando registros...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      {([
                          ['id', 'ID', 'left'],
                          ['predio', 'Predio', 'left'],
                          ['mes', 'Mes', 'left'],
                          ['monto_asignado','Monto Asignado', 'left', ],
                          ['monto_utilizado', 'Monto Utilizado','left', ],
                          ['saldo', 'Saldo', 'left'],
                      ] as [
                        keyof Combustible,
                        string,
                        string
                      ][]).map(
                        ([col, label, align]) => (
                          <th
                            key={String(col)}
                            style={thS(align)}
                            onClick={() =>
                              handleSort(col)
                            }
                          >
                            {label}

                            <span
                              style={{
                                marginLeft: 4,
                                fontSize: '.65rem',
                                color:
                                  sortCol === col
                                    ? '#3a9956'
                                    : '#9ab8a2',
                                opacity:
                                  sortCol === col
                                    ? 1
                                    : 0.5,
                              }}
                            >
                              {sortCol === col
                                ? sortDir === 'asc'
                                  ? '↑'
                                  : '↓'
                                : '↕'}
                            </span>
                          </th>
                        )
                      )}

                      <th style={thS('center')}>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#9ab8a2', fontFamily: 'monospace', fontSize: '.78rem' }}>
                          No hay registros que coincidan.
                        </td>
                      </tr>
                    ) : paginated.map(b => (
                      <tr key={b.id}
                        style={{ borderBottom: '1px solid rgba(0,0,0,.04)', transition: 'background .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5faf6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >

                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#2e7d46', fontWeight: 600 }}>#{b.id}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>{b.predio}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '.82rem',
                              fontWeight: 700,
                              color: '#1a2e22'
                            }}
                          >
                            {formatearMes(b.mes)
                            .replace(/^./, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>${Number(b.monto_asignado).toLocaleString('es-CL')}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>${Number(b.monto_utilizado).toLocaleString('es-CL')}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>${Number(b.saldo).toLocaleString('es-CL')}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                {/* EDITAR */}
                                <button
                                    onClick={() => abrirEditar(b)}
                                    title="Editar"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        background: 'rgba(147,197,253,.1)',
                                        color: '#93c5fd',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background .15s',
                                    }}
                                    onMouseEnter={e => (
                                        e.currentTarget.style.background = 'rgba(147,197,253,.22)'
                                    )}
                                    onMouseLeave={e => (
                                        e.currentTarget.style.background = 'rgba(147,197,253,.1)'
                                    )}
                                >
                                    <svg
                                        style={{ width: 13, height: 13 }}
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

                                {/* VER DETALLE */}
                                <button
                                    onClick={() => abrirDetalle(b)}
                                    title="Ver detalle"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        background: 'rgba(58,153,86,.1)',
                                        color: '#3a9956',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background .15s',
                                    }}
                                    onMouseEnter={e => (
                                        e.currentTarget.style.background = 'rgba(76,202,122,.22)'
                                    )}
                                    onMouseLeave={e => (
                                        e.currentTarget.style.background = 'rgba(58,153,86,.1)'
                                    )}
                                >
                                    <svg
                                        style={{ width: 13, height: 13 }}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '13px 20px', borderTop: '1px solid rgba(0,0,0,.04)' }}>
              <p style={{ fontSize: '.65rem', color: '#6b8f75', fontFamily: 'monospace' }}>
                Mostrando {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de <span style={{ color: '#2e7d46', fontWeight: 600 }}>{filtered.length}</span>
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: '«', action: () => setPage(1) },
                  { label: '‹', action: () => setPage(p => Math.max(1, p - 1)) },
                  ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages, page <= 3 ? i + 1 : page + i - 2));
                    return { label: String(p), action: () => setPage(p) };
                  }),
                  { label: '›', action: () => setPage(p => Math.min(totalPages, p + 1)) },
                  { label: '»', action: () => setPage(totalPages) },
                ].map(({ label, action }, i) => {
                  const isActive = label === String(page) && !['«', '‹', '›', '»'].includes(label);
                  return (
                    <button key={i} onClick={action} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 30, height: 30, padding: '0 8px', borderRadius: 6, fontFamily: 'monospace', fontSize: '.7rem', fontWeight: 600, border: `1px solid ${isActive ? 'rgba(58,153,86,.3)' : 'rgba(0,0,0,.1)'}`, background: isActive ? 'rgba(58,153,86,.08)' : '#fff', color: isActive ? '#2e7d46' : '#6b8f75', cursor: 'pointer' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          </> }
        <ModalDetalleCombustible
            open={modalDetalle}
            onClose={() => setModalDetalle(false)}
            data={detalleData}
            setData={setDetalleData}
            loading={detalleLoading}
            info={detalleInfo}
            deleteId={deleteId}
            setDeleteId={setDeleteId}
            onDelete={handleDelete}
        />
        <ModalEditarAsignacion
            open={modalEditar}
            onClose={() => setModalEditar(false)}
            form={formEditar}
            setForm={setFormEditar}
            onSave={actualizarAsignacion}
        />
    </div>


  );
}
export default function PredioPage() {
  return (
    <Suspense>
      <CombustiblePageInner />
    </Suspense>
  );
}