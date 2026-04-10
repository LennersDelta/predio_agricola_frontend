'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/axios';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface RegionData {
  region_id: number;
  nombre: string;
  total: number;
  nuevas: number;
  activas: number;
}

interface EstadoData { estado: string; total: number; }

interface PropiedadDetalle {
  id: number; uuid: string; carpeta: string; rol_avaluo: string;
  nombre_conjunto: string; direccion: string; avaluo_fiscal_total: number;
  tipo: string; estado: string; comuna: string; created_at: string;
}

interface DetalleRegion {
  region: string; region_id: number; total: number; nuevas: number;
  avaluo_total: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
  propiedades: PropiedadDetalle[];
}

interface DashData {
  porRegion: RegionData[];
  porEstado: EstadoData[];
  grandTotal: number; grandNuevas: number; grandActivas: number;
}

// GeoJSON simplificado regiones Chile (con region_id aproximado por orden)
const GEOJSON_FEATURES = [
  {codigo:'XV',nombre:'Arica y Parinacota', coords:[[[-70.3,-17.5],[-69.5,-17.5],[-69.5,-18.4],[-70.3,-18.4],[-70.3,-17.5]]]},
  {codigo:'I', nombre:'Tarapacá',           coords:[[[-70.3,-18.4],[-69.5,-18.4],[-69.2,-19.2],[-68.8,-19.6],[-69.0,-20.5],[-70.1,-20.8],[-70.5,-20.0],[-70.3,-18.4]]]},
  {codigo:'II',nombre:'Antofagasta',        coords:[[[-70.1,-20.8],[-69.0,-20.5],[-68.5,-21.0],[-67.8,-22.0],[-67.5,-23.5],[-68.0,-24.5],[-69.5,-24.8],[-70.4,-23.5],[-70.6,-22.0],[-70.1,-20.8]]]},
  {codigo:'III',nombre:'Atacama',           coords:[[[-70.4,-23.5],[-69.5,-24.8],[-68.5,-26.0],[-68.8,-27.5],[-70.0,-27.8],[-71.0,-27.0],[-71.2,-25.5],[-70.4,-23.5]]]},
  {codigo:'IV',nombre:'Coquimbo',           coords:[[[-71.0,-27.8],[-68.8,-27.5],[-69.0,-29.0],[-69.5,-30.5],[-70.5,-30.8],[-71.5,-30.2],[-71.8,-29.0],[-71.0,-27.8]]]},
  {codigo:'V', nombre:'Valparaíso',         coords:[[[-71.5,-30.2],[-70.5,-30.8],[-70.2,-32.0],[-71.0,-32.5],[-71.8,-32.2],[-72.0,-31.5],[-71.5,-30.2]]]},
  {codigo:'RM',nombre:'Metropolitana',      coords:[[[-71.0,-32.5],[-70.2,-32.0],[-69.8,-33.0],[-70.0,-34.0],[-71.2,-33.8],[-71.5,-33.0],[-71.0,-32.5]]]},
  {codigo:'VI',nombre:"O'Higgins",          coords:[[[-71.2,-33.8],[-70.0,-34.0],[-69.8,-34.8],[-70.5,-35.2],[-71.5,-35.0],[-71.8,-34.2],[-71.2,-33.8]]]},
  {codigo:'VII',nombre:'Maule',             coords:[[[-71.5,-35.0],[-70.5,-35.2],[-70.2,-36.0],[-70.5,-36.8],[-71.8,-36.5],[-72.2,-35.8],[-71.5,-35.0]]]},
  {codigo:'XVI',nombre:'Ñuble',             coords:[[[-71.8,-36.5],[-70.5,-36.8],[-70.3,-37.3],[-71.0,-37.6],[-72.0,-37.3],[-72.2,-36.8],[-71.8,-36.5]]]},
  {codigo:'VIII',nombre:'Biobío',           coords:[[[-72.0,-37.3],[-71.0,-37.6],[-70.8,-38.5],[-71.5,-38.8],[-72.5,-38.5],[-73.0,-37.8],[-72.0,-37.3]]]},
  {codigo:'IX',nombre:'La Araucanía',       coords:[[[-72.5,-38.5],[-71.5,-38.8],[-71.2,-39.5],[-71.5,-40.0],[-72.8,-39.8],[-73.2,-39.0],[-72.5,-38.5]]]},
  {codigo:'XIV',nombre:'Los Ríos',          coords:[[[-72.8,-39.8],[-71.5,-40.0],[-71.5,-40.8],[-72.0,-41.5],[-73.0,-41.2],[-73.5,-40.5],[-72.8,-39.8]]]},
  {codigo:'X', nombre:'Los Lagos',          coords:[[[-73.0,-41.2],[-72.0,-41.5],[-71.8,-42.5],[-72.5,-43.5],[-73.8,-43.0],[-74.2,-42.0],[-73.5,-41.2],[-73.0,-41.2]]]},
  {codigo:'XI',nombre:'Aysén',              coords:[[[-73.8,-43.0],[-72.5,-43.5],[-72.0,-45.0],[-72.5,-46.5],[-74.0,-46.5],[-75.0,-45.5],[-74.5,-44.0],[-73.8,-43.0]]]},
  {codigo:'XII',nombre:'Magallanes',        coords:[[[-74.0,-46.5],[-72.5,-46.5],[-71.5,-48.0],[-71.0,-50.0],[-71.5,-52.0],[-72.5,-53.5],[-74.5,-53.2],[-75.5,-52.0],[-75.0,-50.0],[-75.5,-48.0],[-75.0,-47.0],[-74.0,-46.5]]]},
];

const COLORES_ESTADO: Record<string,string> = {};
const fmt = (n: number) => (n ?? 0).toLocaleString('es-CL');
const fmtPeso = (n: number) => '$' + (n ?? 0).toLocaleString('es-CL');
const COLORES = ['#3a9956','#60a5fa','#f59e0b','#f87171','#a78bfa','#34d399','#fb923c'];

// ── Componentes UI ─────────────────────────────────────────────────────────────
function Panel({children,style}:{children:React.ReactNode;style?:React.CSSProperties}){
  return <div style={{background:'#fff',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.07)',...style}}>{children}</div>;
}
function PanelHdr({title,sub,right}:{title:string;sub?:string;right?:React.ReactNode}){
  return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 20px',borderBottom:'1px solid rgba(0,0,0,.06)',background:'rgba(0,0,0,.02)'}}>
      <div>
        <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#1a2e22',textTransform:'uppercase',letterSpacing:'.09em',lineHeight:1}}>{title}</p>
        {sub&&<p style={{fontSize:'.64rem',color:'#6b8f75',marginTop:3,fontFamily:'monospace'}}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export default function ReporteRegiones() {
  const mapRef   = useRef<HTMLDivElement>(null);
  const mapInst  = useRef<any>(null);
  const geoLayer = useRef<any>(null);
  const selRef   = useRef<number|null>(null);

  const [dash,     setDash]     = useState<DashData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [detalle,  setDetalle]  = useState<DetalleRegion | null>(null);
  const [loadDet,  setLoadDet]  = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [paginaTab,setPaginaTab]= useState<'mapa'|'bienes'>('mapa');
  const [pagBienes,setPagBienes]= useState(1);
  const ITEMS = 15;

  // Cargar datos principales
  useEffect(() => {
    api.get('/api/reportes/regiones')
      .then(({ data }) => setDash(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Cargar detalle al seleccionar región
  const cargarDetalle = useCallback(async (regionId: number) => {
    setLoadDet(true);
    setDetalle(null);
    setPagBienes(1);
    try {
      const { data } = await api.get(`/api/reportes/regiones/${regionId}/detalle`);
      setDetalle(data);
    } catch {}
    setLoadDet(false);
  }, []);

  // Mapa
  useEffect(() => {
    if (!dash) return;
    let cancelled = false;
    (async () => {
      if (!mapRef.current || mapInst.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      const maxTotal = Math.max(...dash.porRegion.map(r => r.total), 1);

      // Mapear nombre → region_id
      const nombreToId: Record<string, number> = {};
      dash.porRegion.forEach(r => { nombreToId[r.nombre] = r.region_id; });

      const getFill = (nombre: string, isSel: boolean) => {
        if (isSel) return '#4cca84';
        const r = dash.porRegion.find(x => x.nombre === nombre);
        const pct = r ? r.total / maxTotal : 0;
        if (pct > .7)  return 'rgba(26,92,46,.75)';
        if (pct > .4)  return 'rgba(35,94,63,.68)';
        if (pct > .2)  return 'rgba(46,125,82,.60)';
        if (pct > .1)  return 'rgba(58,153,86,.52)';
        return pct > 0 ? 'rgba(76,202,132,.42)' : 'rgba(100,100,100,.25)';
      };

      const map = L.map(mapRef.current!, { center: [-38,-71], zoom: 4, zoomControl: false, attributionControl: false });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,opacity:.55}).addTo(map);
      L.control.zoom({position:'bottomright'}).addTo(map);

      const geojson = {
        type: 'FeatureCollection',
        features: GEOJSON_FEATURES.map(f => ({
          type: 'Feature',
          properties: { nombre: f.nombre },
          geometry: { type: 'Polygon', coordinates: f.coords }
        }))
      };

      const gl = L.geoJSON(geojson as any, {
        style: (f: any) => ({
          fillColor: getFill(f.properties.nombre, false),
          fillOpacity: 1, color: 'rgba(255,255,255,.65)', weight: 1.5
        }),
        onEachFeature: (f: any, layer: any) => {
          const nombre = f.properties.nombre;
          const r = dash.porRegion.find(x => x.nombre === nombre);
          layer.bindTooltip(r ? `
            <div style="font-family:'Barlow Condensed',sans-serif;min-width:150px">
              <div style="font-size:.58rem;color:#6b8f75;text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px">Región</div>
              <div style="font-size:1rem;font-weight:800;color:#1a2e22;margin-bottom:7px">${nombre}</div>
              <div style="display:flex;flex-direction:column;gap:3px">
                ${[['Total',fmt(r.total),'#1a2e22'],['Activas',fmt(r.activas),'#3b82f6'],['Nuevas','+'+r.nuevas,'#d4a832']].map(([l,v,c])=>`
                  <div style="display:flex;justify-content:space-between;gap:14px;font-family:monospace;font-size:.65rem">
                    <span style="color:#6b8f75">${l}</span><span style="font-weight:700;color:${c}">${v}</span>
                  </div>`).join('')}
              </div>
            </div>` : `<div style="font-family:monospace;font-size:.65rem;color:#6b8f75">${nombre}<br>Sin datos</div>`,
            {sticky:true,className:'sigpa-tooltip',offset:[12,0]});

          layer.on('mouseover', () => {
            if (selRef.current !== nombreToId[nombre]) layer.setStyle({fillColor:'rgba(76,202,132,.78)',color:'#fff',weight:2});
          });
          layer.on('mouseout', () => {
            if (selRef.current !== nombreToId[nombre]) layer.setStyle({fillColor:getFill(nombre,false),color:'rgba(255,255,255,.65)',weight:1.5});
          });
          layer.on('click', () => {
            const rid = nombreToId[nombre];
            if (!rid) return;
            gl.eachLayer((l:any) => {
              const n = l.feature?.properties?.nombre;
              l.setStyle({fillColor:getFill(n,false),color:'rgba(255,255,255,.65)',weight:1.5});
            });
            layer.setStyle({fillColor:'#4cca84',color:'#fff',weight:2.5});
            selRef.current = rid;
            setSelected(rid);
            cargarDetalle(rid);
          });
        }
      }).addTo(map);

      geoLayer.current = gl;
      mapInst.current  = map;
    })();
    return () => { cancelled = true; mapInst.current?.remove(); mapInst.current = null; };
  }, [dash]);

  if (loading || !dash) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300,gap:12,fontFamily:'monospace',fontSize:'.7rem',color:'#9ab8a2'}}>
        <svg style={{width:20,height:20,animation:'spin 1s linear infinite'}} fill="none" viewBox="0 0 24 24">
          <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Cargando reporte...
      </div>
    );
  }

  const sorted   = [...dash.porRegion].sort((a,b) => b.total - a.total);
  const maxTotal = Math.max(...sorted.map(r=>r.total), 1);
  const C = 251.33;

  // Donut por estado
  let offset = 0;
  const segmentos = dash.porEstado.map((e, i) => {
    const pct  = dash.grandTotal > 0 ? (e.total / dash.grandTotal) * 100 : 0;
    const dash_ = (C * pct) / 100;
    const seg  = { ...e, pct: Math.round(pct), dash: dash_, offset, color: COLORES[i % COLORES.length] };
    offset += dash_;
    return seg;
  });

  // Bienes del detalle paginados
  const props       = detalle?.propiedades ?? [];
  const totalPags   = Math.ceil(props.length / ITEMS);
  const propsPag    = props.slice((pagBienes-1)*ITEMS, pagBienes*ITEMS);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <style>{`
        .sigpa-tooltip{background:#fff!important;border:1px solid rgba(0,0,0,.1)!important;border-radius:10px!important;box-shadow:0 4px 20px rgba(0,0,0,.15)!important;padding:11px 14px!important;}
        .sigpa-tooltip::before,.leaflet-tooltip-left::before,.leaflet-tooltip-right::before{display:none!important;border:none!important;}
        .hbar{height:7px;background:rgba(0,0,0,.07);border-radius:999px;overflow:hidden;}
        .hbar-fill{height:100%;border-radius:999px;}
        .trow{border-bottom:1px solid rgba(0,0,0,.06);transition:background .12s;}
        .trow:hover{background:#f5faf6;}
        .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px;cursor:pointer;font-family:monospace;font-size:.65rem;font-weight:500;color:#3d5c47;background:#eaf3ec;border:1px solid rgba(0,0,0,.1);transition:background .18s;}
        .btn-ghost:hover{background:#d9ece0;}
      `}</style>

      <div style={{fontFamily:'"Barlow",sans-serif',color:'#1a2e22'}}>

        {/* HEADER */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20,padding:'0 4px'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:8,padding:'3px 10px 3px 8px',borderRadius:999,background:'rgba(58,153,86,.1)',border:'1px solid rgba(58,153,86,.25)'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'#3a9956',flexShrink:0}}/>
              <span style={{fontFamily:'monospace',fontSize:'.58rem',fontWeight:500,color:'#2e7d46',letterSpacing:'.12em',textTransform:'uppercase'}}>Reportes</span>
            </div>
            <h2 style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'2.2rem',fontWeight:800,color:'#1a2e22',textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1,marginBottom:6}}>Reporte por Región</h2>
            <p style={{fontSize:'.72rem',color:'#3d5c47',fontFamily:'monospace'}}>
              Distribución del parque inmobiliario — <span style={{color:'#2e7d46'}}>{new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</span>
            </p>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:'2px solid rgba(0,0,0,.08)'}}>
          {(['mapa','bienes'] as const).map(t=>(
            <button key={t} onClick={()=>setPaginaTab(t)} disabled={t==='bienes'&&!detalle}
              style={{padding:'10px 24px',border:'none',borderBottom:paginaTab===t?'2px solid #3aaf64':'2px solid transparent',marginBottom:'-2px',cursor:t==='bienes'&&!detalle?'not-allowed':'pointer',fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.88rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',background:'transparent',color:paginaTab===t?'#2e7d46':t==='bienes'&&!detalle?'#c8d8cc':'#9ab8a2',transition:'all .15s'}}>
              {t==='mapa'?'Mapa por Región':detalle?`Detalle — ${detalle.region}`:'Detalle Región'}
            </button>
          ))}
        </div>

        {/* ── TAB MAPA ── */}
        <div style={{display:paginaTab==='mapa'?'block':'none'}}>

          {/* STAT CARDS */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,marginBottom:18}}>
            {[
              {val:fmt(dash.grandTotal),   lbl:'Total Viviendas',     badge:`${sorted.length} regiones`, bc:'#3a9956', bbg:'rgba(58,153,86,.08)', al:'linear-gradient(90deg,#3a9956,#3aaf64)', ico:<svg style={{width:16,height:16,color:'#3a9956'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>},
              {val:fmt(dash.grandActivas), lbl:'Activas',             badge:`${dash.grandTotal>0?Math.round((dash.grandActivas/dash.grandTotal)*100):0}%`, bc:'#3b82f6', bbg:'rgba(96,165,250,.08)', al:'linear-gradient(90deg,#1d4ed8,#60a5fa)', ico:<svg style={{width:16,height:16,color:'#3b82f6'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>},
              {val:fmt(dash.grandNuevas),  lbl:'Ingresadas este mes', badge:'Último mes',  bc:'#d4a832', bbg:'rgba(212,168,50,.08)', al:'linear-gradient(90deg,#8a6a18,#d4a832)', ico:<svg style={{width:16,height:16,color:'#d4a832'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>},
              {val:String(sorted.length),  lbl:'Regiones con datos',  badge:`de 16`, bc:'#a78bfa', bbg:'rgba(167,139,250,.08)', al:'linear-gradient(90deg,#6d28d9,#a78bfa)', ico:<svg style={{width:16,height:16,color:'#a78bfa'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>},
            ].map((s,i)=>(
              <div key={i} style={{position:'relative',overflow:'hidden',borderRadius:12,padding:'18px 20px',background:'#fff',border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 2px 12px rgba(0,0,0,.07)'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,borderRadius:'12px 12px 0 0',background:s.al}}/>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{width:34,height:34,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:s.bbg}}>{s.ico}</div>
                  <span style={{fontFamily:'monospace',fontSize:'.6rem',fontWeight:600,color:s.bc,background:s.bbg,padding:'2px 8px',borderRadius:999}}>{s.badge}</span>
                </div>
                <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'2.2rem',fontWeight:800,color:'#1a2e22',lineHeight:1}}>{s.val}</p>
                <p style={{fontSize:'.68rem',color:'#6b8f75',textTransform:'uppercase',letterSpacing:'.1em',fontWeight:500,marginTop:4}}>{s.lbl}</p>
              </div>
            ))}
          </div>

          {/* MAPA + BARRAS + DONUT */}
          <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:14,marginBottom:18,alignItems:'start'}}>

            {/* MAPA */}
            <div style={{background:'#0a1a10',border:'1px solid rgba(58,153,86,.2)',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.18)',position:'relative'}}>
              <div style={{padding:'10px 14px',background:'rgba(0,0,0,.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'absolute',top:0,left:0,right:0,zIndex:1000}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:3,height:12,borderRadius:2,background:'linear-gradient(180deg,#4cca84,#3a9956)'}}/>
                  <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.75rem',fontWeight:700,color:'#4cca84',textTransform:'uppercase',letterSpacing:'.1em'}}>Mapa Satelital</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontFamily:'monospace',fontSize:'.52rem',color:'rgba(255,255,255,.35)'}}>Bajo</span>
                  {['rgba(76,202,132,.42)','rgba(58,153,86,.52)','rgba(46,125,82,.60)','rgba(35,94,63,.68)','rgba(26,92,46,.75)'].map((c,i)=>(
                    <div key={i} style={{width:12,height:7,background:c,borderRadius:2}}/>
                  ))}
                  <span style={{fontFamily:'monospace',fontSize:'.52rem',color:'rgba(255,255,255,.35)'}}>Alto</span>
                </div>
              </div>
              <div ref={mapRef} style={{width:'100%',height:680}}/>
              {!selected&&(
                <div style={{position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',zIndex:1000,background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.1)',borderRadius:20,padding:'7px 14px',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap'}}>
                  <span style={{fontSize:'.85rem'}}>👆</span>
                  <span style={{fontFamily:'monospace',fontSize:'.6rem',color:'rgba(255,255,255,.65)'}}>Haz clic en una región para ver el detalle</span>
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>

              {/* Panel detalle región seleccionada */}
              {loadDet && (
                <div style={{background:'linear-gradient(135deg,#0d2318,#1a3d2b)',borderRadius:12,padding:'24px 20px',display:'flex',alignItems:'center',justifyContent:'center',gap:10,color:'#4cca84',fontFamily:'monospace',fontSize:'.7rem'}}>
                  <svg style={{width:18,height:18,animation:'spin 1s linear infinite'}} fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando detalle...
                </div>
              )}

              {detalle && !loadDet && (
                <div style={{background:'linear-gradient(135deg,#0d2318,#1a3d2b)',borderRadius:12,padding:'18px 20px',boxShadow:'0 4px 20px rgba(13,35,24,.3)',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-20,right:-20,width:110,height:110,borderRadius:'50%',background:'rgba(76,202,132,.07)',border:'1px solid rgba(76,202,132,.12)'}}/>
                  <div style={{position:'relative'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                      <div>
                        <div style={{fontFamily:'monospace',fontSize:'.56rem',color:'rgba(76,202,132,.65)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Región seleccionada</div>
                        <h3 style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.5rem',fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'.05em',lineHeight:1,marginBottom:4}}>{detalle.region}</h3>
                        <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'rgba(255,255,255,.4)'}}>Avalúo total: {fmtPeso(detalle.avaluo_total)}</p>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'2.2rem',fontWeight:800,color:'#4cca84',lineHeight:1}}>{detalle.total}</div>
                        <div style={{fontFamily:'monospace',fontSize:'.54rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.1em'}}>bienes totales</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                      {[
                        {l:'Activas',v:detalle.porEstado['Activo']??0,c:'#4cca84'},
                        {l:'Nuevas',v:detalle.nuevas,c:'#fbbf24'},
                        {l:'Otros estados',v:detalle.total-(detalle.porEstado['Activo']??0),c:'#94a3b8'},
                      ].map(s=>(
                        <div key={s.l} style={{background:'rgba(255,255,255,.06)',borderRadius:8,padding:'8px 10px',border:'1px solid rgba(255,255,255,.07)'}}>
                          <div style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.25rem',fontWeight:800,color:s.c}}>{s.v}</div>
                          <div style={{fontFamily:'monospace',fontSize:'.5rem',color:'rgba(255,255,255,.38)',textTransform:'uppercase',letterSpacing:'.08em'}}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Por tipo */}
                    <div style={{background:'rgba(0,0,0,.2)',borderRadius:8,padding:'10px 12px'}}>
                      <p style={{fontFamily:'monospace',fontSize:'.55rem',color:'rgba(76,202,132,.6)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:8}}>Por tipo</p>
                      <div style={{display:'flex',flexDirection:'column',gap:5}}>
                        {Object.entries(detalle.porTipo).slice(0,5).map(([tipo,count])=>(
                          <div key={tipo} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'rgba(255,255,255,.6)'}}>{tipo}</span>
                            <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.85rem',fontWeight:700,color:'#4cca84'}}>{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={()=>setPaginaTab('bienes')} style={{marginTop:12,width:'100%',padding:'8px',borderRadius:8,border:'1px solid rgba(76,202,132,.3)',background:'rgba(76,202,132,.1)',color:'#4cca84',cursor:'pointer',fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em'}}>
                      Ver todas las propiedades →
                    </button>
                  </div>
                </div>
              )}

              {/* Barras por región */}
              <Panel>
                <PanelHdr title="Distribución por Región" sub="Total viviendas — clic para ver detalle"
                  right={<span style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2'}}>{fmt(dash.grandTotal)} total</span>}/>
                <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:8}}>
                  {sorted.map((r,i)=>{
                    const pct=Math.round((r.total/maxTotal)*100);
                    const isSel = selected === r.region_id;
                    return(
                      <div key={r.region_id} style={{display:'grid',alignItems:'center',gap:10,gridTemplateColumns:'130px 1fr 54px',cursor:'pointer'}}
                        onClick={()=>{ selRef.current=r.region_id; setSelected(r.region_id); cargarDetalle(r.region_id); }}>
                        <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                          <span style={{fontFamily:'monospace',fontSize:'.62rem',fontWeight:700,width:16,textAlign:'center',flexShrink:0,color:i<3?'#d4a832':'#9ab8a2'}}>{i+1}</span>
                          <span style={{fontSize:'.75rem',color:isSel?'#2e7d46':'#1a2e22',fontWeight:isSel?700:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.nombre}</span>
                        </div>
                        <div className="hbar">
                          <div className="hbar-fill" style={{width:`${pct}%`,background:i<3?'linear-gradient(90deg,#8a6a18,#d4a832)':'linear-gradient(90deg,#3a9956,#3aaf64)'}}/>
                        </div>
                        <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.88rem',fontWeight:700,color:'#1a2e22',textAlign:'right'}}>{fmt(r.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* Donut por estado */}
              <Panel>
                <PanelHdr title="Composición por Estado" sub="Estado del parque completo"/>
                <div style={{padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
                    <div style={{position:'relative',width:140,height:140}}>
                      <svg width="140" height="140" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="11"/>
                        {segmentos.map((seg,i)=>(
                          <circle key={i} cx="50" cy="50" r="40" fill="none"
                            stroke={seg.color} strokeWidth="11"
                            strokeDasharray={`${seg.dash} ${C-seg.dash}`}
                            strokeDashoffset={-seg.offset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"/>
                        ))}
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.4rem',fontWeight:800,color:'#1a2e22',lineHeight:1}}>{fmt(dash.grandTotal)}</span>
                        <span style={{fontSize:'.54rem',color:'#6b8f75',textTransform:'uppercase',letterSpacing:'.1em',fontFamily:'monospace'}}>Total</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:9}}>
                    {segmentos.map(seg=>(
                      <div key={seg.estado}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div style={{width:8,height:8,borderRadius:2,background:seg.color,flexShrink:0}}/>
                            <span style={{fontSize:'.72rem',color:'#3d5c47'}}>{seg.estado}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#1a2e22'}}>{fmt(seg.total)}</span>
                            <span style={{fontFamily:'monospace',fontSize:'.6rem',fontWeight:600,color:seg.color,minWidth:28,textAlign:'right'}}>{seg.pct}%</span>
                          </div>
                        </div>
                        <div style={{height:4,background:'rgba(0,0,0,.07)',borderRadius:999,overflow:'hidden'}}>
                          <div style={{width:`${seg.pct}%`,height:'100%',borderRadius:999,background:seg.color}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

            </div>
          </div>

          {/* TABLA RESUMEN */}
          <Panel>
            <PanelHdr title="Detalle por Región" sub="Clic en una fila para ver el detalle completo"/>
            <div style={{display:'grid',alignItems:'center',gap:12,padding:'8px 20px',gridTemplateColumns:'34px 1fr 90px 90px 80px 1fr',background:'rgba(0,0,0,.03)',borderBottom:'1px solid rgba(0,0,0,.07)'}}>
              {['#','Región','Total','Activas','Nuevas','Distribución'].map((h,i)=>(
                <span key={h} style={{fontFamily:'monospace',fontSize:'.56rem',fontWeight:600,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.14em',textAlign:i>1&&i<5?'right':'left' as any}}>{h}</span>
              ))}
            </div>
            <div style={{maxHeight:460,overflowY:'auto'}}>
              {sorted.map((r,i)=>{
                const pct=Math.round((r.total/maxTotal)*100);
                const isSel=selected===r.region_id;
                return(
                  <div key={r.region_id} className="trow"
                    onClick={()=>{ selRef.current=r.region_id; setSelected(r.region_id); cargarDetalle(r.region_id); }}
                    style={{display:'grid',alignItems:'center',gap:12,padding:'9px 20px',gridTemplateColumns:'34px 1fr 90px 90px 80px 1fr',cursor:'pointer',background:isSel?'rgba(58,153,86,.05)':'transparent',borderLeft:isSel?'3px solid #3aaf64':'3px solid transparent'}}>
                    <div style={{width:26,height:26,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:'.7rem',fontWeight:700,background:i<3?'rgba(212,168,50,.15)':'#eaf3ec',border:`1px solid ${i<3?'rgba(212,168,50,.3)':'rgba(0,0,0,.08)'}`,color:i<3?'#d4a832':'#9ab8a2'}}>{i+1}</div>
                    <div>
                      <p style={{fontSize:'.8rem',color:'#1a2e22',fontWeight:isSel?600:400,lineHeight:1.2}}>{r.nombre}</p>
                    </div>
                    <div style={{textAlign:'right'}}><span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.98rem',fontWeight:700,color:'#1a2e22'}}>{fmt(r.total)}</span></div>
                    <div style={{textAlign:'right'}}><span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:600,color:'#3b82f6'}}>{fmt(r.activas)}</span></div>
                    <div style={{textAlign:'right'}}><span style={{fontFamily:'monospace',fontSize:'.62rem',fontWeight:600,color:'#d4a832',background:'rgba(212,168,50,.1)',border:'1px solid rgba(212,168,50,.25)',padding:'2px 7px',borderRadius:999}}>+{r.nuevas}</span></div>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <div className="hbar" style={{flex:1}}><div className="hbar-fill" style={{width:`${pct}%`,background:i<3?'linear-gradient(90deg,#8a6a18,#d4a832)':'linear-gradient(90deg,#3a9956,#3aaf64)'}}/></div>
                      <span style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2',minWidth:26,textAlign:'right'}}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:'grid',alignItems:'center',gap:12,padding:'10px 20px',gridTemplateColumns:'34px 1fr 90px 90px 80px 1fr',background:'rgba(0,0,0,.03)',borderTop:'1px solid rgba(0,0,0,.07)'}}>
              <div/><span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.76rem',fontWeight:700,color:'#2e7d46',textTransform:'uppercase'}}>TOTAL NACIONAL</span>
              <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.98rem',fontWeight:800,color:'#1a2e22',textAlign:'right'}}>{fmt(dash.grandTotal)}</span>
              <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#3b82f6',textAlign:'right'}}>{fmt(dash.grandActivas)}</span>
              <span style={{fontFamily:'monospace',fontSize:'.72rem',fontWeight:700,color:'#d4a832',textAlign:'right'}}>+{fmt(dash.grandNuevas)}</span>
              <div className="hbar"><div className="hbar-fill" style={{width:'100%',background:'linear-gradient(90deg,#3a9956,#3aaf64)'}}/></div>
            </div>
          </Panel>
        </div>

        {/* ── TAB DETALLE BIENES ── */}
        <div style={{display:paginaTab==='bienes'?'block':'none'}}>
          {detalle && (
            <Panel>
              <PanelHdr
                title={`Propiedades — ${detalle.region}`}
                sub={`${detalle.total} propiedades · página ${pagBienes} de ${totalPags||1}`}
                right={<button onClick={()=>setPaginaTab('mapa')} className="btn-ghost">← Volver al mapa</button>}
              />
              <div style={{display:'grid',alignItems:'center',gap:10,padding:'8px 20px',gridTemplateColumns:'100px 1fr 120px 110px 90px 120px 60px',background:'rgba(0,0,0,.03)',borderBottom:'1px solid rgba(0,0,0,.07)'}}>
                {['Carpeta','Conjunto / Dirección','Comuna','Tipo','Estado','Avalúo Total',''].map((h,i)=>(
                  <span key={i} style={{fontFamily:'monospace',fontSize:'.55rem',fontWeight:600,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.12em',textAlign:(i===5?'right':'left') as any}}>{h}</span>
                ))}
              </div>
              {propsPag.length === 0 ? (
                <p style={{padding:'40px',textAlign:'center',fontFamily:'monospace',fontSize:'.7rem',color:'#9ab8a2'}}>Sin propiedades</p>
              ) : propsPag.map(p=>(
                <div key={p.id} className="trow" style={{display:'grid',alignItems:'center',gap:10,padding:'10px 20px',gridTemplateColumns:'100px 1fr 120px 110px 90px 120px 60px'}}>
                  <span style={{fontFamily:'monospace',fontSize:'.65rem',fontWeight:700,color:'#3a9956'}}>{p.carpeta}</span>
                  <div style={{minWidth:0}}>
                    <p style={{fontSize:'.78rem',fontWeight:600,color:'#1a2e22',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.nombre_conjunto || p.direccion || '—'}</p>
                    <p style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.direccion || `Rol: ${p.rol_avaluo}`}</p>
                  </div>
                  <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#6b8f75',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.comuna}</span>
                  <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#6b8f75'}}>{p.tipo}</span>
                  <span style={{padding:'3px 8px',borderRadius:6,fontFamily:'monospace',fontSize:'.56rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap',display:'inline-block',background:'rgba(58,153,86,.1)',color:'#2e7d46'}}>{p.estado}</span>
                  <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#d4a832',textAlign:'right',display:'block'}}>{fmtPeso(p.avaluo_fiscal_total)}</span>
                  <div style={{display:'flex',justifyContent:'center'}}>
                    <button type="button" title="Ver detalle"
                      onClick={()=>window.open(`/bienes/${p.uuid}`,'_blank')}
                      style={{width:28,height:28,borderRadius:6,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(58,153,86,.1)',color:'#2e7d46',transition:'background .15s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(58,153,86,.25)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='rgba(58,153,86,.1)')}>
                      <svg style={{width:13,height:13}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {totalPags > 1 && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderTop:'1px solid rgba(0,0,0,.06)',background:'rgba(0,0,0,.02)'}}>
                  <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#9ab8a2'}}>Mostrando {(pagBienes-1)*ITEMS+1}–{Math.min(pagBienes*ITEMS,props.length)} de {props.length}</span>
                  <div style={{display:'flex',gap:4}}>
                    <button onClick={()=>setPagBienes(p=>Math.max(1,p-1))} disabled={pagBienes===1}
                      style={{width:30,height:30,borderRadius:7,border:'1px solid rgba(0,0,0,.1)',background:'#fff',cursor:pagBienes===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:pagBienes===1?'#c0d8c8':'#3d5c47'}}>
                      <svg style={{width:12,height:12}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    {Array.from({length:Math.min(totalPags,5)},(_,i)=>{
                      let p=i+1;
                      if(totalPags>5){ if(pagBienes<=3) p=i+1; else if(pagBienes>=totalPags-2) p=totalPags-4+i; else p=pagBienes-2+i; }
                      return <button key={p} onClick={()=>setPagBienes(p)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${pagBienes===p?'rgba(58,153,86,.4)':'rgba(0,0,0,.1)'}`,background:pagBienes===p?'rgba(58,153,86,.1)':'#fff',cursor:'pointer',fontFamily:'monospace',fontSize:'.68rem',fontWeight:pagBienes===p?700:400,color:pagBienes===p?'#2e7d46':'#6b8f75'}}>{p}</button>;
                    })}
                    <button onClick={()=>setPagBienes(p=>Math.min(totalPags,p+1))} disabled={pagBienes===totalPags}
                      style={{width:30,height:30,borderRadius:7,border:'1px solid rgba(0,0,0,.1)',background:'#fff',cursor:pagBienes===totalPags?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:pagBienes===totalPags?'#c0d8c8':'#3d5c47'}}>
                      <svg style={{width:12,height:12}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>

      </div>
    </>
  );
}