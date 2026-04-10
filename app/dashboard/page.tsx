// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

// ── Tipos ──
interface RegionData {
  nombre: string;
  total: number;
  nuevas: number;
}

interface DashboardData {
  totalViviendas:  number;
  viviendasMes:    number;
  usuariosActivos: number;
  variacionMes:    number;
  porEstado:       Record<string, number>;
  tendencia:       number[];
  porRegion:       RegionData[];
}

const meses = ['Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene'];

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
  const [data,        setData]        = useState<DashboardData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [barsVisible, setBarsVisible] = useState(false);
  const [tooltipIdx,  setTooltipIdx]  = useState<number | null>(null);
  const [fecha,       setFecha]       = useState('');
  const [hora,        setHora]        = useState('');

  useEffect(() => {
    const now = new Date();
    setFecha(now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }));
    setHora(now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  useEffect(() => {
    api.get('/api/dashboard')
      .then(({ data: r }) => {
        setData(r);
        setTimeout(() => setBarsVisible(true), 200);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 300, gap: 12, fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>
        <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando dashboard...
      </div>
    );
  }

  const sorted     = [...data.porRegion].sort((a, b) => b.total - a.total);
  const maxRegion  = Math.max(...data.porRegion.map(r => r.total), 1);
  const maxTend    = Math.max(...data.tendencia, 1);

  // Distribución por estado para donut
  const estados = Object.entries(data.porEstado);
  const C = 251.33;
  const colores = ['#3a9956', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#34d399'];
  let offset = 0;
  const segmentos = estados.map(([label, val], i) => {
    const pct  = data.totalViviendas > 0 ? (val / data.totalViviendas) * 100 : 0;
    const dash = (C * pct) / 100;
    const seg  = { label, val, pct: Math.round(pct), dash, offset, color: colores[i % colores.length] };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12, marginBottom: 28, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                        padding: '3px 10px 3px 8px', borderRadius: 999,
                        background: 'rgba(58,153,86,.08)', border: '1px solid rgba(58,153,86,.2)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                            color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Resumen Ejecutivo
            </span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800,
                        color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Dashboard
          </h2>
          <p style={{ fontSize: '.78rem', color: '#6b8f75', fontFamily: 'monospace' }}>
            Predio Agricola — {fecha}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      borderRadius: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.1)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3a9956' }} />
          <span style={{ fontFamily: 'monospace', fontSize: '.62rem', color: '#3d5c47', letterSpacing: '.06em' }}>
            Actualizado {hora}
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          title="Total Predio" value={data.totalViviendas} pct={100}
          badge={`+${data.variacionMes}%`}
          badgeColor="rgba(58,153,86,.12)" accentColor="linear-gradient(90deg,#3aaf64,#7dd494)"
          barColor="linear-gradient(90deg,#3a9956,#3aaf64)"
          icon={<svg style={{ width: 18, height: 18, color: '#2e7d46' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard
          title="Cotizaciones este mes" value={data.viviendasMes}
          pct={Math.min(Math.round((data.viviendasMes / Math.max(data.totalViviendas, 1)) * 800), 100)}
          badge="Último mes"
          badgeColor="rgba(201,168,76,.15)" accentColor="linear-gradient(90deg,#8a6a18,#ecc84a)"
          barColor="linear-gradient(90deg,#8a6a18,#ecc84a)"
          icon={<svg style={{ width: 18, height: 18, color: '#ecc84a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Usuarios Activos" value={data.usuariosActivos}
          pct={100}
          badge="Últimos 30 días"
          badgeColor="rgba(96,165,250,.12)" accentColor="linear-gradient(90deg,#1d4ed8,#60a5fa)"
          barColor="linear-gradient(90deg,#1d4ed8,#93c5fd)"
          icon={<svg style={{ width: 18, height: 18, color: '#93c5fd' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Facturas" value={data.porRegion.length}
          pct={Math.round((data.porRegion.length / 16) * 100)}
          badge={`${Math.round((data.porRegion.length / 16) * 100)}% cobertura`}
          badgeColor="rgba(167,139,250,.15)" accentColor="linear-gradient(90deg,#6d28d9,#a78bfa)"
          barColor="linear-gradient(90deg,#6d28d9,#c4b5fd)"
          icon={<svg style={{ width: 18, height: 18, color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
      </div>

    </div>
  );
}