'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUsuarios } from '@/hooks/useUsuarios';
import { AREAS, ROLES } from '@/lib/usuarios-config';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const areaNombre = (id: number | null) =>
  AREAS.find(a => a.id === id)?.nombre ?? '—';

const rolColor: Record<string, { bg: string; color: string; dot: string }> = {
  administrador: { bg: 'rgba(212,168,50,.12)', color: '#8a6a18', dot: '#d4a832' },
  usuario:       { bg: 'rgba(58,153,86,.1)',   color: '#2e7d46', dot: '#3a9956' },
  lector:        { bg: 'rgba(0,0,0,.07)',       color: '#6b8f75', dot: '#9ab8a2' },
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 7,
  color: '#1a2e22', fontSize: '.78rem', padding: '7px 12px', outline: 'none',
  fontFamily: '"Barlow",sans-serif', appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONFIRMAR ELIMINAR
// ─────────────────────────────────────────────────────────────────────────────
function ModalEliminar({ nombre, onConfirm, onCancel }: {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '32px 28px',
        maxWidth: 360, width: '90%', textAlign: 'center',
        border: '1px solid rgba(0,0,0,.1)', boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, margin: '0 auto 16px',
          background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg style={{ width: 22, height: 22, color: '#ef4444' }} fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '1.1rem',
                      fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase',
                      letterSpacing: '.06em', marginBottom: 8 }}>
          ¿Eliminar usuario?
        </h3>
        <p style={{ fontSize: '.78rem', color: '#6b8f75', lineHeight: 1.6, marginBottom: 24 }}>
          Se eliminará permanentemente a <strong>{nombre}</strong>.<br />
          Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            border: '1px solid rgba(0,0,0,.1)', background: '#eaf3ec',
            color: '#6b8f75', fontFamily: '"Barlow Condensed",sans-serif',
            fontWeight: 700, fontSize: '.82rem', textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            border: 'none', background: 'linear-gradient(135deg,#991b1b,#dc2626)',
            color: '#fff', fontFamily: '"Barlow Condensed",sans-serif',
            fontWeight: 700, fontSize: '.82rem', textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const router = useRouter();
  const { usuarios, loading, error, eliminar } = useUsuarios();

  const [busqueda,   setBusqueda]   = useState('');
  const [filtroRol,  setFiltroRol]  = useState('');
  const [modalElim,  setModalElim]  = useState<{ id: number; nombre: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !texto || [
      u.name, u.apellido_ap, u.apellido_mat,
      u.rut_formateado, u.email ?? '', u.grado,
    ].some(v => v.toLowerCase().includes(texto));
    const coincideRol = !filtroRol || u.role === filtroRol;
    return coincideTexto && coincideRol;
  });

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!modalElim) return;
    setEliminando(true);
    const toastId = toast.loading('Eliminando usuario...');
    try {
      await eliminar(modalElim.id);
      toast.success('Usuario eliminado correctamente', { id: toastId, duration: 3000 });
      setModalElim(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al eliminar', {
        id: toastId, duration: 5000,
      });
    } finally {
      setEliminando(false);
    }
  };

  const nombreCompleto = (u: typeof usuarios[0]) =>
    [u.name, u.apellido_ap, u.apellido_mat].filter(Boolean).join(' ');

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif' }}>

      {modalElim && (
        <ModalEliminar
          nombre={modalElim.nombre}
          onConfirm={handleEliminar}
          onCancel={() => !eliminando && setModalElim(null)}
        />
      )}

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                        padding: '3px 10px 3px 8px', borderRadius: 999,
                        background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                            color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Administración
            </span>
          </div>
          <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                        fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                        letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
            Usuarios
          </h2>
          <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
            Gestión de accesos y perfiles del sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

          <Link href="/usuarios/crear"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '9px 20px', borderRadius: 8,
                      fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                      fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                      color: '#0d2318', textDecoration: 'none',
                      background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
                      boxShadow: '0 4px 14px rgba(76,202,122,.25)' }}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </Link>
        </div>
      </div>

      {/* PANEL */}
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>

        {/* FILTROS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,.06)',
                      background: 'rgba(0,0,0,.02)' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                          width: 13, height: 13, color: '#9ab8a2', pointerEvents: 'none' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text" placeholder="Buscar por nombre, RUT, grado..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28, width: '100%' }}
              onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          {/* Filtro rol */}
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
            style={{ ...inputStyle, paddingRight: 30, cursor: 'pointer', minWidth: 140,
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.3)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center' }}>
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {/* Contador */}
          <span style={{ fontFamily: 'monospace', fontSize: '.62rem', color: '#9ab8a2',
                          whiteSpace: 'nowrap' }}>
            {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* TABLA */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <svg style={{ width: 24, height: 24, color: '#3a9956', margin: '0 auto 12px',
                          animation: 'spin 1s linear infinite' }}
              fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p style={{ fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>
              Cargando usuarios...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#ef4444' }}>{error}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.03)' }}>
                  {['Usuario', 'RUT', 'Grado', 'Área', 'Contacto', 'Rol', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', fontFamily: 'monospace',
                                          fontSize: '.56rem', fontWeight: 600, color: '#9ab8a2',
                                          textTransform: 'uppercase', letterSpacing: '.14em',
                                          textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,.07)',
                                          whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center',
                                              fontFamily: 'monospace', fontSize: '.7rem',
                                              color: '#9ab8a2' }}>
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : filtrados.map(u => {
                  const rc = rolColor[u.role] ?? rolColor.lector;
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid rgba(0,0,0,.05)',
                                transition: 'background .12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f5faf6')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>

                      {/* Usuario */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            background: 'linear-gradient(135deg,rgba(58,153,86,.15),rgba(58,153,86,.08))',
                            border: '1px solid rgba(58,153,86,.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 800,
                            fontSize: '.82rem', color: '#2e7d46',
                          }}>
                            {(u.name?.[0] ?? '').toUpperCase()}{(u.apellido_ap?.[0] ?? '').toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '.8rem', fontWeight: 600, color: '#1a2e22',
                                        margin: 0, lineHeight: 1.2 }}>
                              {nombreCompleto(u)}
                            </p>
                            <p style={{ fontFamily: 'monospace', fontSize: '.6rem',
                                        color: '#9ab8a2', margin: '2px 0 0' }}>
                              {u.email ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RUT */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '.75rem',
                                        fontWeight: 600, color: '#3d5c47' }}>
                          {u.rut_formateado}
                        </span>
                      </td>

                      {/* Grado */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle',
                                    fontSize: '.78rem', color: '#3d5c47' }}>
                        {u.grado || '—'}
                      </td>

                      {/* Área */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle',
                                    fontSize: '.78rem', color: '#6b8f75' }}>
                        {areaNombre(u.area_id)}
                      </td>

                      {/* Contacto */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <p style={{ fontFamily: 'monospace', fontSize: '.68rem',
                                    color: '#6b8f75', margin: 0 }}>
                          {u.telefono || '—'}
                        </p>
                        <p style={{ fontFamily: 'monospace', fontSize: '.6rem',
                                    color: '#9ab8a2', margin: '2px 0 0' }}>
                          {u.tipo_contratacion || '—'}
                        </p>
                      </td>

                      {/* Rol */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 600,
                          padding: '3px 9px', borderRadius: 999,
                          background: rc.bg, color: rc.color,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%',
                                          background: rc.dot, flexShrink: 0 }} />
                          {u.role}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '10px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <ActionBtn
                            title="Imprimir PDF"
                            color="#6b8f75" bg="rgba(0,0,0,.06)" bgHov="rgba(0,0,0,.12)"
                            onClick={() => toast.info('PDF en desarrollo')}
                            path="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                          <ActionBtn
                            title="Editar"
                            color="#3b82f6" bg="rgba(96,165,250,.1)" bgHov="rgba(96,165,250,.22)"
                            onClick={() => router.push(`/usuarios/${u.id}/editar`)}
                            path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                          <ActionBtn
                            title="Eliminar"
                            color="#ef4444" bg="rgba(239,68,68,.08)" bgHov="rgba(239,68,68,.2)"
                            onClick={() => setModalElim({ id: u.id, nombre: nombreCompleto(u) })}
                            path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 8, padding: '10px 20px',
                      borderTop: '1px solid rgba(0,0,0,.06)', background: 'rgba(0,0,0,.02)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#9ab8a2' }}>
            Sistema de Gestión de Bienes Raíces
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#9ab8a2' }}>
            {usuarios.length} usuarios registrados
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ title, color, bg, bgHov, onClick, path }: {
  title: string; color: string; bg: string; bgHov: string;
  onClick: () => void; path: string;
}) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color, transition: 'background .15s, transform .12s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = bgHov; e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg;    e.currentTarget.style.transform = ''; }}
    >
      <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </button>
  );
}