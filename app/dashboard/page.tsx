// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, 
  Cell,
} from 'recharts';
// ── Tipos ──
interface PredioData {
  id: number;
  nombre: string;
  total: number;
}
interface TipoVehiculoData {
  id: number;
  nombre: string;
  total: number;
}
interface UltimoVehiculo {
  orden: number;
  ppu: string;
  marca: string;
  modelo: string;
  anio: number;
  predio: string;
  tipo: string;
  created_at: string;
}

interface VehiculoDetalle {
  orden: number;
  ppu: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  fecha_adquisicion: string;
  vencimiento_permiso_circulacion: string;
  vencimiento_seguro_obligatorio: string;
}

interface FuncionarioDetalle {
  orden: number;
  nombres_apellidos: string;
  rut: string;
  cargo_contratado: string;
  area_funciones: string;
  funcion_actual: string;
  fecha_inicio_contrato: string;
  anios_servicio: number;
  ultima_calificacion: string;
  capacitado_prevencion_riesgo: boolean;
  grado: string;
  tipo_contrato: string;
}

interface InsumoPorPredio {
  predio: number;
  nombre: string;
  total_por_predio: number;
  total_cotizacion_por_predio: number;
}

interface DashboardData {
  totalVehiculos: number;
  porPredio: PredioData[];
  porTipo: TipoVehiculoData[];
  ultimosVehiculos: UltimoVehiculo[];
  totalPredio: number;
  
  // RRHH //
  totalFuncionarios: number;
  funcionariosPorPredio: PredioData[];

   // INSUMOS
  insumosproductos: InsumoPorPredio[];
}


// FORMATEO DE FECHAS //
const formatearFecha = (fecha?: string) => {
  if (!fecha) return '';

  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

// COLORES DEL GRAFICO //
const coloresPredios = [
  '#3a9956',
  '#2563eb',
  '#7c3aed',
  '#ea580c',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#4f46e5',
  '#059669',
  '#be123c',
];

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, badge, badgeColor, accentColor, barColor, pct, icon }: {
  title: string; value: number; badge: string;
  badgeColor: string; accentColor: string; barColor: string;
  pct: number; icon: React.ReactNode;
}) {
  const [barW, setBarW] = useState(0);
  useEffect(() => { setTimeout(() => setBarW(Math.min(pct, 100)), 300); }, [pct]);

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 12, padding: '20px 22px',
      background: '#fff', border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 12px rgba(0,0,0,.08)', transition: 'transform .22s, box-shadow .22s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor, borderRadius: '12px 12px 0 0' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(0,0,0,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.03) 1px,transparent 1px)',
        backgroundSize: '24px 24px' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: badgeColor }}>
          {icon}
        </div>
        <span style={{ fontSize: '.62rem', padding: '3px 8px', borderRadius: 999, fontWeight: 600,
          background: badgeColor, color: '#1a2e22', fontFamily: 'monospace' }}>{badge}</span>
      </div>
      <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.5rem', fontWeight: 800, color: '#1a2e22', lineHeight: 1, margin: '12px 0 4px', position: 'relative' }}>
        {value.toLocaleString('es-CL')}
      </p>
      <p style={{ fontSize: '.7rem', color: '#6b8f75', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 500 }}>{title}</p>
      <div style={{ height: 3, background: 'rgba(0,0,0,.03)', borderRadius: 999, overflow: 'hidden', marginTop: 14 }}>
        <div style={{ width: `${barW}%`, height: '100%', borderRadius: 999, background: barColor, transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}
// ── BarCell ───────────────────────────────────────────────────────────────────
function BarCell({ pct, isTop }: { pct: number; isTop: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 300); }, [pct]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,.07)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', borderRadius: 999,
          background: isTop ? 'linear-gradient(90deg,#8a6a18,#ecc84a)' : 'linear-gradient(90deg,#3a9956,#3aaf64)',
          transition: 'width 1.1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#6b8f75', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}
// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const [predioSeleccionado, setPredioSeleccionado] = useState<string>('');
  const [vehiculosPredio, setVehiculosPredio] = useState<VehiculoDetalle[]>([]);
  const [loadingPredio, setLoadingPredio] = useState(false);

  const [predioRHSeleccionado, setPredioRHSeleccionado] = useState('');
  const [funcionariosPredio, setFuncionariosPredio] = useState<FuncionarioDetalle[]>([]);
  const [loadingRH, setLoadingRH] = useState(false);

   useEffect(() => {
    const now = new Date();

    setFecha(
      now.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric',
      })
    );

    setHora(
      now.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, []);

  useEffect(() => {
    api
      .get('/api/dashboard')
      .then(({ data }) => {
        setData(data);
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // PREDIO //
  const handlePredioClick = async (
    predioId: number,
    nombre: string
  ) => {

    try {

      // CERRAR RRHH
      setPredioRHSeleccionado('');
      setFuncionariosPredio([]);

      setLoadingPredio(true);
      setPredioSeleccionado(nombre);

      const { data } = await api.get(
        `/api/dashboard/predio/${predioId}`
      );
      setVehiculosPredio(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPredio(false);
    }
  };

  // RRHH //
  const handleRHClick = async (
    predioId: number,
    nombre: string
  ) => {
    try {
      // CERRAR VEHÍCULOS
      setPredioSeleccionado('');
      setVehiculosPredio([]);

      setLoadingRH(true);
      setPredioRHSeleccionado(nombre);
      const { data } = await api.get(
        `/api/dashboard/recursoshumanos/${predioId}`
      );
      setFuncionariosPredio(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRH(false);
    }
  };

  if (loading || !data) {
    return (
      <div
        style={{
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7a9383',
          fontFamily: 'monospace',
        }}
      >
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Barlow", sans-serif' }}>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 14,
          marginBottom: 30,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(58,153,86,.08)',
              border: '1px solid rgba(58,153,86,.18)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#3a9956',
              }}
            />

            <span
              style={{
                fontSize: '.62rem',
                fontFamily: 'monospace',
                color: '#2f6f43',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              Información de Predio
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '2.3rem',
              lineHeight: 1,
              fontWeight: 800,
              color: '#1a2e22',
              fontFamily: '"Barlow Condensed", sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              marginTop: 8,
              color: '#6b8f75',
              fontFamily: 'monospace',
              fontSize: '.72rem',
            }}
          >
            Gestión de Predio — {fecha}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 10,
            background: '#fff',
            border: '1px solid rgba(0,0,0,.08)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#3a9956',
            }}
          />

          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '.65rem',
              color: '#486353',
            }}
          >
            Actualizado {hora}
          </span>
        </div>
      </div>

      {/* STATS */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Predios"
          value={data.totalPredio || 0}
          pct={100}
          badge="Activos"
          badgeColor="rgba(96,165,250,.12)"
          accentColor="linear-gradient(90deg,#2563eb,#60a5fa)"
          barColor="linear-gradient(90deg,#2563eb,#93c5fd)"
          icon={
            <svg
              style={{ width: 18, height: 18, color: '#60a5fa' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 21h18M5 21V7l8-4 6 4v14"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Vehículos"
          value={data.totalVehiculos}
          pct={100}
          badge="Registrados"
          badgeColor="rgba(58,153,86,.12)"
          accentColor="linear-gradient(90deg,#3aaf64,#7dd494)"
          barColor="linear-gradient(90deg,#3a9956,#3aaf64)"
          icon={
            <svg
              style={{ width: 18, height: 18, color: '#2e7d46' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17V15a3 3 0 013-3h0a3 3 0 013 3v2m-9 0h12M5 17l1-5a2 2 0 012-2h8a2 2 0 012 2l1 5"
              />
            </svg>
          }
        />
          <StatCard
            title="Total Funcionarios"
            value={data.totalFuncionarios || 0}
            pct={100}
            badge="Contratados"
            badgeColor="rgba(168,85,247,.12)"
            accentColor="linear-gradient(90deg,#7c3aed,#a855f7)"
            barColor="linear-gradient(90deg,#7c3aed,#c084fc)"
            icon={
              <svg
                style={{ width: 18, height: 18, color: '#7c3aed' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m5-12a4 4 0 110 8 4 4 0 010-8z"
                />
              </svg>
            }
          />
      </div>

      {/* GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 20,
            marginBottom: 24,
            alignItems: 'start',
          }}
        >

        {/* POR PREDIO */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,.08)',
            padding: 22,
            boxShadow: '0 2px 10px rgba(0,0,0,.04)',
          }}
        >
          <p
            style={{
              fontFamily: '"Barlow Condensed",sans-serif',
              fontSize: '.9rem',
              fontWeight: 700,
              color: '#1a2e22',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              lineHeight: 1,
              marginBottom: 18,
            }}
          >
            Vehículos por Predio
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {data.porPredio.map((item, idx) => {

              const pct = Math.round(
                (item.total / data.totalVehiculos) * 100
              );

              return (
                <div
                  key={item.id}
                  onClick={() =>
                    handlePredioClick(
                      item.id,
                      item.nombre
                    )
                  }
                  style={{
                    cursor: 'pointer',
                    padding: 12,
                    borderRadius: 12,
                    transition: '.2s',
                    border:
                      predioSeleccionado === item.nombre
                        ? '1px solid rgba(58,153,86,.35)'
                        : '1px solid transparent',
                    background:
                      predioSeleccionado === item.nombre
                        ? 'rgba(58,153,86,.06)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) => {

                    if (predioSeleccionado !== item.nombre) {
                      e.currentTarget.style.background =
                        'rgba(58,153,86,.04)';
                    }

                  }}
                  onMouseLeave={(e) => {

                    if (predioSeleccionado !== item.nombre) {
                      e.currentTarget.style.background =
                        'transparent';
                    }

                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#1f3528',
                      }}
                    >
                      {item.nombre}
                    </span>

                    <strong
                      style={{
                        color: '#2f6f43',
                      }}
                    >
                      {item.total}
                    </strong>
                  </div>

                  <BarCell
                    pct={pct}
                    isTop={idx === 0}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* RRHH */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,.08)',
            padding: 22,
            boxShadow: '0 2px 10px rgba(0,0,0,.04)',
          }}
        >

          <p
            style={{
              fontFamily: '"Barlow Condensed",sans-serif',
              fontSize: '.9rem',
              fontWeight: 700,
              color: '#1a2e22',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              lineHeight: 1,
              marginBottom: 18,
            }}
          >
            Funcionarios por Predio
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >

            {data.funcionariosPorPredio.map((item, idx) => {

              const pct = Math.round(
                (item.total / data.totalFuncionarios) * 100
              );

              return (

                <div
                  key={item.id}
                  onClick={() =>
                    handleRHClick(item.id, item.nombre)
                  }
                  style={{
                    cursor: 'pointer',
                    padding: 12,
                    borderRadius: 12,
                    transition: '.2s',
                    border:
                      predioRHSeleccionado === item.nombre
                        ? '1px solid rgba(124,58,237,.35)'
                        : '1px solid transparent',
                    background:
                      predioRHSeleccionado === item.nombre
                        ? 'rgba(124,58,237,.06)'
                        : 'transparent',
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#1f3528',
                      }}
                    >
                      {item.nombre}
                    </span>

                    <strong
                      style={{
                        color: '#7c3aed',
                      }}
                    >
                      {item.total}
                    </strong>

                  </div>

                  <BarCell
                    pct={pct}
                    isTop={idx === 0}
                  />

                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* DETALLE PREDIO */}
      {predioSeleccionado && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,.08)',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,.04)',
            marginBottom: 24,
          }}
        >

          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(0,0,0,.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >

            <div>
              
              <p
                style={{
                  fontFamily: '"Barlow Condensed",sans-serif',
                  fontSize: '.9rem',
                  fontWeight: 700,
                  color: '#1a2e22',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  lineHeight: 1,
                  marginBottom: 18,
                }}
              >
                Vehículos de predio  {predioSeleccionado}
              </p>
              <p
                style={{
                  marginTop: 6,
                  marginBottom: 0,
                  color: '#6b8f75',
                  fontSize: '.75rem',
                  fontFamily: 'monospace',
                }}
              >
                Total registrados: {vehiculosPredio.length}
              </p>
            </div>

            <button
              onClick={() => {
                setPredioSeleccionado('');
                setVehiculosPredio([]);
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 9,
                fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                color: '#6b8f75', background: '#eaf3ec',
                border: '1px solid rgba(0,0,0,.1)', textDecoration: 'none'
              }}
            >
              Cerrar
            </button>
          </div>

          {loadingPredio ? (

            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#6b8f75',
                fontFamily: 'monospace',
              }}
            >
              Cargando vehículos...
            </div>

          ) : (

            <div style={{ overflowX: 'auto' }}>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead
                  style={{
                    background: 'rgba(58,153,86,.05)',
                  }}
                >
                  <tr>
                    {[
                      'PPU',
                      'Marca',
                      'Modelo',
                      'Año',
                      'Tipo',
                      'Permiso',
                      'SOAP',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '14px 18px',
                          fontSize: '.72rem',
                          color: '#486353',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>

                  {vehiculosPredio.length === 0 ? (

                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 30,
                          textAlign: 'center',
                          color: '#7a9383',
                        }}
                      >
                        No existen vehículos registrados
                      </td>
                    </tr>

                  ) : (

                    vehiculosPredio.map((v) => (

                      <tr
                        key={v.orden}
                        style={{
                          borderTop:
                            '1px solid rgba(0,0,0,.05)',
                        }}
                      >
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem',  fontWeight: 600 }}>{v.ppu || '-'}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem',  fontWeight: 600 }}>{v.marca}</span>
                        </td>                 
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem',  fontWeight: 600 }}>{v.modelo}</span>
                        </td>                            
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem',  fontWeight: 600 }}>{v.anio}</span>
                        </td>                    
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem',  fontWeight: 600 }}>{v.tipo}</span>
                        </td>  
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 600 }}>
                            {v.vencimiento_permiso_circulacion 
                              ? formatearFecha(v.vencimiento_permiso_circulacion) 
                              : ''
                            }
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 600 }}>
                            {v.vencimiento_seguro_obligatorio 
                              ? formatearFecha(v.vencimiento_seguro_obligatorio) 
                              : ''
                            }
                          </span>
                        </td>                                                
                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETALLE PERSONA POR PREDIO RRHH */}
      {predioRHSeleccionado && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,.08)',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,.04)',
            marginBottom: 24,
            marginTop: 24,
          }}
        >

          <div
            style={{
              padding: '18px 22px',
              borderBottom: '1px solid rgba(0,0,0,.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >

            <div>

              <p
                style={{
                  fontFamily: '"Barlow Condensed",sans-serif',
                  fontSize: '.9rem',
                  fontWeight: 700,
                  color: '#1a2e22',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 10,
                }}
              >
                Funcionarios de {predioRHSeleccionado}
              </p>

              <p
                style={{
                  color: '#6b8f75',
                  fontSize: '.75rem',
                  fontFamily: 'monospace',
                }}
              >
                Total registrados: {funcionariosPredio.length}
              </p>

            </div>

            <button
              onClick={() => {
                setPredioRHSeleccionado('');
                setFuncionariosPredio([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 20px',
                borderRadius: 9,
                fontFamily: '"Barlow Condensed",sans-serif',
                fontSize: '.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                color: '#6b8f75',
                background: '#eaf3ec',
                border: '1px solid rgba(0,0,0,.1)',
                textDecoration: 'none'
              }}
            >
              Cerrar
            </button>

          </div>

          {loadingRH ? (

            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: '#6b8f75',
                fontFamily: 'monospace',
              }}
            >
              Cargando funcionarios...
            </div>

          ) : (

            <div style={{ overflowX: 'auto' }}>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >

                <thead
                  style={{
                    background: 'rgba(124,58,237,.05)',
                  }}
                >
                  <tr>
                    {[
                      'Nombre',
                      'RUT',
                      'Cargo',
                      'Área',
                      'Función',
                      'Años Servicios'
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '14px 18px',
                          fontSize: '.72rem',
                          color: '#486353',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>

                  {funcionariosPredio.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: 30,
                          textAlign: 'center',
                          color: '#7a9383',
                        }}
                      >
                        No existen funcionarios registrados
                      </td>
                    </tr>

                  ) : (

                    funcionariosPredio.map((f) => (

                      <tr
                        key={f.orden}
                        style={{
                          borderTop: '1px solid rgba(0,0,0,.05)',
                        }}
                      >

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                            fontWeight: 600
                          }}>
                            {f.nombres_apellidos}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                          }}>
                            {f.rut}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                          }}>
                            {f.cargo_contratado || '-'}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                          }}>
                            {f.area_funciones || '-'}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                          }}>
                            {f.funcion_actual || '-'}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '.72rem',
                          }}>
                            {f.anios_servicio || 0}
                          </span>
                        </td>

                      </tr>

                    ))

                  )}

                </tbody>
              </table>
            </div>
            )}
        </div>
      )}

      {/* GRAFICO INSUMOS POR PREDIO */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,.08)',
          padding: 22,
          boxShadow: '0 2px 10px rgba(0,0,0,.04)',
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontFamily: '"Barlow Condensed",sans-serif',
            fontSize: '.9rem',
            fontWeight: 700,
            color: '#1a2e22',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Valores Totales de insumos y productos por Predio
        </p>

        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.insumosproductos}
              margin={{
                top: 10,
                right: 20,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="nombre"
                angle={-15}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{
                  fontSize: 12,
                  fill: '#486353',
                }}
              />

              <YAxis
                tickFormatter={(value) =>
                  `$${Number(value).toLocaleString('es-CL')}`
                }
                tick={{
                  fontSize: 12,
                  fill: '#486353',
                }}
              />

              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString('es-CL')}`,
                  'Total',
                ]}
              />

              <Bar
                dataKey="total_por_predio"
                radius={[6, 6, 0, 0]}
              >
                {data.insumosproductos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      coloresPredios[index % coloresPredios.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      {/* RESUMEN */}
      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(280px,1fr))',
          gap: 14,
        }}
      >
        {data.insumosproductos.map((item, index) => (
          <div
            key={item.predio}
            style={{
              border: '1px solid rgba(0,0,0,.06)',
              borderLeft: `6px solid ${
                coloresPredios[index % coloresPredios.length]
              }`,
              borderRadius: 10,
              padding: '14px',
              background: '#fafafa',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '.72rem',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: '#6b8f75',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Fundo {item.nombre}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {/* TOTAL COTIZACIÓN */}
              <div>
                <span
                  style={{
                    fontSize: '.72rem',
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Total Cotización
                </span>

                <strong
                  style={{
                    display: 'block',
                    marginTop: 6,
                    fontSize: '1rem',
                    color: '#1d4ed8',
                    fontFamily: 'monospace',
                  }}
                >
                  $
                  {Number(
                    item.total_cotizacion_por_predio || 0
                  ).toLocaleString('es-CL')}
                </strong>
              </div>

              {/* TOTAL PAGADO */}
              <div>
                <span
                  style={{
                    fontSize: '.72rem',
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Total Pagado
                </span>

                <strong
                  style={{
                    display: 'block',
                    marginTop: 6,
                    fontSize: '1rem',
                    color: '#15803d',
                    fontFamily: 'monospace',
                  }}
                >
                  $
                  {Number(
                    item.total_por_predio || 0
                  ).toLocaleString('es-CL')}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>



    </div>
  </div>
  );
}