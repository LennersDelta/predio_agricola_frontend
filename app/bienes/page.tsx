// app/bienes/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS — alineados con campos del backend
// ─────────────────────────────────────────────────────────────────────────────
interface Bien {
  id: number;
  uuid: string;
  carpeta: string;
  tipo_registro?: 'propiedad' | 'sub_propiedad';
  propiedad_id?: number | null;
  nombre_conjunto: string;
  rol_avaluo: string;
  tipo_propiedad_id: number;
  tipo_propiedad?: { id: number; descripcion: string };
  estado_propiedad_id: number;
  estado_propiedad?: { id: number; descripcion: string };
  region_id: number;
  region?: { id: number; descripcion: string };
  provincia_id: number;
  comuna_id: number;
  comuna?: { id: number; descripcion: string };
  direccion: string;
  tasacion_comercial: number;
  avaluo_fiscal_terreno: number;
  avaluo_fiscal_construccion: number;
  avaluo_fiscal_total: number;
  superficie: number;
  metros_construidos: number;
  fojas: string;
  ano_registro: string;
  conservador_id: number;
  conservador?: { id: number; descripcion: string };
  observaciones: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtPeso = (n: number) =>
  '$' + (n ?? 0).toLocaleString('es-CL');

const ESTADOS_BADGE: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  'Activo':        { color: '#3a9956', bg: 'rgba(58,153,86,.1)',   border: 'rgba(76,202,122,.22)',  dot: '#3a9956' },
  'Inactivo':      { color: '#6b8f75', bg: 'rgba(0,0,0,.07)',      border: 'rgba(0,0,0,.1)',        dot: '#9ab8a2' },
  'En revisión':   { color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  border: 'rgba(245,158,11,.25)',  dot: '#f59e0b' },
  'En mantención': { color: '#ef4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.22)',   dot: '#ef4444' },
};

function BadgeTipo({ tipo }: { tipo?: string }) {
  const esSub = tipo === 'sub_propiedad';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 700,
      padding: '2px 7px', borderRadius: 999, letterSpacing: '.04em',
      whiteSpace: 'nowrap',
      color:      esSub ? '#7c3aed' : '#0369a1',
      background: esSub ? 'rgba(124,58,237,.08)' : 'rgba(3,105,161,.08)',
      border:     esSub ? '1px solid rgba(124,58,237,.2)' : '1px solid rgba(3,105,161,.2)',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                      background: esSub ? '#7c3aed' : '#0369a1' }} />
      {esSub ? 'Sub' : 'Propiedad'}
    </span>
  );
}

function BadgeEstado({ label }: { label: string }) {
  const s = ESTADOS_BADGE[label] ?? ESTADOS_BADGE['Inactivo'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 600, padding: '3px 9px', borderRadius: 999, letterSpacing: '.04em', whiteSpace: 'nowrap', color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL ELIMINAR
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
function BienesPageInner() {
  const searchParams = useSearchParams();
  const [tab,          setTab]          = useState<'bienes'|'borradores'>(searchParams.get('tab') === 'borradores' ? 'borradores' : 'bienes');
  const [data,         setData]         = useState<Bien[]>([]);
  const [borradores,   setBorradores]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingBorr,  setLoadingBorr]  = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filtros
  const [fCarpeta,    setFCarpeta]    = useState('');
  const [fRol,        setFRol]        = useState('');
  const [fNombre,     setFNombre]     = useState('');
  const [fTipo,       setFTipo]       = useState('');
  const [fRegion,     setFRegion]     = useState('');
  const [fComuna,     setFComuna]     = useState('');
  const [fEstado,     setFEstado]     = useState('');
  const [applied,     setApplied]     = useState({ carpeta: '', rol: '', nombre: '', tipo: '', region: '', comuna: '', estado: '' });

  // Tabla
  const [search,   setSearch]   = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);
  const [sortCol,  setSortCol]  = useState('created_at');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

  // ── Cargar datos ──────────────────────────────────────────────────────────
  const cargarBienes = useCallback(() => {
    setLoading(true);
    api.get('/api/bienes')
      .then(({ data: r }) => setData(r.data ?? r))
      .catch(() => toast.error('Error al cargar bienes'))
      .finally(() => setLoading(false));
  }, []);

  const cargarBorradores = useCallback(() => {
    setLoadingBorr(true);
    api.get('/api/bienes-borradores')
      .then(({ data: r }) => setBorradores(r.data ?? r))
      .catch(() => toast.error('Error al cargar borradores'))
      .finally(() => setLoadingBorr(false));
  }, []);

  useEffect(() => {
    cargarBienes();
    cargarBorradores();
  }, []);

  // ── Opciones dinámicas para filtros ──────────────────────────────────────
  const opTipos   = [...new Set(data.map(b => b.tipo_propiedad?.descripcion).filter(Boolean))].sort() as string[];
  const opRegiones= [...new Set(data.map(b => b.region?.descripcion).filter(Boolean))].sort() as string[];
  const opComunas = [...new Set(data.map(b => b.comuna?.descripcion).filter(Boolean))].sort() as string[];
  const opEstados = [...new Set(data.map(b => b.estado_propiedad?.descripcion).filter(Boolean))].sort() as string[];

  // ── Aplicar filtros ───────────────────────────────────────────────────────
  const aplicar = () => {
    setApplied({ carpeta: fCarpeta, rol: fRol, nombre: fNombre, tipo: fTipo, region: fRegion, comuna: fComuna, estado: fEstado });
    setPage(1);
  };
  const limpiar = () => {
    setFCarpeta(''); setFRol(''); setFNombre(''); setFTipo('');
    setFRegion(''); setFComuna(''); setFEstado('');
    setApplied({ carpeta: '', rol: '', nombre: '', tipo: '', region: '', comuna: '', estado: '' });
    setSearch(''); setPage(1);
  };
  const filtrosActivos = Object.values(applied).filter(Boolean).length;

  // ── Filtrar + buscar + ordenar ────────────────────────────────────────────
  const filtered = useMemo(() => {
    return data
      .filter(b => {
        const tipo   = b.tipo_propiedad?.descripcion   ?? '';
        const region = b.region?.descripcion           ?? '';
        const comuna = b.comuna?.descripcion           ?? '';
        const estado = b.estado_propiedad?.descripcion ?? '';
        return (
          (!applied.carpeta || b.carpeta?.toLowerCase().includes(applied.carpeta.toLowerCase())) &&
          (!applied.rol     || b.rol_avaluo?.toLowerCase().includes(applied.rol.toLowerCase())) &&
          (!applied.nombre  || b.nombre_conjunto?.toLowerCase().includes(applied.nombre.toLowerCase())) &&
          (!applied.tipo    || tipo === applied.tipo) &&
          (!applied.region  || region === applied.region) &&
          (!applied.comuna  || comuna.toLowerCase().includes(applied.comuna.toLowerCase())) &&
          (!applied.estado  || estado === applied.estado) &&
          (!search || [b.carpeta, b.rol_avaluo, b.nombre_conjunto, tipo, region, comuna].some(v => v?.toLowerCase().includes(search.toLowerCase())))
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

  // ── Eliminar ──────────────────────────────────────────────────────────────
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

  // ── Exportar Excel (XLSX) ─────────────────────────────────────────────────
  const exportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;

    const columnas = [
      { header: 'N° Carpeta',          key: 'carpeta',             width: 14 },
      { header: 'Rol Avalúo',           key: 'rol_avaluo',          width: 16 },
      { header: 'Conjunto',             key: 'nombre_conjunto',     width: 28 },
      { header: 'Tipo',                 key: 'tipo',                width: 18 },
      { header: 'Región',               key: 'region',              width: 20 },
      { header: 'Provincia',            key: 'provincia',           width: 18 },
      { header: 'Comuna',               key: 'comuna',              width: 18 },
      { header: 'Dirección',            key: 'direccion',           width: 32 },
      { header: 'Avalúo Fiscal Total',  key: 'avaluo_fiscal_total', width: 20 },
    ];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Bienes Inmuebles');
    ws.columns = columnas;

    // Encabezados
    const headerRow = ws.getRow(1);
    columnas.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.font      = { bold: true, color: { argb: 'FF1A2E22' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = col.key === 'avaluo_fiscal_total'
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } }
        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EAD8' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF9AB8A2' } } };
    });
    headerRow.height = 20;

    // Filas de datos
    filtered.forEach((b, rowIdx) => {
      const row = ws.addRow({
        carpeta:           b.carpeta ?? '',
        rol_avaluo:        b.rol_avaluo ?? '',
        nombre_conjunto:   b.nombre_conjunto ?? '',
        tipo:              b.tipo_propiedad?.descripcion ?? '',
        region:            b.region?.descripcion ?? '',
        provincia:         b.provincia?.descripcion ?? '',
        comuna:            b.comuna?.descripcion ?? '',
        direccion:         b.direccion ?? '',
        avaluo_fiscal_total: b.avaluo_fiscal_total ?? 0,
      });

      // Colorear columna Avalúo Fiscal Total
      const avaluoCell = row.getCell(9);
      avaluoCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFECEC' } };
      avaluoCell.numFmt    = '#,##0';
      avaluoCell.alignment = { horizontal: 'right' };

      // Zebra suave en filas pares
      if (rowIdx % 2 === 1) {
        row.eachCell((cell, colNumber) => {
          if (colNumber !== 9) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5FAF6' } };
          }
        });
      }
    });

    // Freeze encabezado
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = `bienes_inmuebles_${fecha}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
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
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500, color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>Gestión de Bienes</span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem', fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Bienes Inmuebles
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>Gestión del parque inmobiliario institucional</p>
        </div>
        <Link href="/bienes/crear"
          style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#0d2318', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3aaf64,#7dd494)', boxShadow: '0 4px 16px rgba(76,202,122,.3)' }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Bien
        </Link>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid rgba(0,0,0,.08)' }}>
        {[
          { key: 'bienes',     label: 'Bienes Inmuebles', count: data.length },
          { key: 'borradores', label: 'Borradores',        count: borradores.length, color: '#d4a832' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px',
                     border: 'none', borderBottom: tab === t.key ? '2px solid #3aaf64' : '2px solid transparent',
                     marginBottom: '-2px', cursor: 'pointer',
                     fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.88rem', fontWeight: 700,
                     textTransform: 'uppercase', letterSpacing: '.08em', background: 'transparent',
                     color: tab === t.key ? '#2e7d46' : '#9ab8a2', transition: 'all .15s' }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ fontSize: '.62rem', fontFamily: 'monospace', fontWeight: 700,
                             padding: '1px 7px', borderRadius: 999, background: tab === t.key ? 'rgba(58,153,86,.12)' : 'rgba(0,0,0,.06)',
                             color: t.color ?? (tab === t.key ? '#2e7d46' : '#9ab8a2') }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB BORRADORES */}
      {tab === 'borradores' && (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)' }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,.06)', background: 'rgba(212,168,50,.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg style={{ width: 14, height: 14, color: '#d4a832' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.88rem', fontWeight: 700, color: '#8a6a18', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Registros en borrador — completa y guarda definitivamente
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '.62rem', color: '#9ab8a2' }}>{borradores.length} borrador{borradores.length !== 1 ? 'es' : ''}</span>
          </div>

          {loadingBorr ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>Cargando borradores...</div>
          ) : borradores.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.9rem', fontWeight: 700, color: '#9ab8a2', textTransform: 'uppercase', letterSpacing: '.1em' }}>Sin borradores</p>
              <p style={{ fontFamily: 'monospace', fontSize: '.65rem', color: '#c0d8c8', marginTop: 6 }}>Los registros guardados parcialmente aparecerán aquí</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.03)', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                  {['N° Carpeta', 'Nombre Conjunto', 'Región', 'Comuna', 'Última modificación', 'Acciones'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: i >= 4 ? 'right' : 'left', fontFamily: 'monospace', fontSize: '.56rem', fontWeight: 600, color: '#9ab8a2', textTransform: 'uppercase', letterSpacing: '.12em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {borradores.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(0,0,0,.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fffdf0')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 700, color: '#d4a832' }}>{b.carpeta}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '.8rem', color: '#1a2e22' }}>{b.nombre_conjunto || <span style={{ color: '#c0d8c8' }}>—</span>}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '.65rem', color: '#6b8f75' }}>{b.region || '—'}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '.65rem', color: '#6b8f75' }}>{b.comuna || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '.62rem', color: '#9ab8a2' }}>
                      {new Date(b.updated_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <Link href={`/bienes/${b.uuid}/editar?borrador=1`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7,
                                 background: 'rgba(212,168,50,.1)', border: '1px solid rgba(212,168,50,.3)',
                                 color: '#8a6a18', fontFamily: 'monospace', fontSize: '.65rem', fontWeight: 600,
                                 textDecoration: 'none' }}>
                        <svg style={{ width: 11, height: 11 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Completar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'bienes' && <>

      {/* FILTROS */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
          <svg style={{ width: 13, height: 13, color: '#2e7d46', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.08em' }}>Filtros</span>
          {filtrosActivos > 0 && (
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(58,153,86,.12)', border: '1px solid rgba(58,153,86,.25)', color: '#2e7d46' }}>
              {filtrosActivos} {filtrosActivos === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: 12, alignItems: 'end' }}>
            <FI label="N° Carpeta"     placeholder="VALP0016"     value={fCarpeta}    onChange={e => setFCarpeta(e.target.value)}    onKeyDown={e => e.key==='Enter' && aplicar()} />
            <FI label="Rol Avalúo"     placeholder="00322-00001"  value={fRol}        onChange={e => setFRol(e.target.value)}        onKeyDown={e => e.key==='Enter' && aplicar()} />
            <FI label="Conjunto"        placeholder="Monte Carmelo" value={fNombre}    onChange={e => setFNombre(e.target.value)}     onKeyDown={e => e.key==='Enter' && aplicar()} />
            <FS label="Tipo"           options={opTipos}           value={fTipo}      onChange={e => { setFTipo(e.target.value);   aplicar(); }} />
            <FS label="Región"         options={opRegiones}        value={fRegion}    onChange={e => { setFRegion(e.target.value); aplicar(); }} />
            <FI label="Comuna"         placeholder="Limache"       value={fComuna}    onChange={e => setFComuna(e.target.value)}     onKeyDown={e => e.key==='Enter' && aplicar()} />
            <FS label="Estado"         options={opEstados}         value={fEstado}    onChange={e => { setFEstado(e.target.value); aplicar(); }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <button onClick={aplicar} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#0d2318', background: 'linear-gradient(135deg,#3aaf64,#7dd494)' }}>
                <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                Buscar
              </button>
              <button onClick={limpiar} title="Limpiar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 7, flexShrink: 0, background: '#eaf3ec', border: '1px solid rgba(0,0,0,.1)', color: '#6b8f75', cursor: 'pointer' }}>
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
            <button onClick={exportExcel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#3d5c47', background: '#eaf3ec', border: '1px solid rgba(0,0,0,.1)' }}>
              <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar
            </button>
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
                    ['carpeta',          'N° Carpeta', 'left'],
                    ['rol_avaluo',       'Rol Avalúo', 'left'],
                    ['nombre_conjunto',  'Conjunto',   'left'],
                    ['tipo_propiedad',   'Tipo',       'left'],
                    ['region',          'Región',      'left'],
                    ['comuna',          'Comuna',      'left'],
                    ['conservador',     'Conservador', 'left'],
                    ['avaluo_fiscal_total', 'Avalúo Total', 'right'],
                    ['estado_propiedad','Estado',      'center'],
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
                  <tr key={b.id}
                    style={{ borderBottom: '1px solid rgba(0,0,0,.04)', transition: 'background .12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5faf6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#2e7d46', fontWeight: 600 }}>{b.carpeta}</span>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 700, color: '#1a2e22' }}>{b.rol_avaluo}</span>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '.8rem', color: '#1a2e22' }} title={b.nombre_conjunto}>{b.nombre_conjunto}</span>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7dd494', flexShrink: 0 }} />
                        <span style={{ fontSize: '.78rem', color: '#1a2e22' }}>{b.tipo_propiedad?.descripcion ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: '.78rem', color: '#3d5c47' }}>{b.region?.descripcion ?? '—'}</td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: '.78rem', color: '#3d5c47' }}>{b.comuna?.descripcion ?? '—'}</td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: '.78rem', color: '#3d5c47' }}>{b.conservador?.descripcion ?? '—'}</td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: '#1a2e22', fontWeight: 600 }}>
                        {fmtPeso(b.avaluo_fiscal_total)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <BadgeEstado label={b.estado_propiedad?.descripcion ?? '—'} />
                    </td>
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Link href={b.tipo_registro === 'sub_propiedad' ? `/bienes/sub/${b.id}` : `/bienes/${b.uuid}`}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(58,153,86,.1)', color: '#3a9956', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(76,202,122,.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(58,153,86,.1)')}
                          title="Ver detalle"
                        >
                          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link href={b.tipo_registro === 'sub_propiedad' ? `/bienes/sub/${b.id}/editar` : `/bienes/${b.uuid}/editar`}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(147,197,253,.1)', color: '#93c5fd', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(147,197,253,.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(147,197,253,.1)')}
                          title="Editar"
                        >
                          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => setDeleteId(b.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(252,165,165,.1)', color: '#fca5a5', border: 'none', cursor: 'pointer', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,165,165,.22)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(252,165,165,.1)')}
                          title="Eliminar"
                        >
                          <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {deleteId !== null && (
        <ModalEliminar onCancel={() => setDeleteId(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}

export default function BienesPage() {
  return (
    <Suspense>
      <BienesPageInner />
    </Suspense>
  );
}