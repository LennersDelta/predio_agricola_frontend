'use client';

import { useRef, useState } from 'react';
import { useTipoDocumento } from '@/hooks/useTipoDocumento';
import api from '@/lib/axios';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
export interface TipoDoc {
  id: string;
  label: string;
  descripcion: string;
  icono: 'doc' | 'legal' | 'plano' | 'foto' | 'otro';
}

export interface DocAdjunto {
  uid: string;
  tipoId: string;
  archivo: File;
  previewUrl?: string;
  existente?: boolean;  // true = ya guardado en servidor, no resubir
}

// Documento ya guardado en BD (modo editar/ver)
export interface DocGuardado {
  id: number;
  uuid: string;
  nombre_original: string;
  mime_type: string;
  peso: number;
  url: string | null;
  tipo_id: number;
  tipo_label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function uid(): string { return Math.random().toString(36).slice(2); }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File) { return file.type.startsWith('image/'); }

function inferirIcono(label: string): TipoDoc['icono'] {
  const d = label.toLowerCase();
  if (d.includes('foto') || d.includes('imagen')) return 'foto';
  if (d.includes('plano')) return 'plano';
  if (d.includes('decreto') || d.includes('resolucion') || d.includes('contrato') ||
      d.includes('poliza') || d.includes('inscripcion')) return 'legal';
  return 'doc';
}

const ICON_PATHS: Record<TipoDoc['icono'], string> = {
  doc:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  legal: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  plano: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  foto:  'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  otro:  'M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function Ico({ path, size = 13 }: { path: string; size?: number }) {
  return (
    <svg style={{ width: size, height: size, flexShrink: 0 }} fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function IconBtn({ title, path, color, bg, bgHov, onClick, loading }: {
  title: string; path: string; color: string; bg: string; bgHov: string;
  onClick: () => void; loading?: boolean;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={loading}
      style={{ width: 24, height: 24, borderRadius: 5, border: 'none', flexShrink: 0,
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               cursor: loading ? 'wait' : 'pointer', background: bg, color,
               opacity: loading ? .6 : 1, transition: 'background .15s' }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = bgHov; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; }}
    >
      <Ico path={path} size={12} />
    </button>
  );
}

// ── Fila archivo local (crear) ────────────────────────────────────────────────
function FileRowLocal({ doc, onVer, onDescargar, onEliminar }: {
  doc: DocAdjunto; onVer: () => void; onDescargar: () => void; onEliminar: () => void;
}) {
  return (
    <div style={{ padding: '7px 9px', borderRadius: 7,
                  border: '1px solid rgba(58,153,86,.18)', background: 'rgba(58,153,86,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
        {(() => {
          const mime = doc.archivo.type || '';
          const esImagen = mime.startsWith('image/');
          const esPdf    = mime === 'application/pdf';
          const esWord   = mime.includes('word') || mime.includes('doc');
          if (esImagen && doc.previewUrl) {
            return (
              <div style={{ width: 30, height: 30, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                            border: '1px solid rgba(0,0,0,.08)', marginTop: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={doc.previewUrl} alt={doc.archivo.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            );
          }
          return (
            <div style={{ width: 30, height: 34, borderRadius: 4, flexShrink: 0, marginTop: 1,
                          background: esPdf ? 'linear-gradient(135deg,#fee2e2,#fecaca)'
                            : esWord ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)'
                            : 'linear-gradient(135deg,#e8f3eb,#d4eadb)',
                          border: esPdf ? '1px solid rgba(239,68,68,.2)'
                            : esWord ? '1px solid rgba(59,130,246,.2)'
                            : '1px solid rgba(58,153,86,.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: esPdf ? '#ef4444' : esWord ? '#3b82f6' : '#2e7d46' }}>
              <Ico path={
                esPdf
                  ? 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                  : esWord
                    ? 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    : 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
              } size={13} />
            </div>
          );
        })()}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 600,
                        color: '#1a2e22', margin: 0, lineHeight: 1.35, wordBreak: 'break-word' }}>
              {doc.archivo.name}
            </p>
            {doc.existente && (
              <span style={{ fontFamily: 'monospace', fontSize: '.5rem', padding: '1px 5px',
                              borderRadius: 4, background: 'rgba(58,153,86,.15)',
                              color: '#2e7d46', flexShrink: 0 }}>Guardado</span>
            )}
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: '.55rem', color: '#9ab8a2', margin: '2px 0 0' }}>
            {doc.existente ? 'En servidor' : formatSize(doc.archivo.size)}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <IconBtn title="Ver"
          path="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          color="#3b82f6" bg="rgba(96,165,250,.1)" bgHov="rgba(96,165,250,.25)" onClick={onVer} />
        <IconBtn title="Descargar"
          path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          color="#2e7d46" bg="rgba(58,153,86,.1)" bgHov="rgba(58,153,86,.25)" onClick={onDescargar} />
        <IconBtn title="Quitar"
          path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          color="#ef4444" bg="rgba(239,68,68,.08)" bgHov="rgba(239,68,68,.2)" onClick={onEliminar} />
      </div>
    </div>
  );
}

// ── Fila archivo guardado en BD (editar) ─────────────────────────────────────
function FileRowGuardado({ doc, onEliminar, eliminando }: {
  doc: DocGuardado; onEliminar: () => void; eliminando: boolean;
}) {
  return (
    <div style={{ padding: '7px 9px', borderRadius: 7,
                  border: '1px solid rgba(37,99,235,.2)', background: 'rgba(37,99,235,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
        <div style={{ width: 30, height: 34, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
                      border: '1px solid rgba(37,99,235,.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
          <Ico path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 600,
                      color: '#1a2e22', margin: 0, lineHeight: 1.35, wordBreak: 'break-word' }}>
            {doc.nombre_original}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '.55rem', color: '#9ab8a2', margin: '2px 0 0' }}>
            {formatSize(doc.peso)}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        {doc.url && (
          <>
            <IconBtn title="Ver"
              path="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              color="#3b82f6" bg="rgba(96,165,250,.1)" bgHov="rgba(96,165,250,.25)"
              onClick={() => {
                window.open(doc.url!, '_blank');
                api.get(`/api/documentos/${doc.uuid}/ver`).catch(() => {});
              }} />
            <IconBtn title="Descargar"
              path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              color="#2e7d46" bg="rgba(58,153,86,.1)" bgHov="rgba(58,153,86,.25)"
              onClick={() => {
                window.open(doc.url!, '_blank');
                api.get(`/api/documentos/${doc.uuid}/descargar`).catch(() => {});
              }} />
          </>
        )}
        <IconBtn title="Eliminar"
          path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          color="#ef4444" bg="rgba(239,68,68,.08)" bgHov="rgba(239,68,68,.2)"
          onClick={onEliminar} loading={eliminando} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  // Modo crear — archivos locales pendientes de envío con el formulario
  docs: DocAdjunto[];
  onChange: (docs: DocAdjunto[]) => void;
  // Modo editar — propiedad_id para subir/borrar directo en la API
  propiedadId?: number;
  docsGuardados?: DocGuardado[];
  onDocsGuardadosChange?: (docs: DocGuardado[]) => void;
}

export default function DocumentosAdjuntos({
  docs: docsProp, onChange,
  propiedadId, docsGuardados = [], onDocsGuardadosChange,
}: Props) {
  const docs       = docsProp ?? [];
  const modoEditar = !!propiedadId;
  const inputRefs  = useRef<Record<string, HTMLInputElement | null>>({});
  const [subiendo,   setSubiendo]   = useState<string | null>(null);  // tipoId subiendo
  const [eliminando, setEliminando] = useState<number | null>(null);  // docId eliminando

  // ── Tipos desde BD ────────────────────────────────────────────────────────
  const { tipoDocumento, loading: loadingTipos } = useTipoDocumento();
  const tiposDoc: TipoDoc[] = tipoDocumento.map(t => ({
    id:          String(t.id),
    label:       t.label || t.descripcion,
    descripcion: t.descripcion,
    icono:       inferirIcono(t.label || t.descripcion),
  }));

  // ── Modo CREAR — archivos locales ─────────────────────────────────────────
  const adjuntarLocal = (tipoId: string, files: FileList) => {
    const nuevos: DocAdjunto[] = Array.from(files).map(file => ({
      uid:        uid(),
      tipoId,
      archivo:    file,
      previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined,
    }));
    onChange([...docs, ...nuevos]);
    if (inputRefs.current[tipoId]) inputRefs.current[tipoId]!.value = '';
  };

  const eliminarLocal = (docUid: string) => {
    const doc = docs.find(d => d.uid === docUid);
    if (doc?.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    onChange(docs.filter(d => d.uid !== docUid));
  };

  // ── Modo EDITAR — directo al API ──────────────────────────────────────────
  const adjuntarRemoto = async (tipoId: string, files: FileList) => {
    if (!propiedadId) return;
    setSubiendo(tipoId);
    const toastId = toast.loading(`Subiendo ${files.length} archivo${files.length > 1 ? 's' : ''}...`);

    try {
      const nuevos: DocGuardado[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('archivo', file);
        fd.append('tipo_documento_id', tipoId);
        const { data } = await api.post(
          `/api/bienes/${propiedadId}/documentos`, fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        // Recargar lista completa
        const res = await api.get(`/api/bienes/${propiedadId}/documentos`);
        onDocsGuardadosChange?.(res.data.data ?? res.data);
      }
      toast.success('Documentos subidos correctamente', { id: toastId, duration: 2500 });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al subir documento', { id: toastId, duration: 5000 });
    } finally {
      setSubiendo(null);
      if (inputRefs.current[tipoId]) inputRefs.current[tipoId]!.value = '';
    }
  };

  const eliminarRemoto = async (docId: number) => {
    const doc = docsGuardados.find(d => d.id === docId);
    if (!doc) return;
    // Pedir confirmación antes de eliminar
    if (!window.confirm(`¿Eliminar "${doc.nombre_original}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(docId);
    const toastId = toast.loading('Eliminando documento...');
    try {
      await api.delete(`/api/documentos/${doc.uuid}`);
      onDocsGuardadosChange?.(docsGuardados.filter(d => d.id !== docId));
      toast.success('Documento eliminado', { id: toastId, duration: 2500 });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al eliminar', { id: toastId, duration: 5000 });
    } finally {
      setEliminando(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2,
                        background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} />
          <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                          fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase',
                          letterSpacing: '.12em' }}>
            Documentos Adjuntos
          </span>
          {modoEditar && (
            <span style={{ fontFamily: 'monospace', fontSize: '.55rem', padding: '2px 8px',
                            borderRadius: 999, background: 'rgba(37,99,235,.1)',
                            color: '#1d4ed8', letterSpacing: '.06em' }}>
              Los archivos se guardan inmediatamente
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: '.58rem', color: '#9ab8a2',
                        textTransform: 'uppercase', letterSpacing: '.08em' }}>
          PDF · JPG · PNG — máx. 10 MB c/u
        </span>
      </div>

      {/* Loading tipos */}
      {loadingTipos ? (
        <div style={{ padding: '24px', textAlign: 'center',
                      fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>
          Cargando tipos de documentos...
        </div>
      ) : (
        <div style={{ display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))',
                      gap: 10 }}>
          {tiposDoc.map(tipo => {
            // Archivos locales (modo crear)
            const locales   = docs.filter(d => d.tipoId === tipo.id);
            // Archivos guardados (modo editar) — filtrar por tipo_id numérico
            const guardados = docsGuardados.filter(d => String(d.tipo_id) === tipo.id);
            const total     = locales.length + guardados.length;
            const tiene     = total > 0;
            const estaSubiendo = subiendo === tipo.id;

            return (
              <div key={tipo.id} style={{
                borderRadius: 11,
                border: tiene ? '1.5px solid rgba(58,153,86,.3)' : '1.5px dashed rgba(0,0,0,.12)',
                background: tiene ? 'rgba(58,153,86,.03)' : '#fafafa',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transition: 'border-color .18s',
              }}>
                {/* Header columna */}
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(0,0,0,.06)',
                              background: tiene ? 'rgba(58,153,86,.05)' : 'rgba(0,0,0,.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: tiene ? 'rgba(58,153,86,.15)' : 'rgba(0,0,0,.07)',
                                  color: tiene ? '#2e7d46' : '#9ab8a2' }}>
                      <Ico path={ICON_PATHS[tipo.icono]} size={13} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.76rem',
                                  fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase',
                                  letterSpacing: '.05em', lineHeight: 1.1, margin: 0,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tipo.label}
                      </p>
                    </div>
                    {tiene && (
                      <span style={{ fontFamily: 'monospace', fontSize: '.55rem', fontWeight: 700,
                                      padding: '1px 6px', borderRadius: 999,
                                      background: 'rgba(58,153,86,.15)', color: '#2e7d46', flexShrink: 0 }}>
                        {total}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                                  background: estaSubiendo ? '#f59e0b' : tiene ? '#3a9956' : 'rgba(0,0,0,.2)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '.55rem', letterSpacing: '.09em',
                                    color: estaSubiendo ? '#d97706' : tiene ? '#2e7d46' : '#9ab8a2',
                                    textTransform: 'uppercase' }}>
                      {estaSubiendo ? 'Subiendo...' : tiene
                        ? `${total} archivo${total > 1 ? 's' : ''}` : 'Sin archivos'}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 5,
                    padding: '8px 10px 4px',
                    maxHeight: total > 5 ? 248 : 'none',
                    overflowY: total > 5 ? 'auto' : 'visible',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(58,153,86,.25) transparent',
                  } as React.CSSProperties}>

                    {/* Guardados en BD (azul) */}
                    {guardados.map(doc => (
                      <FileRowGuardado key={doc.id} doc={doc}
                        onEliminar={() => eliminarRemoto(doc.id)}
                        eliminando={eliminando === doc.id}
                      />
                    ))}

                    {/* Locales pendientes (verde) */}
                    {locales.map(doc => (
                      <FileRowLocal key={doc.uid} doc={doc}
                        onVer={()        => window.open(doc.previewUrl ?? URL.createObjectURL(doc.archivo), '_blank')}
                        onDescargar={()  => {
                          const url = URL.createObjectURL(doc.archivo);
                          const a = document.createElement('a'); a.href = url;
                          a.download = doc.archivo.name; a.click(); URL.revokeObjectURL(url);
                        }}
                        onEliminar={()   => eliminarLocal(doc.uid)}
                      />
                    ))}

                    {!tiene && (
                      <p style={{ fontFamily: 'monospace', fontSize: '.55rem', color: '#c8d8cc',
                                  textAlign: 'center', margin: '12px 0 8px', letterSpacing: '.04em' }}>
                        PDF · JPG · PNG
                      </p>
                    )}
                  </div>

                  {total > 5 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  padding: '3px 0', borderTop: '1px solid rgba(58,153,86,.1)',
                                  background: 'rgba(58,153,86,.03)' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '.52rem',
                                      color: '#9ab8a2', letterSpacing: '.08em' }}>
                        ↕ {total} archivos
                      </span>
                    </div>
                  )}

                  {/* Zona de carga */}
                  <div style={{ padding: '6px 10px 10px',
                                borderTop: tiene ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 6, padding: '7px 10px', borderRadius: 7,
                                    cursor: estaSubiendo ? 'wait' : 'pointer',
                                    border: '1.5px dashed rgba(58,153,86,.22)', background: 'transparent',
                                    transition: 'border-color .18s, background .18s',
                                    opacity: estaSubiendo ? .6 : 1 }}
                      onMouseEnter={e => { if (!estaSubiendo) { e.currentTarget.style.borderColor = '#3a9956'; e.currentTarget.style.background = 'rgba(58,153,86,.05)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(58,153,86,.22)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                    background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a9956' }}>
                        <Ico path={estaSubiendo ? "M4 12a8 8 0 018-8v8z" : "M12 4v16m8-8H4"} size={11} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '.62rem', fontWeight: 600,
                                      color: '#2e7d46', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {estaSubiendo ? 'Subiendo...' : tiene ? 'Agregar otro' : 'Adjuntar archivo'}
                      </span>
                      <input
                        ref={el => { inputRefs.current[tipo.id] = el; }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        multiple
                        disabled={estaSubiendo}
                        style={{ display: 'none' }}
                        onChange={e => {
                          if (!e.target.files?.length) return;
                          if (modoEditar) {
                            adjuntarRemoto(tipo.id, e.target.files);
                          } else {
                            adjuntarLocal(tipo.id, e.target.files);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}