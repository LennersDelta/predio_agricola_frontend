'use client';

import { useState, useMemo } from 'react';

// ─────────────────────────────────────────────
// DATOS comunas por región
// ─────────────────────────────────────────────
type Bien = { id:string; nombre:string; direccion:string; tipo:string; estado:string; avaluo:number };
type Comuna = {
  nombre:string; provincia:string;
  total:number; activas:number; mantencion:number; nuevas:number; inactivas:number;
  avaluo:number;
  tipos:{ label:string; valor:number; color:string }[];
  bienes:Bien[];
};

const COMUNAS_DATA: Record<string, Record<string, Comuna>> = {
  'RM': {
    'Santiago':     { nombre:'Santiago',     provincia:'Santiago',    total:187, activas:162, mantencion:12, nuevas:8,  inactivas:13, avaluo:18400, tipos:[{label:'Oficina',valor:88,color:'#9b6dea'},{label:'Departamento',valor:62,color:'#4ca8e0'},{label:'Casa',valor:37,color:'#3aaf64'}],          bienes:[{id:'SCL001',nombre:'Cuartel Central PDI',  direccion:'General Mackenna 1369',    tipo:'Institucional',estado:'Activo',    avaluo:12400},{id:'SCL005',nombre:'Oficina Centro',     direccion:'Agustinas 814',           tipo:'Oficina',       estado:'Activo',    avaluo:3200}] },
    'Providencia':  { nombre:'Providencia',  provincia:'Santiago',    total:134, activas:118, mantencion:9,  nuevas:6,  inactivas:7,  avaluo:16200, tipos:[{label:'Departamento',valor:68,color:'#4ca8e0'},{label:'Oficina',valor:44,color:'#9b6dea'},{label:'Casa',valor:22,color:'#3aaf64'}],          bienes:[{id:'SCL002',nombre:'Edificio Providencia', direccion:'Av. Providencia 1234',     tipo:'Oficina',       estado:'Activo',    avaluo:8800},{id:'SCL006',nombre:'Depto. Providencia', direccion:'Eliodoro Yáñez 990',      tipo:'Departamento',  estado:'En revisión',avaluo:4100}] },
    'Las Condes':   { nombre:'Las Condes',   provincia:'Santiago',    total:98,  activas:84,  mantencion:7,  nuevas:4,  inactivas:7,  avaluo:14800, tipos:[{label:'Departamento',valor:54,color:'#4ca8e0'},{label:'Oficina',valor:28,color:'#9b6dea'},{label:'Casa',valor:16,color:'#3aaf64'}],          bienes:[{id:'SCL004',nombre:'Dep. Las Condes',      direccion:'Av. Apoquindo 5400',       tipo:'Departamento',  estado:'En revisión',avaluo:3600}] },
    'Maipú':        { nombre:'Maipú',        provincia:'Santiago',    total:112, activas:94,  mantencion:8,  nuevas:5,  inactivas:10, avaluo:9200,  tipos:[{label:'Casa',valor:72,color:'#3aaf64'},{label:'Departamento',valor:28,color:'#4ca8e0'},{label:'Terreno',valor:12,color:'#d4a832'}],           bienes:[{id:'SCL003',nombre:'Casa Maipú',           direccion:'Av. Pajaritos 3090',       tipo:'Casa',          estado:'Activo',    avaluo:4200}] },
    'Pudahuel':     { nombre:'Pudahuel',     provincia:'Santiago',    total:74,  activas:62,  mantencion:5,  nuevas:3,  inactivas:7,  avaluo:7400,  tipos:[{label:'Casa',valor:48,color:'#3aaf64'},{label:'Bodega',valor:14,color:'#9b6dea'},{label:'Terreno',valor:12,color:'#d4a832'}],                 bienes:[{id:'PDH001',nombre:'Bodega Pudahuel',      direccion:'Av. Noviciado 1800',       tipo:'Bodega',        estado:'Activo',    avaluo:2800}] },
    'La Florida':   { nombre:'La Florida',   provincia:'Santiago',    total:89,  activas:75,  mantencion:6,  nuevas:4,  inactivas:8,  avaluo:8600,  tipos:[{label:'Casa',valor:58,color:'#3aaf64'},{label:'Departamento',valor:22,color:'#4ca8e0'},{label:'Terreno',valor:9,color:'#d4a832'}],             bienes:[{id:'LFL001',nombre:'Comisaría La Florida', direccion:'Av. Vicuña Mackenna 7180', tipo:'Institucional', estado:'Activo',    avaluo:3400}] },
    'Ñuñoa':        { nombre:'Ñuñoa',        provincia:'Santiago',    total:67,  activas:57,  mantencion:5,  nuevas:3,  inactivas:5,  avaluo:9800,  tipos:[{label:'Casa',valor:38,color:'#3aaf64'},{label:'Departamento',valor:20,color:'#4ca8e0'},{label:'Oficina',valor:9,color:'#9b6dea'}],             bienes:[{id:'NUN001',nombre:'Casa Ñuñoa',           direccion:'Jorge Washington 480',     tipo:'Casa',          estado:'Activo',    avaluo:3900}] },
    'Quilicura':    { nombre:'Quilicura',     provincia:'Santiago',    total:55,  activas:46,  mantencion:4,  nuevas:2,  inactivas:5,  avaluo:6200,  tipos:[{label:'Casa',valor:32,color:'#3aaf64'},{label:'Bodega',valor:14,color:'#9b6dea'},{label:'Terreno',valor:9,color:'#d4a832'}],                  bienes:[{id:'QLC001',nombre:'Predio Quilicura',     direccion:'Av. El Salto 4480',        tipo:'Terreno',       estado:'Activo',    avaluo:1900}] },
    'San Bernardo': { nombre:'San Bernardo', provincia:'Maipo',       total:61,  activas:51,  mantencion:5,  nuevas:3,  inactivas:5,  avaluo:5800,  tipos:[{label:'Casa',valor:38,color:'#3aaf64'},{label:'Terreno',valor:15,color:'#d4a832'},{label:'Otros',valor:8,color:'#f87171'}],                   bienes:[{id:'SNB001',nombre:'Cuartel San Bernardo', direccion:'Freire 298',               tipo:'Institucional', estado:'Activo',    avaluo:2100}] },
    'Puente Alto':  { nombre:'Puente Alto',  provincia:'Cordillera',  total:73,  activas:61,  mantencion:6,  nuevas:3,  inactivas:6,  avaluo:6900,  tipos:[{label:'Casa',valor:46,color:'#3aaf64'},{label:'Departamento',valor:18,color:'#4ca8e0'},{label:'Terreno',valor:9,color:'#d4a832'}],             bienes:[{id:'PTA001',nombre:'Comisaría Puente Alto',direccion:'Av. Concha y Toro 800',   tipo:'Institucional', estado:'Activo',    avaluo:2600}] },
  },
  'V': {
    'Valparaíso':   { nombre:'Valparaíso',   provincia:'Valparaíso',  total:142, activas:118, mantencion:11, nuevas:7,  inactivas:13, avaluo:12400, tipos:[{label:'Departamento',valor:64,color:'#4ca8e0'},{label:'Oficina',valor:42,color:'#9b6dea'},{label:'Casa',valor:36,color:'#3aaf64'}],          bienes:[{id:'VLP001',nombre:'Cuartel Valparaíso',  direccion:'Av. Pedro Montt 2002',     tipo:'Institucional', estado:'Activo',    avaluo:4200},{id:'VLP004',nombre:'Oficina Puerto',    direccion:'Prat 660',                tipo:'Oficina',       estado:'Activo',    avaluo:2100}] },
    'Viña del Mar': { nombre:'Viña del Mar', provincia:'Valparaíso',  total:128, activas:106, mantencion:10, nuevas:6,  inactivas:12, avaluo:14200, tipos:[{label:'Departamento',valor:72,color:'#4ca8e0'},{label:'Casa',valor:38,color:'#3aaf64'},{label:'Oficina',valor:18,color:'#9b6dea'}],          bienes:[{id:'VLP002',nombre:'Edificio Viña',        direccion:'Av. Libertad 1245',        tipo:'Departamento',  estado:'Activo',    avaluo:1800}] },
    'Quilpué':      { nombre:'Quilpué',      provincia:'Marga Marga', total:78,  activas:64,  mantencion:6,  nuevas:3,  inactivas:7,  avaluo:7200,  tipos:[{label:'Casa',valor:48,color:'#3aaf64'},{label:'Terreno',valor:20,color:'#d4a832'},{label:'Departamento',valor:10,color:'#4ca8e0'}],           bienes:[{id:'VLP003',nombre:'Predio Quilpué',       direccion:'Av. Carlos Condell 890',   tipo:'Terreno',       estado:'En revisión',avaluo:650}] },
    'San Antonio':  { nombre:'San Antonio',  provincia:'San Antonio', total:56,  activas:46,  mantencion:4,  nuevas:2,  inactivas:6,  avaluo:5400,  tipos:[{label:'Casa',valor:34,color:'#3aaf64'},{label:'Bodega',valor:14,color:'#9b6dea'},{label:'Terreno',valor:8,color:'#d4a832'}],                  bienes:[{id:'SAN001',nombre:'Cuartel San Antonio',  direccion:'Barros Luco 180',          tipo:'Institucional', estado:'Activo',    avaluo:1900}] },
    'Los Andes':    { nombre:'Los Andes',    provincia:'Los Andes',   total:48,  activas:40,  mantencion:3,  nuevas:2,  inactivas:5,  avaluo:4800,  tipos:[{label:'Casa',valor:30,color:'#3aaf64'},{label:'Terreno',valor:12,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'LAN001',nombre:'Comisaría Los Andes',  direccion:'Esmeralda 464',            tipo:'Institucional', estado:'Activo',    avaluo:1600}] },
    'Concón':       { nombre:'Concón',       provincia:'Valparaíso',  total:35,  activas:29,  mantencion:2,  nuevas:1,  inactivas:4,  avaluo:5200,  tipos:[{label:'Casa',valor:20,color:'#3aaf64'},{label:'Departamento',valor:10,color:'#4ca8e0'},{label:'Terreno',valor:5,color:'#d4a832'}],             bienes:[{id:'CON001',nombre:'Predio Concón',        direccion:'Av. Borgoño 1200',         tipo:'Terreno',       estado:'Activo',    avaluo:1400}] },
  },
  'VIII': {
    'Concepción':   { nombre:'Concepción',   provincia:'Concepción',  total:138, activas:116, mantencion:10, nuevas:7,  inactivas:12, avaluo:11400, tipos:[{label:'Departamento',valor:60,color:'#4ca8e0'},{label:'Oficina',valor:44,color:'#9b6dea'},{label:'Casa',valor:34,color:'#3aaf64'}],          bienes:[{id:'CCP001',nombre:'Cuartel Concepción',  direccion:'San Martín 850',           tipo:'Institucional', estado:'Activo',    avaluo:3800},{id:'CCP003',nombre:'Edificio Bio',      direccion:'Caupolicán 480',           tipo:'Oficina',       estado:'Activo',    avaluo:1400}] },
    'Talcahuano':   { nombre:'Talcahuano',   provincia:'Concepción',  total:86,  activas:72,  mantencion:7,  nuevas:4,  inactivas:7,  avaluo:7800,  tipos:[{label:'Casa',valor:50,color:'#3aaf64'},{label:'Bodega',valor:22,color:'#9b6dea'},{label:'Terreno',valor:14,color:'#d4a832'}],                 bienes:[{id:'TLC001',nombre:'Cuartel Talcahuano',  direccion:'Colón 660',                tipo:'Institucional', estado:'Activo',    avaluo:2400}] },
    'Chillán':      { nombre:'Chillán',      provincia:'Ñuble',       total:74,  activas:62,  mantencion:5,  nuevas:3,  inactivas:7,  avaluo:6200,  tipos:[{label:'Casa',valor:44,color:'#3aaf64'},{label:'Terreno',valor:20,color:'#d4a832'},{label:'Otros',valor:10,color:'#f87171'}],                  bienes:[{id:'CHL001',nombre:'Comisaría Chillán',   direccion:'Arauco 655',               tipo:'Institucional', estado:'Activo',    avaluo:980}] },
    'Los Ángeles':  { nombre:'Los Ángeles',  provincia:'Biobío',      total:68,  activas:57,  mantencion:5,  nuevas:3,  inactivas:6,  avaluo:5600,  tipos:[{label:'Casa',valor:40,color:'#3aaf64'},{label:'Terreno',valor:18,color:'#d4a832'},{label:'Oficina',valor:10,color:'#9b6dea'}],                bienes:[{id:'LAG001',nombre:'Cuartel Los Ángeles', direccion:'Av. Ricardo Vicuña 340',   tipo:'Institucional', estado:'Activo',    avaluo:1800}] },
    'Coronel':      { nombre:'Coronel',      provincia:'Concepción',  total:55,  activas:46,  mantencion:4,  nuevas:2,  inactivas:5,  avaluo:4600,  tipos:[{label:'Casa',valor:34,color:'#3aaf64'},{label:'Bodega',valor:12,color:'#9b6dea'},{label:'Terreno',valor:9,color:'#d4a832'}],                  bienes:[{id:'COR001',nombre:'Comisaría Coronel',   direccion:'Janequeo 1450',            tipo:'Institucional', estado:'Activo',    avaluo:1400}] },
  },
  'IX': {
    'Temuco':       { nombre:'Temuco',       provincia:'Cautín',      total:128, activas:107, mantencion:9,  nuevas:6,  inactivas:12, avaluo:9800,  tipos:[{label:'Casa',valor:60,color:'#3aaf64'},{label:'Departamento',valor:38,color:'#4ca8e0'},{label:'Oficina',valor:30,color:'#9b6dea'}],          bienes:[{id:'TMC001',nombre:'Cuartel Temuco',      direccion:'Av. Alemania 0865',        tipo:'Institucional', estado:'Activo',    avaluo:2400},{id:'TMC002',nombre:'Predio Sur',        direccion:'Ruta 5 Sur km 680',        tipo:'Terreno',       estado:'Activo',    avaluo:820}] },
    'Padre Las Casas':{ nombre:'Padre Las Casas',provincia:'Cautín',  total:62,  activas:52,  mantencion:4,  nuevas:3,  inactivas:6,  avaluo:4800,  tipos:[{label:'Casa',valor:40,color:'#3aaf64'},{label:'Terreno',valor:14,color:'#d4a832'},{label:'Otros',valor:8,color:'#f87171'}],                   bienes:[{id:'PLC001',nombre:'Comisaría Casas',     direccion:'Av. Carrera Pinto 120',    tipo:'Institucional', estado:'Activo',    avaluo:1200}] },
    'Villarrica':   { nombre:'Villarrica',   provincia:'Cautín',      total:48,  activas:40,  mantencion:3,  nuevas:2,  inactivas:5,  avaluo:4200,  tipos:[{label:'Casa',valor:28,color:'#3aaf64'},{label:'Terreno',valor:14,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'VRC001',nombre:'Comisaría Villarrica', direccion:'Valentin Letelier 560',    tipo:'Institucional', estado:'Activo',    avaluo:980}] },
    'Angol':        { nombre:'Angol',        provincia:'Malleco',     total:42,  activas:35,  mantencion:3,  nuevas:2,  inactivas:4,  avaluo:3600,  tipos:[{label:'Casa',valor:26,color:'#3aaf64'},{label:'Terreno',valor:10,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'ANG001',nombre:'Cuartel Angol',       direccion:'Dieciocho 228',            tipo:'Institucional', estado:'Activo',    avaluo:880}] },
    'Pucón':        { nombre:'Pucón',        provincia:'Cautín',      total:36,  activas:30,  mantencion:2,  nuevas:2,  inactivas:4,  avaluo:5800,  tipos:[{label:'Casa',valor:18,color:'#3aaf64'},{label:'Terreno',valor:12,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'PUC001',nombre:'Comisaría Pucón',     direccion:'Camino Caburgua km 2',     tipo:'Institucional', estado:'Activo',    avaluo:1200}] },
    'Victoria':     { nombre:'Victoria',     provincia:'Malleco',     total:40,  activas:34,  mantencion:3,  nuevas:1,  inactivas:3,  avaluo:2800,  tipos:[{label:'Casa',valor:24,color:'#3aaf64'},{label:'Terreno',valor:10,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'VIC001',nombre:'Cuartel Victoria',    direccion:'Arturo Prat 880',          tipo:'Institucional', estado:'Activo',    avaluo:720}] },
  },
  'II': {
    'Antofagasta':  { nombre:'Antofagasta',  provincia:'Antofagasta', total:142, activas:119, mantencion:10, nuevas:7,  inactivas:13, avaluo:5800,  tipos:[{label:'Casa',valor:68,color:'#3aaf64'},{label:'Departamento',valor:44,color:'#4ca8e0'},{label:'Oficina',valor:30,color:'#9b6dea'}],          bienes:[{id:'ANT001',nombre:'Cuartel Central',     direccion:'Latorre 2890',             tipo:'Institucional', estado:'Activo',    avaluo:1800},{id:'ANT003',nombre:'Oficina Norte',     direccion:'Av. Argentina 1800',       tipo:'Oficina',       estado:'Activo',    avaluo:920}] },
    'Calama':       { nombre:'Calama',       provincia:'El Loa',      total:88,  activas:74,  mantencion:6,  nuevas:4,  inactivas:8,  avaluo:4200,  tipos:[{label:'Casa',valor:54,color:'#3aaf64'},{label:'Terreno',valor:22,color:'#d4a832'},{label:'Bodega',valor:12,color:'#9b6dea'}],                 bienes:[{id:'ANT002',nombre:'Predio Calama',       direccion:'Av. Grecia 1450',          tipo:'Terreno',       estado:'Activo',    avaluo:620}] },
    'Tocopilla':    { nombre:'Tocopilla',    provincia:'Tocopilla',   total:46,  activas:38,  mantencion:3,  nuevas:2,  inactivas:5,  avaluo:2400,  tipos:[{label:'Casa',valor:28,color:'#3aaf64'},{label:'Terreno',valor:12,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'TCP001',nombre:'Comisaría Tocopilla',  direccion:'21 de Mayo 1440',          tipo:'Institucional', estado:'Activo',    avaluo:680}] },
  },
  'IV': {
    'La Serena':    { nombre:'La Serena',    provincia:'Elqui',       total:118, activas:99,  mantencion:9,  nuevas:5,  inactivas:10, avaluo:7200,  tipos:[{label:'Casa',valor:58,color:'#3aaf64'},{label:'Departamento',valor:36,color:'#4ca8e0'},{label:'Oficina',valor:24,color:'#9b6dea'}],          bienes:[{id:'LSR001',nombre:'Cuartel La Serena',   direccion:'Av. Francisco de Aguirre 441',tipo:'Institucional',estado:'Activo', avaluo:2100}] },
    'Coquimbo':     { nombre:'Coquimbo',     provincia:'Elqui',       total:94,  activas:78,  mantencion:7,  nuevas:4,  inactivas:9,  avaluo:6400,  tipos:[{label:'Casa',valor:48,color:'#3aaf64'},{label:'Departamento',valor:30,color:'#4ca8e0'},{label:'Terreno',valor:16,color:'#d4a832'}],           bienes:[{id:'COQ001',nombre:'Comisaría Coquimbo',  direccion:'Aldunate 1250',            tipo:'Institucional', estado:'Activo',    avaluo:1600}] },
    'Ovalle':       { nombre:'Ovalle',       provincia:'Limarí',      total:58,  activas:48,  mantencion:4,  nuevas:3,  inactivas:6,  avaluo:3800,  tipos:[{label:'Casa',valor:36,color:'#3aaf64'},{label:'Terreno',valor:14,color:'#d4a832'},{label:'Otros',valor:8,color:'#f87171'}],                   bienes:[{id:'LSR002',nombre:'Predio Ovalle',       direccion:'Ruta 43 km 12',            tipo:'Terreno',       estado:'Activo',    avaluo:480}] },
    'Illapel':      { nombre:'Illapel',      provincia:'Choapa',      total:42,  activas:35,  mantencion:3,  nuevas:2,  inactivas:4,  avaluo:2800,  tipos:[{label:'Casa',valor:26,color:'#3aaf64'},{label:'Terreno',valor:10,color:'#d4a832'},{label:'Otros',valor:6,color:'#f87171'}],                   bienes:[{id:'ILL001',nombre:'Comisaría Illapel',   direccion:'Constitución 540',         tipo:'Institucional', estado:'Activo',    avaluo:760}] },
  },
};

const REGIONES_LISTA = [
  { codigo:'RM',   nombre:'Metropolitana de Santiago' },
  { codigo:'V',    nombre:'Valparaíso' },
  { codigo:'VIII', nombre:'Biobío' },
  { codigo:'IX',   nombre:'La Araucanía' },
  { codigo:'II',   nombre:'Antofagasta' },
  { codigo:'IV',   nombre:'Coquimbo' },
];

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function fmt(n:number){ return n.toLocaleString('es-CL'); }

const estadoColor:Record<string,string> = {
  'Activo':'rgba(58,175,100,.15)', 'Inactivo':'rgba(239,68,68,.12)',
  'En revisión':'rgba(245,158,11,.15)', 'En mantención':'rgba(100,116,139,.15)',
};
const estadoText:Record<string,string> = {
  'Activo':'#2e7d46','Inactivo':'#dc2626','En revisión':'#b45309','En mantención':'#475569',
};

// ─────────────────────────────────────────────
// COMPONENTES UI
// ─────────────────────────────────────────────
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

// Mini donut SVG
function Donut({ activas, mantencion, inactivas, size=56 }:{ activas:number; mantencion:number; inactivas:number; size?:number }){
  const total = activas + mantencion + inactivas;
  if(!total) return null;
  const r = 20; const cx = size/2; const cy = size/2;
  const circ = 2 * Math.PI * r;
  const segs = [
    { val: activas,   color:'#3aaf64' },
    { val: mantencion,color:'#f87171' },
    { val: inactivas, color:'#94a3b8' },
  ];
  let offset = 0;
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      {segs.map((s,i)=>{
        const dash = (s.val/total)*circ;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={9} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} strokeLinecap="butt"/>;
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// Barra horizontal
function HBar({ pct, color='#3aaf64', height=6 }:{ pct:number; color?:string; height?:number }){
  return (
    <div style={{height,background:'rgba(0,0,0,.07)',borderRadius:999,overflow:'hidden',width:'100%'}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:999,transition:'width .9s cubic-bezier(.4,0,.2,1)'}}/>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
const ITEMS_POR_PAG = 12;

export default function ReporteComunas(){
  const [regionSel, setRegionSel]   = useState('RM');
  const [comunaSel, setComunaSel]   = useState<string|null>('Santiago');
  const [tab, setTab]               = useState<'resumen'|'bienes'>('resumen');
  const [paginaTab, setPaginaTab]   = useState<'ranking'|'bienes'>('ranking');

  // Filtros tab bienes
  const [busqueda, setBusqueda]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [pagBienes, setPagBienes]   = useState(1);

  const comunasRegion = useMemo(() => {
    const c = COMUNAS_DATA[regionSel] ?? {};
    return Object.values(c).sort((a,b) => b.total - a.total);
  }, [regionSel]);

  const comunaData = comunaSel && COMUNAS_DATA[regionSel]?.[comunaSel]
    ? COMUNAS_DATA[regionSel][comunaSel]
    : null;

  const maxTotal = comunasRegion[0]?.total ?? 1;

  // Totales región
  const totReg = useMemo(() => communasRegion => ({
    total:     communasRegion.reduce((s:number,c:Comuna) => s+c.total,0),
    activas:   communasRegion.reduce((s:number,c:Comuna) => s+c.activas,0),
    mantencion:communasRegion.reduce((s:number,c:Comuna) => s+c.mantencion,0),
    nuevas:    communasRegion.reduce((s:number,c:Comuna) => s+c.nuevas,0),
    avaluo:    communasRegion.reduce((s:number,c:Comuna) => s+c.avaluo,0),
  }), [])(comunasRegion);

  // Todos los bienes de la región
  const todosBienes = useMemo(() =>
    comunasRegion.flatMap(c => c.bienes.map(b => ({ ...b, comuna: c.nombre, provincia: c.provincia }))),
    [comunasRegion]
  );

  const tiposUnicos   = [...new Set(todosBienes.map(b=>b.tipo))].sort();
  const estadosUnicos = [...new Set(todosBienes.map(b=>b.estado))].sort();

  const bienesFiltrados = useMemo(() =>
    todosBienes.filter(b => {
      const q = busqueda.toLowerCase();
      return (!q || b.id.toLowerCase().includes(q) || b.nombre.toLowerCase().includes(q) || b.direccion.toLowerCase().includes(q))
        && (!filtroEstado || b.estado === filtroEstado)
        && (!filtroTipo   || b.tipo   === filtroTipo);
    }), [todosBienes, busqueda, filtroEstado, filtroTipo]
  );

  const totalPags = Math.ceil(bienesFiltrados.length / ITEMS_POR_PAG);
  const bienesPag = bienesFiltrados.slice((pagBienes-1)*ITEMS_POR_PAG, pagBienes*ITEMS_POR_PAG);

  const selStyle: React.CSSProperties = {
    padding:'8px 28px 8px 11px', border:'1px solid rgba(0,0,0,.1)', borderRadius:8,
    fontFamily:'monospace', fontSize:'.7rem', color:'#1a2e22', background:'#fff',
    cursor:'pointer', outline:'none', appearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.3)' stroke-width='2.5'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C%2Fsvg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 9px center',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
        .trow{border-bottom:1px solid rgba(0,0,0,.06);transition:background .12s;}
        .trow:last-child{border-bottom:none;}
        .trow:hover{background:#f5faf6;}
        .com-row{display:grid;align-items:center;gap:10px;padding:9px 20px;cursor:pointer;border-bottom:1px solid rgba(0,0,0,.05);transition:background .12s;}
        .com-row:hover{background:#f5faf6;}
        .com-row:last-child{border-bottom:none;}
        .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px;cursor:pointer;font-family:monospace;font-size:.65rem;font-weight:500;color:#3d5c47;background:#eaf3ec;border:1px solid rgba(0,0,0,.1);text-decoration:none;transition:background .18s;}
        .btn-ghost:hover{background:#d9ece0;}
        .tab-btn{padding:8px 18px;border:none;border-bottom:2px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:"Barlow Condensed",sans-serif;font-size:.82rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;background:transparent;transition:all .15s;}
        .sigbi-tag{font-family:monospace;font-size:.56rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding:2px 7px;border-radius:5px;display:inline-block;white-space:nowrap;}
      `}</style>

      <div style={{fontFamily:'"Barlow",sans-serif',color:'#1a2e22'}}>

        {/* ── HEADER ── */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20,padding:'0 4px'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:8,padding:'3px 10px 3px 8px',borderRadius:999,background:'rgba(58,153,86,.1)',border:'1px solid rgba(58,153,86,.25)'}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:'#3a9956',flexShrink:0}}/>
              <span style={{fontFamily:'monospace',fontSize:'.58rem',fontWeight:500,color:'#2e7d46',letterSpacing:'.12em',textTransform:'uppercase'}}>Reportes</span>
            </div>
            <h2 style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'2.2rem',fontWeight:800,color:'#1a2e22',textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1,marginBottom:6}}>Reporte por Comuna</h2>
            <p style={{fontSize:'.72rem',color:'#3d5c47',fontFamily:'monospace'}}>Distribución comunal del parque inmobiliario — <span style={{color:'#2e7d46'}}>{new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</span></p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-ghost">
              <svg style={{width:12,height:12}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Imprimir
            </button>
            <button className="btn-ghost">
              <svg style={{width:12,height:12}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Exportar Excel
            </button>
          </div>
        </div>

        {/* ── SELECTOR REGIÓN ── */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,padding:'12px 16px',background:'#fff',border:'1px solid rgba(0,0,0,.08)',borderRadius:10,boxShadow:'0 1px 6px rgba(0,0,0,.05)'}}>
          <svg style={{width:16,height:16,color:'#3a9956',flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.82rem',fontWeight:700,color:'#3d5c47',textTransform:'uppercase',letterSpacing:'.1em',flexShrink:0}}>Región</span>
          <select value={regionSel} onChange={e=>{ setRegionSel(e.target.value); setComunaSel(null); setBusqueda(''); setFiltroEstado(''); setFiltroTipo(''); setPagBienes(1); }} style={{...selStyle,flex:1,maxWidth:340}}>
            {REGIONES_LISTA.map(r=><option key={r.codigo} value={r.codigo}>{r.codigo} — {r.nombre}</option>)}
          </select>
          <div style={{display:'flex',gap:16,marginLeft:'auto',flexWrap:'wrap'}}>
            {[
              {lbl:'Comunas',   val:comunasRegion.length, color:'#3a9956'},
              {lbl:'Total',     val:fmt(totReg.total),    color:'#1a2e22'},
              {lbl:'Activas',   val:fmt(totReg.activas),  color:'#3b82f6'},
              {lbl:'Mantención',val:fmt(totReg.mantencion),color:'#ef4444'},
            ].map(s=>(
              <div key={s.lbl} style={{textAlign:'center'}}>
                <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.1rem',fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</p>
                <p style={{fontFamily:'monospace',fontSize:'.55rem',color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em'}}>{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS PÁGINA ── */}
        <div style={{display:'flex',gap:0,marginBottom:18,borderBottom:'2px solid rgba(0,0,0,.08)'}}>
          {([['ranking','📊  Ranking Comunal'],['bienes','🏛️  Listado de Bienes']] as const).map(([t,lbl])=>(
            <button key={t} className="tab-btn"
              onClick={()=>setPaginaTab(t)}
              style={{borderBottomColor:paginaTab===t?'#3aaf64':'transparent',color:paginaTab===t?'#2e7d46':'#9ab8a2'}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            TAB: RANKING COMUNAL
        ══════════════════════════════════════ */}
        <div style={{display:paginaTab==='ranking'?'block':'none'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,alignItems:'start'}}>

            {/* ── COLUMNA IZQUIERDA: ranking + tabla ── */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>

              {/* Ranking barras */}
              <Panel>
                <PanelHdr title="Ranking Comunal" sub={`${comunasRegion.length} comunas · ${REGIONES_LISTA.find(r=>r.codigo===regionSel)?.nombre}`}
                  right={<span style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2'}}>Haz clic para ver detalle</span>}/>
                <div>
                  {comunasRegion.map((c,i)=>{
                    const pct   = Math.round((c.total/maxTotal)*100);
                    const pAct  = Math.round((c.activas/c.total)*100);
                    const isSel = comunaSel === c.nombre;
                    return(
                      <div key={c.nombre} className="com-row"
                        style={{gridTemplateColumns:'22px 1fr 72px 60px 60px 48px 120px',background:isSel?'rgba(58,175,100,.07)':undefined,borderLeft:isSel?'3px solid #3aaf64':'3px solid transparent'}}
                        onClick={()=>{ setComunaSel(c.nombre); setTab('resumen'); }}>
                        {/* # */}
                        <span style={{fontFamily:'monospace',fontSize:'.65rem',fontWeight:700,color:i<3?'#d4a832':'#c0d8c8'}}>{i+1}</span>
                        {/* Nombre */}
                        <div>
                          <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.8rem',fontWeight:600,color:isSel?'#2e7d46':'#1a2e22'}}>{c.nombre}</p>
                          <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'#9ab8a2'}}>{c.provincia}</p>
                        </div>
                        {/* Total */}
                        <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1rem',fontWeight:800,color:'#1a2e22',textAlign:'right'}}>{fmt(c.total)}</span>
                        {/* Activas */}
                        <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:600,color:'#3b82f6',textAlign:'right'}}>{fmt(c.activas)}</span>
                        {/* Mantención */}
                        <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:600,color:'#ef4444',textAlign:'right'}}>{fmt(c.mantencion)}</span>
                        {/* Nuevas */}
                        <span style={{fontFamily:'monospace',fontSize:'.6rem',fontWeight:600,color:'#d4a832',background:'rgba(212,168,50,.1)',border:'1px solid rgba(212,168,50,.25)',padding:'2px 6px',borderRadius:999,textAlign:'center'}}>+{c.nuevas}</span>
                        {/* Barra */}
                        <div style={{display:'flex',flexDirection:'column',gap:2}}>
                          <HBar pct={pct} color={i<3?'linear-gradient(90deg,#8a6a18,#d4a832)':'linear-gradient(90deg,#3a9956,#3aaf64)' as any}/>
                          <HBar pct={pAct} color="#3b82f6" height={3}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Cabecera */}
                <div style={{display:'grid',gap:10,padding:'7px 20px',gridTemplateColumns:'22px 1fr 72px 60px 60px 48px 120px',background:'rgba(0,0,0,.03)',borderTop:'1px solid rgba(0,0,0,.07)'}}>
                  {['#','COMUNA','TOTAL','ACTIVAS','MANT.','NUEVAS','DISTRIBUCIÓN'].map((h,i)=>(
                    <span key={h} style={{fontFamily:'monospace',fontSize:'.52rem',fontWeight:600,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em',textAlign:(i>=2&&i<=5?'right':'left') as any}}>{h}</span>
                  ))}
                </div>
              </Panel>

              {/* Tabla detalle resumen región */}
              <Panel>
                <PanelHdr title="Resumen Regional" sub="Totales por provincia"/>
                {/* Agrupar por provincia */}
                {Object.entries(
                  comunasRegion.reduce((acc, c) => {
                    if(!acc[c.provincia]) acc[c.provincia] = { total:0, activas:0, mantencion:0, nuevas:0, comunas:0 };
                    acc[c.provincia].total      += c.total;
                    acc[c.provincia].activas    += c.activas;
                    acc[c.provincia].mantencion += c.mantencion;
                    acc[c.provincia].nuevas     += c.nuevas;
                    acc[c.provincia].comunas    += 1;
                    return acc;
                  }, {} as Record<string,{total:number;activas:number;mantencion:number;nuevas:number;comunas:number}>)
                ).sort((a,b)=>b[1].total-a[1].total).map(([prov,d],i)=>{
                  const pAct  = Math.round((d.activas/d.total)*100);
                  const pMant = Math.round((d.mantencion/d.total)*100);
                  return (
                    <div key={prov} style={{display:'grid',alignItems:'center',gap:10,padding:'10px 20px',gridTemplateColumns:'1fr 70px 80px 80px 60px 48px',borderBottom:'1px solid rgba(0,0,0,.05)'}}>
                      <div>
                        <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.78rem',fontWeight:600,color:'#1a2e22'}}>{prov}</p>
                        <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'#9ab8a2'}}>{d.comunas} comunas</p>
                      </div>
                      <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.95rem',fontWeight:700,color:'#1a2e22',textAlign:'right'}}>{fmt(d.total)}</span>
                      <div style={{textAlign:'right'}}>
                        <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:600,color:'#3b82f6'}}>{fmt(d.activas)}</span>
                        <span style={{display:'block',fontFamily:'monospace',fontSize:'.55rem',color:'#93c5fd'}}>{pAct}%</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:600,color:'#ef4444'}}>{fmt(d.mantencion)}</span>
                        <span style={{display:'block',fontFamily:'monospace',fontSize:'.55rem',color:'#fca5a5'}}>{pMant}%</span>
                      </div>
                      <span style={{fontFamily:'monospace',fontSize:'.6rem',fontWeight:600,color:'#d4a832',background:'rgba(212,168,50,.1)',border:'1px solid rgba(212,168,50,.25)',padding:'2px 6px',borderRadius:999,textAlign:'center'}}>+{d.nuevas}</span>
                      <div><HBar pct={Math.round((d.total/totReg.total)*100)}/></div>
                    </div>
                  );
                })}
                <div style={{display:'grid',gap:10,padding:'9px 20px',gridTemplateColumns:'1fr 70px 80px 80px 60px 48px',background:'rgba(0,0,0,.03)',borderTop:'1px solid rgba(0,0,0,.07)'}}>
                  <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.76rem',fontWeight:700,color:'#2e7d46',textTransform:'uppercase'}}>TOTAL REGIÓN</span>
                  <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.95rem',fontWeight:800,color:'#1a2e22',textAlign:'right'}}>{fmt(totReg.total)}</span>
                  <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:700,color:'#3b82f6',textAlign:'right'}}>{fmt(totReg.activas)}</span>
                  <span style={{fontFamily:'monospace',fontSize:'.68rem',fontWeight:700,color:'#ef4444',textAlign:'right'}}>{fmt(totReg.mantencion)}</span>
                  <span style={{fontFamily:'monospace',fontSize:'.6rem',fontWeight:700,color:'#d4a832',textAlign:'center'}}>+{totReg.nuevas}</span>
                  <div><HBar pct={100}/></div>
                </div>
              </Panel>
            </div>

            {/* ── COLUMNA DERECHA: detalle comuna seleccionada ── */}
            <div style={{display:'flex',flexDirection:'column',gap:14,position:'sticky',top:16}}>
              {!comunaData ? (
                <Panel>
                  <div style={{padding:'40px 20px',textAlign:'center'}}>
                    <div style={{fontSize:'2.2rem',marginBottom:10}}>🏘️</div>
                    <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em'}}>Selecciona una comuna</p>
                    <p style={{fontFamily:'monospace',fontSize:'.65rem',color:'#c0d8c8',marginTop:4}}>Haz clic en cualquier fila del ranking</p>
                  </div>
                </Panel>
              ) : (
                <>
                  {/* Card principal */}
                  <Panel>
                    <div style={{padding:'16px 18px',background:'linear-gradient(135deg,#0D2218,#1A3D2B)',borderRadius:'12px 12px 0 0'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                        <div>
                          <p style={{fontFamily:'monospace',fontSize:'.55rem',color:'#4cca84',letterSpacing:'.14em',textTransform:'uppercase',marginBottom:3}}>COMUNA SELECCIONADA</p>
                          <h3 style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.5rem',fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'.06em',lineHeight:1}}>{comunaData.nombre}</h3>
                          <p style={{fontFamily:'monospace',fontSize:'.62rem',color:'#6b8f75',marginTop:4}}>Provincia {comunaData.provincia}</p>
                        </div>
                        <Donut activas={comunaData.activas} mantencion={comunaData.mantencion} inactivas={comunaData.inactivas}/>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        {[
                          {lbl:'Total',    val:fmt(comunaData.total),      col:'#fff'},
                          {lbl:'Activas',  val:fmt(comunaData.activas),    col:'#4ade80'},
                          {lbl:'Mantención',val:fmt(comunaData.mantencion),col:'#f87171'},
                          {lbl:'Nuevas',   val:'+'+comunaData.nuevas,      col:'#d4a832'},
                        ].map(s=>(
                          <div key={s.lbl} style={{padding:'8px 10px',background:'rgba(255,255,255,.06)',borderRadius:7,border:'1px solid rgba(255,255,255,.08)'}}>
                            <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.2rem',fontWeight:800,color:s.col,lineHeight:1}}>{s.val}</p>
                            <p style={{fontFamily:'monospace',fontSize:'.54rem',color:'#6b8f75',marginTop:2,textTransform:'uppercase',letterSpacing:'.1em'}}>{s.lbl}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabs interna */}
                    <div style={{display:'flex',borderBottom:'1px solid rgba(0,0,0,.07)'}}>
                      {(['resumen','bienes'] as const).map(t=>(
                        <button key={t} onClick={()=>setTab(t)}
                          style={{flex:1,padding:'9px',border:'none',borderBottom:`2px solid ${tab===t?'#3aaf64':'transparent'}`,marginBottom:'-1px',cursor:'pointer',fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',background:'transparent',color:tab===t?'#2e7d46':'#9ab8a2',transition:'all .15s'}}>
                          {t==='resumen'?'Resumen':'Bienes'}
                        </button>
                      ))}
                    </div>

                    {/* Tab resumen */}
                    {tab==='resumen' && (
                      <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
                        {/* Avalúo */}
                        <div style={{padding:'10px 12px',background:'rgba(212,168,50,.06)',border:'1px solid rgba(212,168,50,.2)',borderRadius:8}}>
                          <p style={{fontFamily:'monospace',fontSize:'.55rem',color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:3}}>Avalúo Fiscal Total</p>
                          <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'1.3rem',fontWeight:800,color:'#d4a832'}}>
                            ${fmt(comunaData.avaluo * 1000)}
                          </p>
                        </div>
                        {/* Composición */}
                        <div>
                          <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Composición por tipo</p>
                          {comunaData.tipos.map(t=>{
                            const pct = Math.round((t.valor/comunaData.total)*100);
                            return(
                              <div key={t.label} style={{marginBottom:7}}>
                                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                  <span style={{fontFamily:'"Barlow",sans-serif',fontSize:'.72rem',color:'#3d5c47'}}>{t.label}</span>
                                  <span style={{fontFamily:'monospace',fontSize:'.65rem',color:'#6b8f75'}}>{fmt(t.valor)} <span style={{color:'#9ab8a2'}}>({pct}%)</span></span>
                                </div>
                                <HBar pct={pct} color={t.color} height={5}/>
                              </div>
                            );
                          })}
                        </div>
                        {/* % Activas barra grande */}
                        <div style={{padding:'10px 12px',background:'rgba(58,175,100,.06)',border:'1px solid rgba(58,175,100,.18)',borderRadius:8}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                            <span style={{fontFamily:'monospace',fontSize:'.6rem',color:'#6b8f75'}}>Tasa de actividad</span>
                            <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.95rem',fontWeight:700,color:'#3aaf64'}}>{Math.round((comunaData.activas/comunaData.total)*100)}%</span>
                          </div>
                          <HBar pct={Math.round((comunaData.activas/comunaData.total)*100)} color="linear-gradient(90deg,#3a9956,#3aaf64)" height={7}/>
                        </div>
                      </div>
                    )}

                    {/* Tab bienes de la comuna */}
                    {tab==='bienes' && (
                      <div>
                        {comunaData.bienes.length===0 ? (
                          <div style={{padding:'24px 16px',textAlign:'center'}}>
                            <p style={{fontFamily:'monospace',fontSize:'.68rem',color:'#9ab8a2'}}>Sin bienes registrados</p>
                          </div>
                        ) : comunaData.bienes.map(b=>(
                          <div key={b.id} className="trow" style={{padding:'10px 16px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                              <div style={{minWidth:0}}>
                                <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.78rem',fontWeight:600,color:'#1a2e22',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.nombre}</p>
                                <p style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.direccion}</p>
                                <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
                                  <span style={{fontFamily:'monospace',fontSize:'.58rem',fontWeight:600,color:'#3a9956'}}>{b.id}</span>
                                  <span style={{fontFamily:'monospace',fontSize:'.58rem',color:'#9ab8a2'}}>·</span>
                                  <span style={{fontFamily:'monospace',fontSize:'.58rem',color:'#6b8f75'}}>{b.tipo}</span>
                                </div>
                              </div>
                              <div style={{textAlign:'right',flexShrink:0}}>
                                <span className="sigbi-tag" style={{background:estadoColor[b.estado]||'rgba(0,0,0,.05)',color:estadoText[b.estado]||'#6b8f75'}}>{b.estado}</span>
                                <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.88rem',fontWeight:700,color:'#d4a832',marginTop:4}}>${fmt(b.avaluo*1000)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>

                  {/* Top 3 comunas */}
                  <Panel>
                    <PanelHdr title="Top 3 Comunas" sub="Por total de bienes"/>
                    {comunasRegion.slice(0,3).map((c,i)=>(
                      <div key={c.nombre} className="trow" style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',cursor:'pointer',background:comunaSel===c.nombre?'rgba(58,175,100,.05)':undefined}}
                        onClick={()=>{setComunaSel(c.nombre);setTab('resumen');}}>
                        <span style={{width:22,height:22,borderRadius:'50%',background:i===0?'#d4a832':i===1?'#94a3b8':'#cd7f32',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:'.65rem',fontWeight:700,color:'#fff',flexShrink:0}}>{i+1}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.78rem',fontWeight:600,color:'#1a2e22',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.nombre}</p>
                          <HBar pct={Math.round((c.total/maxTotal)*100)} height={4}/>
                        </div>
                        <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.95rem',fontWeight:700,color:'#1a2e22',flexShrink:0}}>{fmt(c.total)}</span>
                      </div>
                    ))}
                  </Panel>
                </>
              )}
            </div>
          </div>
        </div>{/* fin tab ranking */}

        {/* ══════════════════════════════════════
            TAB: LISTADO DE BIENES
        ══════════════════════════════════════ */}
        <div style={{display:paginaTab==='bienes'?'block':'none'}}>

          {/* Filtros */}
          <div style={{background:'#fff',border:'1px solid rgba(0,0,0,.08)',borderRadius:12,padding:'14px 18px',marginBottom:14,boxShadow:'0 2px 8px rgba(0,0,0,.05)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <div style={{position:'relative',flex:'1',minWidth:200}}>
                <svg style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:'#9ab8a2',pointerEvents:'none'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
                <input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPagBienes(1);}} placeholder="Buscar por ID, nombre o dirección..."
                  style={{width:'100%',padding:'8px 12px 8px 30px',border:'1px solid rgba(0,0,0,.1)',borderRadius:8,fontFamily:'monospace',fontSize:'.72rem',color:'#1a2e22',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <select value={filtroEstado} onChange={e=>{setFiltroEstado(e.target.value);setPagBienes(1);}} style={selStyle}>
                <option value="">Todos los estados</option>
                {estadosUnicos.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
              <select value={filtroTipo} onChange={e=>{setFiltroTipo(e.target.value);setPagBienes(1);}} style={selStyle}>
                <option value="">Todos los tipos</option>
                {tiposUnicos.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              {(busqueda||filtroEstado||filtroTipo)&&(
                <button onClick={()=>{setBusqueda('');setFiltroEstado('');setFiltroTipo('');setPagBienes(1);}}
                  style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.06)',cursor:'pointer',fontFamily:'monospace',fontSize:'.65rem',fontWeight:600,color:'#dc2626',display:'flex',alignItems:'center',gap:5}}>
                  <svg style={{width:11,height:11}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Limpiar
                </button>
              )}
              <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#9ab8a2',marginLeft:'auto',whiteSpace:'nowrap'}}>{bienesFiltrados.length} resultado{bienesFiltrados.length!==1?'s':''}</span>
            </div>
          </div>

          {/* Tabla */}
          <Panel>
            <PanelHdr title="Bienes de la Región" sub={`${bienesFiltrados.length} bienes · ${REGIONES_LISTA.find(r=>r.codigo===regionSel)?.nombre}`}
              right={<button className="btn-ghost"><svg style={{width:11,height:11}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar CSV</button>}/>

            {/* Encabezado */}
            <div style={{display:'grid',gap:10,padding:'7px 20px',gridTemplateColumns:'88px 1fr 130px 110px 90px 105px',background:'rgba(0,0,0,.03)',borderBottom:'1px solid rgba(0,0,0,.07)'}}>
              {['ID','Nombre / Dirección','Comuna','Tipo','Estado','Avalúo'].map((h,i)=>(
                <span key={h} style={{fontFamily:'monospace',fontSize:'.53rem',fontWeight:600,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.12em',textAlign:(i===5?'right':'left') as any}}>{h}</span>
              ))}
            </div>

            {bienesPag.length===0 ? (
              <div style={{padding:'40px 20px',textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:8}}>🔍</div>
                <p style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.88rem',fontWeight:700,color:'#9ab8a2',textTransform:'uppercase',letterSpacing:'.1em'}}>Sin resultados</p>
              </div>
            ) : bienesPag.map(b=>(
              <div key={b.id} className="trow"
                style={{display:'grid',alignItems:'center',gap:10,padding:'10px 20px',gridTemplateColumns:'88px 1fr 130px 110px 90px 105px',cursor:'pointer'}}
                onClick={()=>{ setComunaSel(b.comuna); setTab('bienes'); setPaginaTab('ranking'); }}>
                <span style={{fontFamily:'monospace',fontSize:'.65rem',fontWeight:700,color:'#3a9956'}}>{b.id}</span>
                <div style={{minWidth:0}}>
                  <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.8rem',fontWeight:600,color:'#1a2e22',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.nombre}</p>
                  <p style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.direccion}</p>
                </div>
                <div>
                  <p style={{fontFamily:'"Barlow",sans-serif',fontSize:'.72rem',fontWeight:600,color:'#3d5c47',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.comuna}</p>
                  <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'#9ab8a2'}}>{b.provincia}</p>
                </div>
                <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#6b8f75'}}>{b.tipo}</span>
                <span className="sigbi-tag" style={{background:estadoColor[b.estado]||'rgba(0,0,0,.05)',color:estadoText[b.estado]||'#6b8f75'}}>{b.estado}</span>
                <span style={{fontFamily:'"Barlow Condensed",sans-serif',fontSize:'.9rem',fontWeight:700,color:'#d4a832',textAlign:'right',display:'block'}}>${fmt(b.avaluo*1000)}</span>
              </div>
            ))}

            {/* Paginación */}
            {totalPags>1 && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 20px',borderTop:'1px solid rgba(0,0,0,.06)',background:'rgba(0,0,0,.02)'}}>
                <span style={{fontFamily:'monospace',fontSize:'.62rem',color:'#9ab8a2'}}>
                  Mostrando {(pagBienes-1)*ITEMS_POR_PAG+1}–{Math.min(pagBienes*ITEMS_POR_PAG,bienesFiltrados.length)} de {bienesFiltrados.length}
                </span>
                <div style={{display:'flex',gap:4}}>
                  {[
                    <button key="prev" onClick={()=>setPagBienes(p=>Math.max(1,p-1))} disabled={pagBienes===1}
                      style={{width:29,height:29,borderRadius:7,border:'1px solid rgba(0,0,0,.1)',background:pagBienes===1?'rgba(0,0,0,.03)':'#fff',cursor:pagBienes===1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:pagBienes===1?'#c0d8c8':'#3d5c47'}}>
                      <svg style={{width:11,height:11}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    </button>,
                    ...Array.from({length:Math.min(totalPags,5)},(_,i)=>{
                      let p=i+1;
                      if(totalPags>5){
                        if(pagBienes<=3) p=i+1;
                        else if(pagBienes>=totalPags-2) p=totalPags-4+i;
                        else p=pagBienes-2+i;
                      }
                      return(
                        <button key={p} onClick={()=>setPagBienes(p)}
                          style={{width:29,height:29,borderRadius:7,border:`1px solid ${pagBienes===p?'rgba(58,153,86,.4)':'rgba(0,0,0,.1)'}`,background:pagBienes===p?'rgba(58,153,86,.1)':'#fff',cursor:'pointer',fontFamily:'monospace',fontSize:'.68rem',fontWeight:pagBienes===p?700:400,color:pagBienes===p?'#2e7d46':'#6b8f75'}}>
                          {p}
                        </button>
                      );
                    }),
                    <button key="next" onClick={()=>setPagBienes(p=>Math.min(totalPags,p+1))} disabled={pagBienes===totalPags}
                      style={{width:29,height:29,borderRadius:7,border:'1px solid rgba(0,0,0,.1)',background:pagBienes===totalPags?'rgba(0,0,0,.03)':'#fff',cursor:pagBienes===totalPags?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:pagBienes===totalPags?'#c0d8c8':'#3d5c47'}}>
                      <svg style={{width:11,height:11}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ]}
                </div>
              </div>
            )}

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,padding:'9px 20px',borderTop:'1px solid rgba(0,0,0,.05)'}}>
              <p style={{fontFamily:'monospace',fontSize:'.6rem',color:'#9ab8a2'}}>Fuente: SIGBI · Haz clic en una fila para ver la comuna en el ranking</p>
              <p style={{fontFamily:'monospace',fontSize:'.58rem',color:'#c0d8c8'}}>Sistema de Gestión de Bienes Inmuebles</p>
            </div>
          </Panel>
        </div>{/* fin tab bienes */}

      </div>
    </>
  );
}