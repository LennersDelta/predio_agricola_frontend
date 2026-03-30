// app/bienes/[uuid]/page.tsx
'use client';
import api from '@/lib/axios';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
    borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
    outline: 'none', fontFamily: '"Barlow",sans-serif', appearance: 'none',
};
const readStyle: React.CSSProperties = {
    ...inputStyle, background: 'rgba(0,0,0,.02)', border: '1px solid rgba(0,0,0,.07)',
    color: '#3d5c47', cursor: 'default',
};
const readMoneyStyle: React.CSSProperties = {
    ...readStyle, paddingLeft: 22, background: 'rgba(58,153,86,.04)',
    border: '1px solid rgba(58,153,86,.15)', color: '#2e7d46', fontWeight: 600,
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
    textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5, fontFamily: 'monospace',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><label style={labelStyle}>{label}</label>{children}</div>;
}
function ReadInput({ value, placeholder = '—' }: { value?: string | number | null; placeholder?: string }) {
    return <input readOnly value={value ?? ''} placeholder={placeholder} style={readStyle} />;
}
function ReadMoney({ value }: { value?: string | number | null }) {
    const fmt = value ? Number(value).toLocaleString('es-CL') : '—';
    return (
        <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                           fontSize: '.78rem', color: '#6b8f75', fontFamily: 'monospace',
                           fontWeight: 600, pointerEvents: 'none', zIndex: 1, lineHeight: 1 }}>$</span>
            <input readOnly value={fmt} style={readMoneyStyle} />
        </div>
    );
}
function ReadM2({ value }: { value?: string | number | null }) {
    return (
        <div style={{ position: 'relative' }}>
            <input readOnly value={value ?? '—'} style={{ ...readStyle, paddingRight: 36 }} />
            <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                           fontSize: '.68rem', color: '#6b8f75', fontFamily: 'monospace', pointerEvents: 'none' }}>m²</span>
        </div>
    );
}
function SecTitle({ label }: { label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2,
                          background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} />
            <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                            fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                {label}
            </span>
        </div>
    );
}
function Section({ children }: { children: React.ReactNode }) {
    return <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>{children}</div>;
}
function BadgeEstado({ label }: { label?: string }) {
    if (!label) return null;
    const map: Record<string, { color: string; bg: string; dot: string }> = {
        'Activo':        { color: '#3a9956', bg: 'rgba(58,153,86,.1)',  dot: '#3a9956' },
        'Inactivo':      { color: '#6b8f75', bg: 'rgba(0,0,0,.07)',     dot: '#9ab8a2' },
        'En revisión':   { color: '#f59e0b', bg: 'rgba(245,158,11,.1)', dot: '#f59e0b' },
        'En mantención': { color: '#ef4444', bg: 'rgba(239,68,68,.1)',  dot: '#ef4444' },
    };
    const s = map[label] ?? map['Inactivo'];
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                        borderRadius: 999, fontFamily: 'monospace', fontSize: '.7rem', fontWeight: 600,
                        color: s.color, background: s.bg }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
            {label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN DOCUMENTOS
// ─────────────────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Documento {
    id: number;
    uuid: string;
    nombre_original: string;
    nombre_archivo: string;
    mime_type: string;
    peso: number;
    tipo: string;
    tipo_documento_id: number;
    url: string | null;
    created_at: string;
}

function DocCard({ doc, onEliminar, modoVer = false }: { doc: Documento; onEliminar: (uuid: string) => void; modoVer?: boolean }) {
    const esImagen = doc.mime_type?.startsWith('image/');

    const registrarLog = (accion: 'ver' | 'descargar') => {
        // Fire-and-forget — no await para no bloquear la acción del usuario
        api.get(`/api/documentos/${doc.uuid}/${accion}`).catch(() => {});
    };

    const verDoc = () => {
        if (!doc.url) return;
        window.open(doc.url, '_blank'); // primero abrir (requiere evento síncrono)
        registrarLog('ver');            // luego registrar
    };

    const descargar = () => {
        if (!doc.url) return;
        window.open(doc.url, '_blank'); // abrir en nueva pestaña
        registrarLog('descargar');      // luego registrar
    };

    return (
        <div style={{ padding: '7px 9px', borderRadius: 7,
                      border: '1px solid rgba(58,153,86,.18)', background: 'rgba(58,153,86,.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                <div style={{ width: 30, height: 34, borderRadius: 4, flexShrink: 0,
                              background: esImagen ? '#e8f3eb' : 'linear-gradient(135deg,#e8f3eb,#d4eadb)',
                              border: '1px solid rgba(58,153,86,.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d46' }}>
                    <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
                        stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
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
                {/* Ver — abre en nueva pestaña y registra log */}
                <button type="button" title="Ver" onClick={verDoc}
                    style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: doc.url ? 'pointer' : 'not-allowed',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             background: 'rgba(96,165,250,.1)', color: '#3b82f6', opacity: doc.url ? 1 : .4 }}
                    onMouseEnter={e => { if (doc.url) e.currentTarget.style.background = 'rgba(96,165,250,.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,.1)'; }}>
                    <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
                {/* Descargar — registra log */}
                <button type="button" title="Descargar" onClick={descargar}
                    style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: doc.url ? 'pointer' : 'not-allowed',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             background: 'rgba(58,153,86,.1)', color: '#2e7d46', opacity: doc.url ? 1 : .4 }}
                    onMouseEnter={e => { if (doc.url) e.currentTarget.style.background = 'rgba(58,153,86,.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(58,153,86,.1)'; }}>
                    <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                {/* Eliminar — solo en modo editar, registra log via onEliminar */}
                {!modoVer && (
                <button type="button" title="Eliminar" onClick={() => onEliminar(doc.uuid)}
                    style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: 'pointer',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             background: 'rgba(239,68,68,.08)', color: '#ef4444' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)'; }}>
                    <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                )}
            </div>
        </div>
    );
}

function SeccionDocumentos({ documentos, onEliminar, modoVer = false }: {
    documentos: Documento[];
    onEliminar: (uuid: string) => void;
    modoVer?: boolean;
}) {
    // Agrupar por tipo
    const grupos: Record<string, Documento[]> = {};
    documentos.forEach(d => {
        const key = d.tipo || 'Sin tipo';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(d);
    });

    if (documentos.length === 0) {
        return (
            <Section>
                <SecTitle label="Documentos Adjuntos" />
                <p style={{ fontFamily: 'monospace', fontSize: '.68rem', color: '#9ab8a2',
                            textAlign: 'center', padding: '24px 0' }}>
                    No hay documentos adjuntos en este registro.
                </p>
            </Section>
        );
    }

    return (
        <Section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                <SecTitle label="Documentos Adjuntos" />
                <span style={{ fontFamily: 'monospace', fontSize: '.58rem', color: '#9ab8a2',
                                textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {documentos.length} archivo{documentos.length !== 1 ? 's' : ''} adjunto{documentos.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 10 }}>
                {Object.entries(grupos).map(([tipo, docs]) => (
                    <div key={tipo} style={{ borderRadius: 11,
                                             border: '1.5px solid rgba(58,153,86,.3)',
                                             background: 'rgba(58,153,86,.03)',
                                             display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Header columna */}
                        <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(0,0,0,.06)',
                                      background: 'rgba(58,153,86,.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              background: 'rgba(58,153,86,.15)', color: '#2e7d46' }}>
                                    <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.76rem',
                                            fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase',
                                            letterSpacing: '.05em', lineHeight: 1.1, margin: 0,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                    {tipo}
                                </p>
                                <span style={{ fontFamily: 'monospace', fontSize: '.55rem', fontWeight: 700,
                                               padding: '1px 6px', borderRadius: 999,
                                               background: 'rgba(58,153,86,.15)', color: '#2e7d46', flexShrink: 0 }}>
                                    {docs.length}
                                </span>
                            </div>
                        </div>
                        {/* Archivos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5,
                                      padding: '8px 10px 10px',
                                      maxHeight: docs.length > 5 ? 248 : 'none',
                                      overflowY: docs.length > 5 ? 'auto' : 'visible' } as React.CSSProperties}>
                            {docs.map(doc => (
                                <DocCard key={doc.uuid} doc={doc} onEliminar={onEliminar} modoVer={modoVer} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GALERÍA DE FOTOS
// ─────────────────────────────────────────────────────────────────────────────
// Imágenes de ejemplo para cuando no hay fotos reales
const FOTOS_EJEMPLO = [
    { uuid: 'ex1', url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80', nombre_original: 'Fachada principal', mime_type: 'image/jpeg', peso: 0 },
    { uuid: 'ex2', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', nombre_original: 'Vista lateral', mime_type: 'image/jpeg', peso: 0 },
    { uuid: 'ex3', url: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=600&q=80', nombre_original: 'Interior', mime_type: 'image/jpeg', peso: 0 },
    { uuid: 'ex4', url: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80', nombre_original: 'Jardín', mime_type: 'image/jpeg', peso: 0 },
];

function Galeria({ fotos, idx, setIdx }: {
    fotos: Documento[];
    idx: number;
    setIdx: (i: number) => void;
}) {
    // Usar fotos reales si existen, si no mostrar ejemplos
    const items = fotos.length > 0 ? fotos : FOTOS_EJEMPLO as any[];
    const esEjemplo = fotos.length === 0;
    const fotoActual = items[idx] ?? null;

    return (
        <div style={{ width: 'min(605px, 100%)', flexShrink: 0, alignSelf: 'stretch', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,.1)', background: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}>
            {/* Imagen principal */}
            <div style={{ position: 'relative', width: '100%', height: 'clamp(160px, 32vw, 403px)',
                          background: 'linear-gradient(135deg,#f0f4f1,#e8f3eb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden' }}>
                {fotoActual?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={fotoActual.url} alt={fotoActual.nombre_original}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 40, height: 40, color: '#c8d8cc' }} fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#c8d8cc',
                                    letterSpacing: '.06em', textTransform: 'uppercase' }}>
                            Sin fotografías
                        </p>
                    </div>
                )}
                {/* Navegación si hay más de 1 foto */}
                {items.length > 1 && (
                    <>
                        <button type="button" onClick={() => setIdx(Math.max(0, idx - 1))}
                            disabled={idx === 0}
                            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                                      background: 'rgba(0,0,0,.45)', color: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      opacity: idx === 0 ? .3 : 1, zIndex: 2 }}>
                            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button type="button" onClick={() => setIdx(Math.min(items.length - 1, idx + 1))}
                            disabled={idx === items.length - 1}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                      width: 28, height: 28, borderRadius: '50%', border: 'none',
                                      background: 'rgba(0,0,0,.45)', color: '#fff', cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      opacity: idx === items.length - 1 ? .3 : 1, zIndex: 2 }}>
                            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        {/* Contador */}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2,
                                      background: 'rgba(0,0,0,.5)', borderRadius: 999,
                                      padding: '2px 8px', fontFamily: 'monospace',
                                      fontSize: '.58rem', color: '#fff' }}>
                            {idx + 1} / {items.length}
                        </div>
                    </>
                )}
            </div>

            {/* Info foto */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.72rem', fontWeight: 700,
                                color: '#1a2e22', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>
                        Fotografías
                    </p>
                    {esEjemplo && (
                        <span style={{ fontFamily: 'monospace', fontSize: '.52rem', color: '#d4a832',
                                        background: 'rgba(212,168,50,.1)', border: '1px solid rgba(212,168,50,.25)',
                                        padding: '1px 7px', borderRadius: 999 }}>
                            Ejemplo
                        </span>
                    )}
                </div>
                <p style={{ fontFamily: 'monospace', fontSize: '.58rem', color: '#9ab8a2', margin: '2px 0 0' }}>
                    {fotos.length > 0
                        ? `${fotos.length} imagen${fotos.length !== 1 ? 'es' : ''} adjunta${fotos.length !== 1 ? 's' : ''}`
                        : 'Sin fotografías — mostrando ejemplos'}
                </p>
            </div>

            {/* Thumbnails */}
            {items.length > 1 && (
                <div style={{ display: 'flex', gap: 5, padding: '8px 10px', overflowX: 'auto',
                              scrollbarWidth: 'thin', scrollbarColor: 'rgba(58,153,86,.25) transparent' }}>
                    {items.map((f: any, i: number) => (
                        <button key={f.uuid} type="button" onClick={() => setIdx(i)}
                            style={{ width: 94, height: 94, borderRadius: 6, flexShrink: 0, padding: 0,
                                      border: `2px solid ${i === idx ? '#3a9956' : 'rgba(0,0,0,.1)'}`,
                                      cursor: 'pointer', overflow: 'hidden', background: '#f0f4f1',
                                      transition: 'border-color .15s' }}>
                            {f.url
                                ? /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={f.url} alt={f.nombre_original}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                : <div style={{ width: '100%', height: '100%', background: '#e8f3eb' }} />
                            }
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function VerBienPage() {
    const { uuid }    = useParams<{ uuid: string }>();
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [bien,     setBien]     = useState<any>(null);
    const [loading,  setLoading]  = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [fotoIdx,  setFotoIdx]  = useState(0);

    useEffect(() => {
        api.get(`/api/bienes/uuid/${uuid}`)
            .then(({ data }) => setBien(data.data ?? data))
            .catch(err => { if (err.response?.status === 404) setNotFound(true); })
            .finally(() => setLoading(false));
    }, [uuid]);

    useEffect(() => {
        if (!bien || !mapRef.current || mapInstance.current) return;
        const lat = parseFloat(bien.latitud)  || -33.4489;
        const lng = parseFloat(bien.longitud) || -70.6693;

        import('leaflet').then(L => {
            if (!mapRef.current || mapInstance.current) return;
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
            const map = L.map(mapRef.current!, { zoomControl: true, dragging: true, scrollWheelZoom: false })
                         .setView([lat, lng], bien.latitud ? 16 : 10);
            // Capa satelital
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { maxZoom: 19, attribution: '© Esri' }).addTo(map);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                { maxZoom: 19, opacity: 0.5 }).addTo(map);
            if (bien.latitud) {
                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(
                    `<div style="font-family:monospace;font-size:.7rem">
                        <strong>${bien.carpeta}</strong><br/>
                        ${bien.direccion || ''}
                    </div>`
                ).openPopup();
            }
            mapInstance.current = map;
        });
        return () => { mapInstance.current?.remove(); mapInstance.current = null; };
    }, [bien]);

    // ── Eliminar documento ────────────────────────────────────────────────────
    const handleEliminarDoc = async (docUuid: string) => {
        if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return;
        try {
            await api.delete(`/api/documentos/${docUuid}`);
            setBien((prev: any) => ({
                ...prev,
                documentos: prev.documentos.filter((d: Documento) => d.uuid !== docUuid),
            }));
        } catch {
            alert('Error al eliminar el documento.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minHeight: 300, gap: 12, fontFamily: 'monospace', fontSize: '.7rem', color: '#9ab8a2' }}>
                <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }}
                    fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Cargando registro...
            </div>
        );
    }

    if (notFound || !bien) {
        return (
            <div style={{ textAlign: 'center', padding: 48, fontFamily: '"Barlow",sans-serif' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#ef4444', marginBottom: 16 }}>
                    Registro no encontrado
                </p>
                <Link href="/bienes" style={{ color: '#2e7d46', fontSize: '.78rem' }}>Volver al listado</Link>
            </div>
        );
    }

    return (
        <>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <div style={{ fontFamily: '"Barlow",sans-serif' }}>

                {/* PAGE HEADER */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                              flexWrap: 'wrap', gap: 20, marginBottom: 24, padding: '0 4px' }}>
                    {/* Info + botones */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                                      padding: '3px 10px 3px 8px', borderRadius: 999,
                                      background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956', flexShrink: 0 }} />
                            <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                                            color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                                Gestión de Bienes
                            </span>
                        </div>
                        <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                                      fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                                      letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
                            {bien.nombre_conjunto || bien.carpeta || 'Ficha del Bien'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
                                Carpeta: <strong>{bien.carpeta}</strong> · Rol: <strong>{bien.rol_avaluo}</strong>
                            </p>
                            <BadgeEstado label={bien.estado_propiedad?.descripcion} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/bienes/${uuid}/editar`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                                      borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                                      fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                                      color: '#fff', textDecoration: 'none',
                                      background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                                      boxShadow: '0 4px 14px rgba(59,130,246,.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                            onMouseLeave={e => (e.currentTarget.style.filter = '')}>
                            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                        </Link>
                        <Link href="/bienes"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                                      borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                                      fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                                      color: '#1a2e22', textDecoration: 'none',
                                      background: 'linear-gradient(135deg,#8a6a18,#d4a832)',
                                      boxShadow: '0 4px 14px rgba(201,168,76,.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                            onMouseLeave={e => (e.currentTarget.style.filter = '')}>
                            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver
                        </Link>
                    </div>
                </div>

                {/* FICHA */}
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                              borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>

                    {/* UUID */}
                    <div style={{ padding: '10px 28px', background: 'rgba(0,0,0,.02)',
                                  borderBottom: '1px solid rgba(0,0,0,.06)',
                                  display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 11, height: 11, color: '#9ab8a2', flexShrink: 0 }} fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span style={{ fontFamily: 'monospace', fontSize: '.58rem', color: '#9ab8a2', letterSpacing: '.08em' }}>
                            UUID: {bien.uuid}
                        </span>
                    </div>

                    {/* SECCIÓN 1 */}
                    <Section>
                        <SecTitle label="Información General" />
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {/* Campos */}
                            <div style={{ flex: 1, minWidth: 280 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                                    <Field label="N° de Carpeta"><ReadInput value={bien.carpeta} /></Field>
                                    <Field label="Nombre del Conjunto"><ReadInput value={bien.nombre_conjunto} /></Field>
                                    <Field label="Rol Avalúo"><ReadInput value={bien.rol_avaluo} /></Field>
                                    <Field label="Tipo Vivienda"><ReadInput value={bien.tipo_propiedad?.descripcion} /></Field>
                                    <Field label="Estado Vivienda"><ReadInput value={bien.estado_propiedad?.descripcion} /></Field>
                            <Field label="Administrado por"><ReadInput value={bien.administrador?.descripcion} /></Field>
                            <Field label="Uso"><ReadInput value={bien.uso?.descripcion} /></Field>
                                </div>
                                {/* Cantidad de viviendas */}
                                <div style={{ marginTop: 16 }}>
                                    <label style={{ display: 'block', fontSize: '.58rem', fontWeight: 600,
                                                    color: '#9ab8a2', textTransform: 'uppercase',
                                                    letterSpacing: '.14em', marginBottom: 12,
                                                    fontFamily: 'monospace' }}>
                                        Cantidad de Viviendas por Tipo
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
                                        {([
                                            ['casa','Casas'],['departamentos','Departamentos'],['cabana','Cabañas'],
                                            ['centro_recreacional','Centros Recreacionales'],['refugio','Refugios'],
                                            ['casino','Casinos'],['oficina','Oficinas'],['fundo','Fundos'],
                                            ['agricola','Agrícolas'],['bodega','Bodegas'],['sitio_eriazo','Sitios Eriazos'],
                                                                ] as [string,string][]).map(([k, label]) => (
                                            <div key={k} style={{ padding: '9px 12px', borderRadius: 8,
                                                                  background: (bien[k] ?? 0) > 0 ? 'rgba(58,153,86,.05)' : 'rgba(0,0,0,.02)',
                                                                  border: (bien[k] ?? 0) > 0 ? '1px solid rgba(58,153,86,.15)' : '1px solid rgba(0,0,0,.07)',
                                                                  display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '.54rem', fontWeight: 600,
                                                                color: '#9ab8a2', textTransform: 'uppercase',
                                                                letterSpacing: '.1em', lineHeight: 1.2 }}>{label}</span>
                                                <span style={{ fontFamily: '"Barlow Condensed",sans-serif',
                                                                fontSize: '1.3rem', fontWeight: 800, lineHeight: 1,
                                                                color: (bien[k] ?? 0) > 0 ? '#2e7d46' : '#c8d8cc' }}>
                                                    {bien[k] ?? 0}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                            {/* Galería */}
                            <div style={{ width: 'min(605px, 100%)', flexShrink: 0 }}>
                                <Galeria
                                    fotos={(bien.documentos ?? []).filter((d: any) => d.mime_type?.startsWith('image/'))}
                                    idx={fotoIdx}
                                    setIdx={setFotoIdx}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* SECCIÓN 2 */}
                    <Section>
                        <SecTitle label="Ubicación" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                                      gap: 16, marginBottom: 16 }}>
                            <Field label="Región"><ReadInput value={bien.region?.descripcion} /></Field>
                            <Field label="Provincia"><ReadInput value={bien.provincia?.descripcion} /></Field>
                            <Field label="Comuna"><ReadInput value={bien.comuna?.descripcion} /></Field>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Field label="Dirección"><ReadInput value={bien.direccion} /></Field>
                        </div>
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
                                      border: '1px solid rgba(58,153,86,.2)' }}>
                            <div ref={mapRef} style={{ width: '100%', height: 340 }} />
                        </div>
                        {bien.latitud && (
                            <p style={{ marginTop: 8, fontSize: '.62rem', color: '#6b8f75', fontFamily: 'monospace' }}>
                                Coordenadas: {parseFloat(bien.latitud).toFixed(6)}, {parseFloat(bien.longitud).toFixed(6)}
                            </p>
                        )}
                    </Section>

                    {/* SECCIÓN 3 */}
                    <Section>
                        <SecTitle label="Información Técnica y Registral" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                            <Field label="Tasación Comercial"><ReadMoney value={bien.tasacion_comercial} /></Field>
                            <Field label="Superficie Terreno"><ReadM2 value={bien.superficie} /></Field>
                            <Field label="Metros Construidos"><ReadM2 value={bien.metros_construidos} /></Field>
                            <Field label="Fojas"><ReadInput value={bien.fojas} /></Field>
                            <Field label="N°"><ReadInput value={bien.numero_inscripcion} /></Field>
                            <Field label="Número Rol SII"><ReadInput value={bien.numero_rol_sii} /></Field>
                            <Field label="Año Registrado"><ReadInput value={bien.ano_registro} /></Field>
                            <div style={{ gridColumn: 'span 2' }}>
                                <Field label="Conservador"><ReadInput value={bien.conservador?.descripcion} /></Field>
                            </div>
                            <Field label="Avalúo F. Terreno"><ReadMoney value={bien.avaluo_fiscal_terreno} /></Field>
                            <Field label="Avalúo F. Construcción"><ReadMoney value={bien.avaluo_fiscal_construccion} /></Field>
                            <Field label="Avalúo F. Total"><ReadMoney value={bien.avaluo_fiscal_total} /></Field>
                        </div>
                        {bien.observaciones && (
                            <div style={{ marginTop: 16 }}>
                                <Field label="Observaciones">
                                    <textarea readOnly value={bien.observaciones}
                                        style={{ ...readStyle, resize: 'none', minHeight: 76,
                                                  lineHeight: 1.55, cursor: 'default' }} />
                                </Field>
                            </div>
                        )}
                    </Section>

                    {/* SECCIÓN 4 — Documentos */}
                    <SeccionDocumentos
                        documentos={bien.documentos ?? []}
                        onEliminar={handleEliminarDoc}
                        modoVer={true}
                    />

                    {/* FOOTER */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  flexWrap: 'wrap', gap: 12, padding: '16px 28px',
                                  background: 'rgba(0,0,0,.03)', borderTop: '1px solid rgba(0,0,0,.06)' }}>
                        <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#9ab8a2' }}>
                            Registrado el {bien.created_at
                                ? new Date(bien.created_at).toLocaleDateString('es-CL', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                }) : '—'}
                        </p>
                        <Link href="/bienes"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                                      padding: '9px 20px', borderRadius: 9,
                                      fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem',
                                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                                      color: '#6b8f75', background: '#eaf3ec',
                                      border: '1px solid rgba(0,0,0,.1)', textDecoration: 'none' }}>
                            Volver al Listado
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}