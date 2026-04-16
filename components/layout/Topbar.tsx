// components/layout/Topbar.tsx
'use client';

import { usePathname } from 'next/navigation';

// Rutas estáticas
const breadcrumbs: Record<string, string> = {
  '/dashboard':          'Dashboard',
  
  '/predio/insumosproductos':             'Adquisición de insumos y productos',
  '/predio/insumosproductos/crear':       'Ingreso de insumos y productos',

  '/predio/parquevehicular':    'Parque Vehicular',
  '/predio/parquevehicular/crear': 'Ingreso parque vehicular', 
  
  '/predio/recursoshumanos': 'Recursos humanos',
  '/predio/recursoshumanos/crear': 'Ingreso recurso humano',
 
  '/predio/factura/luz': 'Factura Luz',
  '/predio/factura/luz/crear': 'Ingreso factura luz', 
  '/predio/factura/agua': 'Factura Agua',
  '/predio/factura/agua/crear': 'Ingreso factura agua', 
  

  '/predio/anticipo': 'Anticipo rendir cuenta',
  '/predio/anticipo/crear': 'Ingreso anticipo rendir cuenta',

  '/predio/combustible': 'Combustible',
  '/predio/combustible/crear': 'Ingreso combustible',


'/predio/contratos' : 'Contratos efectuados',
'/predio/contratos/crear' : 'Ingreso contratos efectuados',







  '/reportes/provincia': 'Reportes por Provincia',
  '/reportes/comuna':    'Reportes por Comuna',
  '/usuarios':           'Usuarios',
  '/usuarios/crear':     'Nuevo Usuario',
  '/configuracion':      'Configuración',
};

// Patrones dinámicos — orden importa (más específico primero)
const dynamicBreadcrumbs: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/bienes\/.+\/editar$/,   label: 'Editar Bien'    },
  { pattern: /^\/bienes\/.+$/,            label: 'Ver Bien'       },
  { pattern: /^\/usuarios\/.+\/editar$/, label: 'Editar Usuario' },
  { pattern: /^\/usuarios\/.+$/,          label: 'Ver Usuario'    },
];

function getLabel(pathname: string): string {
  const path = pathname.split('?')[0]; // quitar query string
  if (breadcrumbs[path]) return breadcrumbs[path];
  for (const { pattern, label } of dynamicBreadcrumbs) {
    if (pattern.test(path)) return label;
  }
  return 'Dashboard';
}

export default function Topbar() {
  const pathname = usePathname();
  const label    = getLabel(pathname);
  const today    = new Date().toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header style={{
      position: 'sticky', top: 0, height: 52,
      background: 'rgba(240,244,241,.95)',
      borderBottom: '1px solid rgba(0,0,0,0.1)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', zIndex: 30, flexShrink: 0,
    }}>

      {/* Línea de acento */}
      <div style={{
        position: 'absolute', bottom: -1, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, #3a9956 30%, #d4a832 70%, transparent 100%)',
        opacity: .4,
      }} />

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem' }}>
        <span style={{ color: '#6b8f75', fontFamily: 'monospace', fontSize: '.65rem', letterSpacing: '.08em' }}>
          SIGPA
        </span>
        <svg style={{ width: 10, height: 10, color: '#9ab8a2' }} fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span style={{ color: '#2e7d46', fontWeight: 700,
                        fontFamily: '"Barlow Condensed", sans-serif',
                        letterSpacing: '.06em', fontSize: '.82rem' }}>
          {label}
        </span>
      </nav>

      {/* Derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ color: '#6b8f75', fontSize: '.64rem', fontFamily: 'monospace', letterSpacing: '.04em' }}>
          {today}
        </p>
        <button style={{
          position: 'relative', background: '#eaf3ec', border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 7, padding: 6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d5c47',
        }}>
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6,
                          background: '#d4a832', borderRadius: '50%',
                          border: '1.5px solid #eaf3ec' }} />
        </button>
      </div>
    </header>
  );
}