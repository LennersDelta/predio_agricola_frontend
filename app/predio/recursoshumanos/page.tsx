// app/predio/RecursosHumanos/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'sonner';

// TIPOS — alineados con campos del backend

interface RecursosHumanos{
  
  id: number;
  orden: string;
  predio: string;

  nombresApellidos: string;
  rut: string;
  tipoContrato: string;
  grado: string;
  cargoContratado: string;
  area: string;
  funcionActual: string;
  fechaInicioContrato: Date; 
  aniosServicio: number;
  ultimaCalificacion: string;
  capacitadoPrevencionRiesgo: boolean; 
  
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
          Esta acción no se puede deshacer.<br />El bien inmueble será eliminado permanentemente.
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
const PAGE_SIZES = [10, 25, 50, 100];

// COMPONENTE PRINCIPAL
function RecursoHumanoPageInner() {
  const searchParams = useSearchParams();
  const [tab,          setTab]          = useState<'predio'|'borradores'>(searchParams.get('tab') === 'borradores' ? 'borradores' : 'predio');
  const [data,         setData]         = useState<RecursoHumano[]>([]);
  const [borradores,   setBorradores]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingBorr,  setLoadingBorr]  = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

// Filtros
  const [fOrden, setFOrden] = useState('');
  const [fPredio, setFPredio] = useState('');
  const [fTipoContrato, setTipoContrato] = useState('');
  //const [fAnnio, setAnnio] = useState('');
  const [applied, setApplied] = useState({ orden: '',  predio: '',  tipoContrato: ''});

// Tabla
  const [search,   setSearch]   = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);
  const [sortCol,  setSortCol]  = useState('created_at');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

  //  Cargar datos 
  const cargaRecursoHumano = useCallback(() => {
    setLoading(true);
    api.get('/api/predio')
      .then(({ data: r }) => setData(r.data ?? r))
      .catch(() => toast.error('Error al cargar recursos humano'))
      .finally(() => setLoading(false));
  }, []);  

  useEffect(() => {
    cargaRecursoHumano();
  }, []);

  //  Opciones dinámicas para filtros 
  const opOrdenes = [...new Set(data.map(b => b.orden).filter(Boolean))].sort();
  const opPredios = [...new Set(data.map(b => b.predio).filter(Boolean))].sort();
  const opTipoContrato = [...new Set(data.map(b => b.tipoContrato).filter(Boolean))].sort();

    //  Aplicar filtros 
  const aplicar = () => {
    setApplied({orden: fOrden, predio: fPredio, tipoContrato: fTipoContrato});
    setPage(1);
  };
    const limpiar = () => {setFOrden(''); setFPredio(''); setTipoContrato(''); 
    setApplied({orden: '', predio: '', tipoContrato: '' });

    setSearch('');
    setPage(1);
  };
   const filtrosActivos = Object.values(applied).filter(Boolean).length;

       const filtered = useMemo(() => {
  return data
    .filter(b => {
      const orden = b.orden ?? '';
      const predio = b.predio ?? '';
      const sigla = b.tipoContrato ?? '';
      //const annio = b.annio ?? 0;

      return (
        (!applied.orden || orden.toLowerCase().includes(applied.orden.toLowerCase())) &&
        (!applied.predio || predio.toLowerCase().includes(applied.predio.toLowerCase())) &&
        (!applied.tipoContrato || predio.toLowerCase().includes(applied.tipoContrato.toLowerCase())) 
      );
    })
    .sort((a, b) => {
      const av = String((a as any)[sortCol] ?? '');
      const bv = String((b as any)[sortCol] ?? '');
      const cmp = av.localeCompare(bv, 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    }, [data, applied, search, sortCol, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (col: string) => {
      if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortCol(col); setSortDir('asc'); }
    };

    // ── Eliminar 
    const handleDelete = async () => {
      if (deleteId === null) return;
      const toastId = toast.loading('Eliminando...');
      try {
        await api.delete(`/api/bienes/${deleteId}`);
        setData(prev => prev.filter(b => b.id !== deleteId));
        toast.success('Bien eliminado correctamente', { id: toastId, duration: 3000 });
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Error al eliminar', { id: toastId, duration: 5000 });
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

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '3px 10px 3px 8px', borderRadius: 999, background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500, color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>Parque Vehicular</span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Parque Vehicular
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>Gestión Parque Vehicular</p>
        </div>
        <Link href="/predio/recursohumano/crear"
          style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#0d2318', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3aaf64,#7dd494)', boxShadow: '0 4px 16px rgba(76,202,122,.3)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Recurso humano
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

              <FI 
                label="Orden"
                placeholder="111125"
                value={fOrden}
                onChange={e => setFOrden(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aplicar()}
              />

              <FS             
                label="Predio"
                options={opPredios}
                value={fPredio}
                onChange={e => { setFPredio(e.target.value); aplicar(); }}
              />

              <FS 
                label="Tipo Contrato"
                options={opTipoContrato}
                value={fTipoContrato}
                onChange={e => { setTipoContrato(e.target.value); aplicar(); }}
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
                <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.9rem', fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.08em', lineHeight: 1 }}>Listado de Bienes</p>
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {([
                          ['id', 'ID', 'left'],
                          ['orden', 'N° Orden', 'left'],
                          ['predio', 'Predio', 'left'],

                          ['nombresApellidos', 'Nombres y Apellidos', 'left'],
                          ['rut', 'RUT', 'left'],
                          ['tipoContrato', 'Tipo Contrato', 'left'],
                          ['grado', 'Grado', 'left'],
                          ['cargoContratado', 'Cargo Contratado', 'left'],
                          ['area', 'Área', 'left'],
                          ['funcionActual', 'Función Actual', 'left'],

                          ['fechaInicioContrato', 'F. Inicio Contrato', 'center'],
                          ['aniosServicio', 'Años Servicio', 'center'],
                          ['ultimaCalificacion', 'Últ. Calificación', 'left'],

                          ['capacitadoPrevencionRiesgo', 'Prevención de Riesgo', 'center'],
                      ] as [string, string, string][]).map(([col, label, align]) => (
                        <th key={col} style={thS(align)} onClick={() => handleSort(col)}>
                          {label}
                          <span style={{ marginLeft: 4, fontSize: '.65rem', color: sortCol === col ? '#3a9956' : '#9ab8a2', opacity: sortCol === col ? 1 : .5 }}>
                            {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </th>
                      ))}
                      <th style={thS('center')}>Acciones</th>
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
                      <tr key={b.orden}
                        style={{ borderBottom: '1px solid rgba(0,0,0,.04)', transition: 'background .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5faf6')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#2e7d46', fontWeight: 600 }}>{b.predio}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>{b.siglaInstitucional}</span>
                        </td>
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '.8rem', color: '#1a2e22' }}> {b.annio}</span>
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

      {deleteId !== null && (
        <ModalEliminar onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      )}
    </div>


  );
}
export default function PredioPage() {
  return (
    <Suspense>
      <RecursoHumanoPageInner />
    </Suspense>
  );
}