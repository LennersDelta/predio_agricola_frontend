// app/bienes/crear/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useTipoPropiedad }  from '@/hooks/useTipoPropiedad';
import { useEstadoPropiedad } from '@/hooks/useEstadoPropiedad';
import { useRegiones }        from '@/hooks/useRegiones';
import { useProvincias }      from '@/hooks/useProvincias';
import { useComunas }         from '@/hooks/useComunas';
import { useConservador }     from '@/hooks/useConservador';
import { useAdministrador }    from '@/hooks/useAdministrador';
import { useUso }              from '@/hooks/useUso';
import { toast } from 'sonner';
import DocumentosAdjuntos, { DocAdjunto } from '@/components/DocumentosAdjuntos';

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS REUTILIZABLES
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
  outline: 'none', fontFamily: '"Barlow",sans-serif', appearance: 'none',
  transition: 'border-color .18s, box-shadow .18s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
  textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5,
  fontFamily: 'monospace',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div data-field={label}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#fca5a5', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#ef4444',
                    marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function FInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={inputStyle}
      onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

function FInputMoney({ readOnly: ro, value, onChange, placeholder, style: extraStyle }: {
  readOnly?: boolean;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
        fontSize: '.78rem', color: '#6b8f75', fontFamily: 'monospace',
        fontWeight: 600, pointerEvents: 'none', zIndex: 1, lineHeight: 1,
      }}>$</span>
      <input
        type={ro ? 'text' : 'number'} step="1" readOnly={ro}
        value={value} onChange={onChange} placeholder={placeholder ?? '0'}
        style={{
          ...inputStyle, paddingLeft: 22,
          ...(ro ? { background: 'rgba(58,153,86,.05)', border: '1px solid rgba(58,153,86,.2)',
                      color: '#2e7d46', fontWeight: 600, cursor: 'default' } : {}),
          ...extraStyle,
        }}
        onFocus={e => { if (!ro) { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; } }}
        onBlur={e  => { if (!ro) { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; } }}
      />
    </div>
  );
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{
      ...inputStyle, paddingRight: 34, cursor: 'pointer',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center',
    }}
      onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
    >
      {children}
    </select>
  );
}

function SecTitle({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2,
                    background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }} />
      <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                      fontWeight: 700, color: '#2e7d46', textTransform: 'uppercase',
                      letterSpacing: '.12em' }}>
        {label}
      </span>
    </div>
  );
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)', ...style }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function CrearBienPage() {
  const router      = useRouter();
  const mapRef       = useRef<HTMLDivElement>(null);
  const leaflet      = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const mapInstance  = useRef<any>(null);
  const geoTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    numero_carpeta: '', nombre_conjunto: '', rol_avaluo: '', tipo_vivienda: '',
    estado_vivienda: '1', region_id: '', provincia_id: '', comuna_id: '',
    direccion: '', numero_rol_sii: '', tasacion_comercial: '',
    superficie_terreno: '', metros_construidos: '', inscrito_fojas: '',
    numero_inscripcion: '', anio_registrado: '', conservador: '',
    observaciones: '', latitud: '', longitud: '', dir_completa: '',
    avaluo_terreno: '', avaluo_construccion: '', avaluo_total: '',
    administrador_id: '',
    uso_id: '',
    casa: '', departamentos: '', cabana: '', centro_recreacional: '',
    refugio: '', casino: '', oficina: '', fundo: '',
    agricola: '', bodega: '', sitio_eriazo: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { tipos: tiposVivienda,    loading: loadingTipos    } = useTipoPropiedad();
  const { estados: estadosVivienda, loading: loadingEstados } = useEstadoPropiedad();
  const { regiones,                loading: loadingRegiones } = useRegiones();
  const { provincias, loading: loadingProv, cargar: cargarProvincias } = useProvincias();
  const { comunas,   loading: loadingCom,  cargar: cargarComunas, limpiar: limpiarComunas } = useComunas();
  const { conservador, loading: loadingConservador } = useConservador();
  const { administrador, loading: loadingAdministrador } = useAdministrador();
  const { uso, loading: loadingUso } = useUso();

  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Documentos vacíos al crear — se llenan con el componente
  const [docs, setDocs] = useState<DocAdjunto[]>([]);

  // ── Mapa Leaflet ───────────────────────────────────────────────────────────
  useEffect(() => {
    import('leaflet').then(L => {
      if (!mapRef.current || mapInstance.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      const map = L.map(mapRef.current!).setView([-33.4489, -70.6693], 13);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: '© Esri' }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.5 }).addTo(map);
      map.on('click', (e: any) => setMarker(L, map, e.latlng.lat, e.latlng.lng));
      mapInstance.current = map;
      leaflet.current = L;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  const setMarker = (L: any, map: any, lat: number, lng: number) => {
    if (markerRef.current) map.removeLayer(markerRef.current);
    markerRef.current = L.marker([lat, lng]).addTo(map);
    set('latitud', String(lat)); set('longitud', String(lng));
  };

  const geocodificar = async (direccion: string) => {
    if (!leaflet.current || !mapInstance.current) return;
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?countrycodes=cl&format=json&q=${encodeURIComponent(direccion)}`);
      const data = await res.json();
      if (!data.length) return;
      const { lat, lon, display_name } = data[0];
      mapInstance.current.setView([parseFloat(lat), parseFloat(lon)], 16);
      setMarker(leaflet.current, mapInstance.current, parseFloat(lat), parseFloat(lon));
      set('dir_completa', display_name);
    } catch {}
  };

  // Geocodifica usando los campos de ubicación disponibles
  const geocodificarUbicacion = (overrides: Partial<typeof form> = {}) => {
    const f = { ...form, ...overrides };
    // Construir query con lo que haya disponible
    const partes: string[] = [];
    if (f.direccion)   partes.push(f.direccion);
    // Buscar nombre de comuna/región desde los arrays cargados
    const comunaNombre   = comunas.find(c  => String(c.id)  === f.comuna_id)?.descripcion;
    const provinciaNombre= provincias.find(p => String(p.id) === f.provincia_id)?.descripcion;
    const regionNombre   = regiones.find(r  => String(r.id)  === f.region_id)?.descripcion;
    if (comunaNombre)    partes.push(comunaNombre);
    if (provinciaNombre) partes.push(provinciaNombre);
    if (regionNombre)    partes.push(regionNombre);
    if (partes.length === 0) return;
    geocodificar(partes.join(', '));
  };

  const miUbicacion = () => {
    if (!navigator.geolocation || !leaflet.current || !mapInstance.current) return;
    navigator.geolocation.getCurrentPosition(pos => {
      mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 16);
      setMarker(leaflet.current, mapInstance.current, pos.coords.latitude, pos.coords.longitude);
    });
  };

  const onRegionChange = async (id: string) => {
    set('region_id', id); set('provincia_id', ''); set('comuna_id', '');
    limpiarComunas();
    await cargarProvincias(id);
    // Geocodificar con región sola si no hay dirección más específica
    geocodificarUbicacion({ region_id: id, provincia_id: '', comuna_id: '' });
  };
  const onProvinciaChange = async (id: string) => {
    set('provincia_id', id); set('comuna_id', '');
    await cargarComunas(id);
    geocodificarUbicacion({ provincia_id: id, comuna_id: '' });
  };
  const onComunaChange = (id: string) => {
    set('comuna_id', id);
    geocodificarUbicacion({ comuna_id: id });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const [loadingBorrador, setLoadingBorrador] = useState(false);

  const handleSubmit = async (e: React.FormEvent, esBorrador = false) => {
    e.preventDefault();

    // Validación frontend — solo si NO es borrador
    if (!esBorrador) {
      const errsFront: Record<string, string> = {};
      if (!form.rol_avaluo)          errsFront.rol_avaluo          = 'El Rol de Avalúo es obligatorio.';
      if (!form.tipo_vivienda)       errsFront.tipo_vivienda       = 'Debe seleccionar un tipo de vivienda.';
      if (!form.estado_vivienda)     errsFront.estado_vivienda     = 'Debe seleccionar un estado.';
      if (!form.region_id)           errsFront.region_id           = 'Debe seleccionar una región.';
      if (!form.provincia_id)        errsFront.provincia_id        = 'Debe seleccionar una provincia.';
      if (!form.comuna_id)           errsFront.comuna_id           = 'Debe seleccionar una comuna.';
      if (!form.direccion)           errsFront.direccion           = 'La dirección es obligatoria.';
      if (!form.numero_rol_sii)      errsFront.numero_rol_sii      = 'El Número Rol SII es obligatorio.';
      if (!form.avaluo_terreno || form.avaluo_terreno === '0')          errsFront.avaluo_terreno      = 'El Avalúo Fiscal Terreno es obligatorio.';
      if (!form.avaluo_construccion || form.avaluo_construccion === '0') errsFront.avaluo_construccion = 'El Avalúo Fiscal Construcción es obligatorio.';
      if (!form.tasacion_comercial  || form.tasacion_comercial  === '0') errsFront.tasacion_comercial  = 'La Tasación Comercial es obligatoria.';
      if (!form.superficie_terreno  || form.superficie_terreno  === '0') errsFront.superficie_terreno  = 'La Superficie de Terreno es obligatoria.';
      if (!form.metros_construidos  || form.metros_construidos  === '0') errsFront.metros_construidos  = 'Los Metros Construidos son obligatorios.';
      if (!form.inscrito_fojas)      errsFront.inscrito_fojas      = 'Las Fojas son obligatorias.';
      if (!form.numero_inscripcion)  errsFront.numero_inscripcion  = 'El N° de Inscripción es obligatorio.';
      if (!form.anio_registrado)     errsFront.anio_registrado     = 'El Año de Registro es obligatorio.';
      if (!form.conservador)         errsFront.conservador         = 'Debe seleccionar un Conservador.';
      if (Object.keys(errsFront).length > 0) {
        setErrors(errsFront);
        toast.error(Object.values(errsFront)[0], { duration: 5000 });
        const primerCampo = Object.keys(errsFront)[0];
        document.querySelector(`[data-field="${primerCampo}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    if (esBorrador) setLoadingBorrador(true);
    else setLoading(true);
    setErrors({});
    const toastId = toast.loading(esBorrador ? 'Guardando borrador...' : 'Guardando bien inmueble...');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('es_borrador', esBorrador ? '1' : '0');

      docs.forEach((d, i) => {
        fd.append(`documentos[${i}][archivo]`,           d.archivo);
        fd.append(`documentos[${i}][tipo_documento_id]`, d.tipoId);
      });

      await api.post('/api/bienes/grabar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(esBorrador ? 'Borrador guardado correctamente' : 'Propiedad registrada correctamente', {
        id: toastId, duration: 3000,
      });
      setTimeout(() => router.push(esBorrador ? '/bienes?tab=borradores' : '/bienes'), 1500);

    } catch (err: any) {
      const errorsData = err.response?.data?.errors as Record<string, string[]> | undefined;
      if (errorsData) {
        const mapped: Record<string, string> = {};
        Object.entries(errorsData).forEach(([k, v]) => { mapped[k] = v[0]; });
        setErrors(mapped);
        const primerCampo   = Object.keys(errorsData)[0];
        const primerMensaje = errorsData[primerCampo][0];
        toast.error(primerMensaje, { id: toastId, duration: 5000 });
        document.querySelector(`[data-field="${primerCampo}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        toast.error(err.response?.data?.message ?? 'Error al guardar',
          { id: toastId, duration: 5000 });
      }
    } finally {
      setLoading(false);
      setLoadingBorrador(false);
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div style={{ fontFamily: '"Barlow",sans-serif' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '0 4px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                          padding: '3px 10px 3px 8px', borderRadius: 999,
                          background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%',
                              background: '#3a9956', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 500,
                              color: '#2e7d46', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Gestión de Bienes
              </span>
            </div>
            <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
                          fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
                          letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>
              Nuevo Bien Inmueble
            </h2>
            <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
              Complete la información de la ficha de ingreso de la propiedad
            </p>
          </div>
          <Link href="/bienes"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                      borderRadius: 8, fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.8rem',
                      fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                      color: '#1a2e22', textDecoration: 'none',
                      background: 'linear-gradient(135deg,#8a6a18,#d4a832)',
                      boxShadow: '0 4px 14px rgba(201,168,76,.3)' }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = '')}
          >
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                        borderRadius: 14, overflow: 'hidden',
                        boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>

            {/* SECCIÓN 1 — Información General */}
            <Section>
              <SecTitle label="Información General" />
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
                <Field label="N° de Carpeta" required error={errors.carpeta}>
                  <FInput placeholder="Ej: VALP0016" value={form.numero_carpeta}
                    onChange={e => set('numero_carpeta', e.target.value)} required />
                </Field>
                <Field label="Nombre del Conjunto">
                  <FInput placeholder="Ej: Chacra Monte Carmelo" value={form.nombre_conjunto}
                    onChange={e => set('nombre_conjunto', e.target.value)} />
                </Field>
                <Field label="Rol Avalúo" required error={errors.rol_avaluo}>
                  <FInput placeholder="Ej: 00322-00001" value={form.rol_avaluo}
                    onChange={e => set('rol_avaluo', e.target.value)} required />
                </Field>
                <Field label="Tipo Vivienda" required error={errors.tipo_vivienda}>
                  <FSelect value={form.tipo_vivienda}
                    onChange={e => set('tipo_vivienda', e.target.value)}
                    disabled={loadingTipos}>
                    <option value="" disabled>
                      {loadingTipos ? 'Cargando...' : 'Seleccione tipo'}
                    </option>
                    {tiposVivienda.map(t => (
                      <option key={t.id} value={t.id}>{t.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
                <Field label="Administrado por">
                  <FSelect value={form.administrador_id}
                    onChange={e => set('administrador_id', e.target.value)}
                    disabled={loadingAdministrador}>
                    <option value="">
                      {loadingAdministrador ? 'Cargando...' : 'Seleccione administrador'}
                    </option>
                    {administrador.map(a => (
                      <option key={a.id} value={a.id}>{a.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
                <Field label="Uso">
                  <FSelect value={form.uso_id}
                    onChange={e => set('uso_id', e.target.value)}
                    disabled={loadingUso}>
                    <option value="">
                      {loadingUso ? 'Cargando...' : 'Seleccione uso'}
                    </option>
                    {uso.map(u => (
                      <option key={u.id} value={u.id}>{u.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
                <Field label="Estado Vivienda" error={errors.estado_vivienda}>
                  <FSelect value={form.estado_vivienda}
                    onChange={e => set('estado_vivienda', e.target.value)}
                    disabled={loadingEstados}>
                    <option value="" disabled>
                      {loadingEstados ? 'Cargando...' : 'Seleccione estado'}
                    </option>
                    {estadosVivienda.map(t => (
                      <option key={t.id} value={t.id}>{t.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
              </div>

              {/* Cantidad de viviendas por tipo */}
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
                                textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 12,
                                fontFamily: 'monospace' }}>Cantidad de Viviendas por Tipo</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {([
                    ['casa',               'Casas'],
                    ['departamentos',      'Departamentos'],
                    ['cabana',             'Cabañas'],
                    ['centro_recreacional','Centros Recreacionales'],
                    ['refugio',            'Refugios'],
                    ['casino',             'Casinos'],
                    ['oficina',            'Oficinas'],
                    ['fundo',              'Fundos'],
                    ['agricola',           'Agrícolas'],
                    ['bodega',             'Bodegas'],
                    ['sitio_eriazo',       'Sitios Eriazos'],
                  ] as [string, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '.58rem', fontWeight: 600, color: '#9ab8a2',
                                      textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5,
                                      fontFamily: 'monospace' }}>{label}</label>
                      <input
                        type="number" min="0" step="1"
                        value={(form as any)[key] ?? ''}
                        onChange={e => set(key, e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                                  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', padding: '9px 13px',
                                  outline: 'none', fontFamily: '"Barlow",sans-serif',
                                  transition: 'border-color .18s, box-shadow .18s' }}
                        onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* SECCIÓN 2 — Ubicación */}
            <Section>
              <SecTitle label="Ubicación" />
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                            gap: 16, marginBottom: 16 }}>
                <Field label="Región" required error={errors.region_id}>
                  <FSelect value={form.region_id}
                    onChange={e => onRegionChange(e.target.value)} disabled={loadingRegiones}>
                    <option value="" disabled>
                      {loadingRegiones ? 'Cargando...' : 'Seleccione región'}
                    </option>
                    {regiones.map(t => (
                      <option key={t.id} value={t.id}>{t.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
                <Field label="Provincia" required error={errors.provincia_id}>
                  <FSelect value={form.provincia_id}
                    onChange={e => onProvinciaChange(e.target.value)}
                    disabled={loadingProv || !form.region_id}>
                    <option value="" disabled>
                      {loadingProv ? 'Cargando...' : 'Seleccione provincia'}
                    </option>
                    {provincias.map(p => (
                      <option key={p.id} value={p.id}>{p.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
                <Field label="Comuna" required error={errors.comuna_id}>
                  <FSelect value={form.comuna_id}
                    onChange={e => onComunaChange(e.target.value)}
                    disabled={loadingCom || !form.provincia_id}>
                    <option value="" disabled>
                      {loadingCom ? 'Cargando...' : 'Seleccione comuna'}
                    </option>
                    {comunas.map(c => (
                      <option key={c.id} value={c.id}>{c.descripcion}</option>
                    ))}
                  </FSelect>
                </Field>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Field label="Dirección" error={errors.direccion}>
                  <FInput placeholder="Ej: Av. Eastman N°1047" value={form.direccion}
                    onChange={e => {
                      const val = e.target.value;
                      set('direccion', val);
                      // Debounce: esperar 800ms después de dejar de escribir
                      if (geoTimer.current) clearTimeout(geoTimer.current);
                      if (val.length >= 5) {
                        geoTimer.current = setTimeout(() => {
                          geocodificarUbicacion({ direccion: val });
                        }, 800);
                      }
                    }}
                    onBlur={e => {
                      if (geoTimer.current) clearTimeout(geoTimer.current);
                      if (e.target.value) geocodificarUbicacion({ direccion: e.target.value });
                    }} />
                </Field>
              </div>
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
                            border: '1px solid rgba(58,153,86,.2)' }}>
                <div ref={mapRef} style={{ width: '100%', height: 340 }} />
                <button type="button" onClick={miUbicacion}
                  style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 999,
                            width: 34, height: 34, borderRadius: 8,
                            background: 'rgba(13,35,24,.9)',
                            border: '1px solid rgba(58,153,86,.3)', color: '#3a9956',
                            cursor: 'pointer', fontSize: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Mi ubicación">
                  📍
                </button>
              </div>
              {form.latitud && (
                <p style={{ marginTop: 8, fontSize: '.62rem', color: '#6b8f75',
                            fontFamily: 'monospace' }}>
                  Coordenadas: {parseFloat(form.latitud).toFixed(6)}, {parseFloat(form.longitud).toFixed(6)}
                </p>
              )}
            </Section>

            {/* SECCIÓN 3 — Información Técnica */}
            <Section>
              <SecTitle label="Información Técnica y Registral" />
              <div style={{ display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                <Field label="Número Rol SII" error={errors.numero_rol_sii}>
                  <FInput placeholder="Ej: 00322-00001" value={form.numero_rol_sii}
                    onChange={e => set('numero_rol_sii', e.target.value)} />
                </Field>
                <Field label="Tasación Comercial" error={errors.tasacion_comercial}>
                  <FInputMoney
                    value={form.tasacion_comercial}
                    onChange={e => set('tasacion_comercial', e.target.value)}
                  />
                </Field>
                <Field label="Superficie Terreno" error={errors.superficie_terreno}>
                  <div style={{ position: 'relative' }}>
                    <FInput type="number" step="0.01" placeholder="0.00"
                      value={form.superficie_terreno}
                      onChange={e => set('superficie_terreno', e.target.value)}
                      style={{ ...inputStyle, paddingRight: 36 }} />
                    <span style={{ position: 'absolute', right: 11, top: '50%',
                                    transform: 'translateY(-50%)', fontSize: '.68rem',
                                    color: '#6b8f75', fontFamily: 'monospace',
                                    pointerEvents: 'none' }}>m²</span>
                  </div>
                </Field>
                <Field label="Metros Construidos" error={errors.metros_construidos}>
                  <div style={{ position: 'relative' }}>
                    <FInput type="number" step="0.01" placeholder="0.00"
                      value={form.metros_construidos}
                      onChange={e => set('metros_construidos', e.target.value)}
                      style={{ ...inputStyle, paddingRight: 36 }} />
                    <span style={{ position: 'absolute', right: 11, top: '50%',
                                    transform: 'translateY(-50%)', fontSize: '.68rem',
                                    color: '#6b8f75', fontFamily: 'monospace',
                                    pointerEvents: 'none' }}>m²</span>
                  </div>
                </Field>
                <Field label="Fojas" error={errors.inscrito_fojas}>
                  <FInput placeholder="Ej: 583" value={form.inscrito_fojas}
                    onChange={e => set('inscrito_fojas', e.target.value)} />
                </Field>
                <Field label="N°" error={errors.numero_inscripcion}>
                  <FInput placeholder="Ej: 892" value={form.numero_inscripcion}
                    onChange={e => set('numero_inscripcion', e.target.value)} />
                </Field>
                <Field label="Año" error={errors.anio_registrado}>
                  <FInput type="number" placeholder={String(new Date().getFullYear())}
                    min="1900" max={String(new Date().getFullYear())}
                    value={form.anio_registrado}
                    onChange={e => set('anio_registrado', e.target.value)} />
                </Field>
                <div style={{ gridColumn: 'span 2' }}>
                  <Field label="Conservador" error={errors.conservador}>
                    <FSelect value={form.conservador} disabled={loadingConservador}
                      onChange={e => set('conservador', e.target.value)}>
                      <option value="" disabled>
                        {loadingConservador ? 'Cargando...' : 'Seleccione conservador'}
                      </option>
                      {conservador.map(t => (
                        <option key={t.id} value={t.id}>{t.descripcion}</option>
                      ))}
                    </FSelect>
                  </Field>
                </div>

                {/* ── Avalúos fiscales ── */}
                <Field label="Avalúo F. Terreno" error={errors.avaluo_terreno}>
                  <FInputMoney
                    value={form.avaluo_terreno}
                    onChange={e => {
                      const terreno = e.target.value;
                      const total = (parseFloat(terreno || '0') + parseFloat(form.avaluo_construccion || '0')) || 0;
                      setForm(f => ({ ...f, avaluo_terreno: terreno, avaluo_total: String(total) }));
                    }}
                  />
                </Field>

                <Field label="Avalúo F. Construcción" error={errors.avaluo_construccion}>
                  <FInputMoney
                    value={form.avaluo_construccion}
                    onChange={e => {
                      const construccion = e.target.value;
                      const total = (parseFloat(form.avaluo_terreno || '0') + parseFloat(construccion || '0')) || 0;
                      setForm(f => ({ ...f, avaluo_construccion: construccion, avaluo_total: String(total) }));
                    }}
                  />
                </Field>

                <Field label="Avalúo F. Total">
                  <FInputMoney
                    readOnly
                    value={form.avaluo_total || ''}
                    placeholder="Calculado automáticamente"
                  />
                  <p style={{ fontFamily: 'monospace', fontSize: '.55rem',
                              color: '#9ab8a2', marginTop: 4 }}>
                    Suma de terreno + construcción
                  </p>
                </Field>
              </div>
              <div style={{ marginTop: 16 }}>
                <Field label="Observaciones">
                  <textarea value={form.observaciones}
                    onChange={e => set('observaciones', e.target.value)}
                    placeholder="Notas adicionales sobre el inmueble..."
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 76, lineHeight: 1.55 }}
                    onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </Field>
              </div>
            </Section>

            {/* SECCIÓN 4 — Documentos Adjuntos */}
            <Section>
              <DocumentosAdjuntos docs={docs} onChange={setDocs} />
            </Section>

            {/* FOOTER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          flexWrap: 'wrap', gap: 12, padding: '20px 28px',
                          background: 'rgba(0,0,0,.03)', borderTop: '1px solid rgba(0,0,0,.06)' }}>
              <p style={{ fontSize: '.65rem', color: '#9ab8a2', fontFamily: 'monospace' }}>
                <span style={{ color: '#fca5a5' }}>*</span> Campos obligatorios
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link href="/bienes"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '10px 20px', borderRadius: 9,
                            fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                            color: '#6b8f75', background: '#eaf3ec',
                            border: '1px solid rgba(0,0,0,.1)', textDecoration: 'none' }}>
                  Cancelar
                </Link>
                <button type="button"
                  onClick={e => handleSubmit(e as any, true)}
                  disabled={loadingBorrador || loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '10px 22px', borderRadius: 9,
                            border: '1px solid rgba(212,168,50,.4)',
                            background: 'rgba(212,168,50,.08)',
                            color: '#8a6a18', cursor: loadingBorrador ? 'not-allowed' : 'pointer',
                            fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                            opacity: loadingBorrador ? .7 : 1 }}>
                  {loadingBorrador ? (
                    <svg className="animate-spin" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                    </svg>
                  )}
                  {loadingBorrador ? 'Guardando...' : 'Guardar Borrador'}
                </button>
                <button type="submit" disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '10px 24px', borderRadius: 9, border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                            color: '#0d2318',
                            background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
                            boxShadow: '0 4px 14px rgba(76,202,122,.28)',
                            opacity: loading ? .7 : 1 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  {loading ? (
                    <svg className="animate-spin" style={{ width: 14, height: 14 }}
                      fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {loading ? 'Guardando...' : 'Guardar Bien'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}