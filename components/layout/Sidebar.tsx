// components/layout/Sidebar.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';
import api from '@/lib/axios';
import { group } from 'console';

// ─────────────────────────────────────────────
// NAVEGACIÓN — filtrada por rol en el render
// ─────────────────────────────────────────────


const navGroups = [
  {
    group: 'Principal',
    adminOnly: false,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    ],
  },
  {
    group: 'Gestión de Predio Agrícola',
    adminOnly: false,
    items: [
      { href: '/predio/insumosproductos',       label: 'Adquisición de insumos y productos', icon: 'building' },
      { href: '/predio/parquevehicular',       label: 'Parque  Vehicular', icon: 'car' },
      { href: '/predio/recursoshumanos',  label:'Recursos Humano', icon: 'users'},
    ],
  },
  {
    group: 'Reportes',
    adminOnly: false,
    items: [
      { href: '/reportes/Definir', label: 'Por Definir', icon: 'report' },

    ],
  },
  {
    group: 'Administración',
    adminOnly: true,
    items: [
      { href: '/usuarios',      label: 'Usuarios',      icon: 'users'  },
      { href: '/configuracion', label: 'Configuración', icon: 'config' },
    ],
  },
];

// ─────────────────────────────────────────────
// ICONOS
// ─────────────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  home:     <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
  building: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>,
  plus:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>,
  report:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
  users:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>,
  config:   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>,
  user:     <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
  logout:   <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>,
  shield:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
  draft:    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>,
car: 
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 13l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5M5 13h14M5 13v5a1 1 0 001 1h1m10-6v5a1 1 0 01-1 1h-1m-8 0h8"
  />

};

function NavIcon({ name }: { name: string }) {
  return (
    <svg style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.75 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {icons[name] ?? icons.home}
    </svg>
  );
}

function RoleBadge({ role, collapsed }: { role: string; collapsed: boolean }) {
  const isAdmin = role === 'administrador';
  if (collapsed) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 999, marginTop: 2,
      background: isAdmin ? 'rgba(212,168,50,.2)' : 'rgba(255,255,255,.1)',
      border: `1px solid ${isAdmin ? 'rgba(212,168,50,.4)' : 'rgba(255,255,255,.2)'}`,
      fontFamily: 'monospace', fontSize: '.54rem', fontWeight: 600,
      color: isAdmin ? '#d4a832' : 'rgba(255,255,255,.7)',
      letterSpacing: '.1em', textTransform: 'uppercase',
    }}>
      {isAdmin && (
        <svg style={{ width: 9, height: 9 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {icons.shield}
        </svg>
      )}
      {isAdmin ? 'Administrador' : 'Usuario'}
    </span>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Sidebar() {
  const pathname                     = usePathname();
  const router                       = useRouter();
  const [collapsed, setCollapsed]    = useState(false);
  const [mobileOpen, setMobileOpen]  = useState(false);
  const [loggingOut, setLoggingOut]  = useState(false);
  const [borradoresCount, setBorradoresCount] = useState(0);
  const { user, isAdmin, loading }   = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('sgbr_sidebar');
    if (saved === 'collapsed') setCollapsed(true);
  }, []);

  /*const cargarBorradores = useCallback(async () => {
    try {
      const { data } = await api.get('/api/bienes-borradores');
      setBorradoresCount((data.data ?? data).length);
    } catch {}
  }, []);

  useEffect(() => {
    cargarBorradores();
    const interval = setInterval(cargarBorradores, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cargarBorradores]);*/

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sgbr_sidebar', next ? 'collapsed' : 'expanded');
    const wrapper = document.getElementById('main-wrapper');
    if (wrapper) wrapper.style.marginLeft = next ? '64px' : '256px';
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } catch {}
    finally { router.push('/login'); }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const sbW = collapsed ? 64 : 256;
 // const isBorradoresActive = pathname === '/bienes' && typeof window !== 'undefined' && window.location.search.includes('tab=borradores');

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
      )}

      {/* Hamburger mobile */}
      <button onClick={() => setMobileOpen(true)} className="hamburger-btn" aria-label="Abrir menú"
        style={{ display: 'none', position: 'fixed', top: 12, left: 12, zIndex: 70, background: '#2e7d46', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ width: 18, height: 18, color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <aside style={{
        position: 'fixed', top: 0, left: 0,
        width: sbW, height: '100vh',
        background: 'linear-gradient(180deg,#0d2218 0%,#1a3d2b 45%,#1e4d30 100%)',
        borderRight: '1px solid rgba(0,0,0,.2)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', zIndex: 50,
        transition: 'width .28s cubic-bezier(.4,0,.2,1)',
        boxShadow: '4px 0 24px rgba(0,0,0,.3)',
      }}>

        {/* Patrón fondo */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 50% 0%,rgba(255,255,255,.06) 0%,transparent 55%), linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '100% 100%,32px 32px,32px 32px' }} />

        {/* Toggle desktop */}
        <button onClick={toggle} style={{ position: 'absolute', top: 22, right: -11, width: 22, height: 22, background: '#3a9956', border: '1px solid rgba(0,0,0,.2)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, boxShadow: '0 2px 8px rgba(0,0,0,.4)', transition: 'background .2s,transform .32s', transform: collapsed ? 'rotate(180deg)' : 'none' }}>
          <svg style={{ width: 11, height: 11, color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 16px 14px', flexShrink: 0, position: 'relative' }}>
          <div style={{ flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(255,255,255,.2))' }}>
            <Image src="/images/bienestar-logo.png" width={38} height={38} alt="SIGBI"/>
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'rgba(255,255,255,.5)', fontFamily: 'monospace', fontSize: '.54rem', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, lineHeight: 1, marginBottom: 3 }}>Carabineros de Chile</p>
              <h1 style={{ color: '#fff', fontFamily: '"Barlow Condensed",sans-serif', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', lineHeight: 1 }}>SIGPA</h1>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.54rem', letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 2, fontFamily: 'monospace' }}>Sistema de Gestión Predio Agrícola</p>
            </div>
          )}
        </div>

        {/* Separador dorado */}
        <div style={{ margin: '0 14px 12px', flexShrink: 0 }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#d4a832,transparent)', opacity: .5 }}/>
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#ecc84a,transparent)', opacity: .15, marginTop: 2 }}/>
        </div>

        {/* ── TARJETA USUARIO ── */}
        <div style={{ margin: '0 10px 10px', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: isAdmin ? 'rgba(212,168,50,.25)' : 'rgba(255,255,255,.15)', border: `1px solid ${isAdmin ? 'rgba(212,168,50,.5)' : 'rgba(255,255,255,.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Barlow Condensed",sans-serif', fontWeight: 800, fontSize: '.95rem', color: isAdmin ? '#d4a832' : '#fff' }}>
                {loading ? '…' : initials}
              </div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#7fffa0', border: '2px solid #1a3d2b' }}/>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <p style={{ color: '#fff', fontSize: '.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                  {loading ? '...' : (user?.name ?? 'Usuario')}
                </p>
                {user?.grado && (
                  <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.6rem', fontFamily: 'monospace', letterSpacing: '.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.grado}
                  </p>
                )}
                <RoleBadge role={user?.role ?? ''} collapsed={collapsed}/>
              </div>
            )}
          </div>
        </div>

        {/* ── NAVEGACIÓN ── */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 6 }}>
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            const items = group.items;
            return (
              <div key={group.group} style={{ marginBottom: 4 }}>
                {!collapsed && (
                  <p style={{ padding: '10px 20px 3px', color: 'rgba(255,255,255,.35)', fontSize: '.55rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {group.adminOnly && (
                      <svg style={{ width: 9, height: 9, color: '#d4a832' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{icons.shield}</svg>
                    )}
                    {group.group}
                  </p>
                )}
                {items.map((item) => {
                  const isActive = pathname === item.href; // determino que menu esta activo
                  return (
                    <Link key={item.href} href={item.href}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : 10,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '9px 0' : '8px 12px',
                        margin: '1px 8px', borderRadius: 7,
                        color: isActive ? '#fff' : 'rgba(255,255,255,.75)',
                        fontSize: '.8rem', fontWeight: isActive ? 600 : 400,
                        letterSpacing: '.02em', textDecoration: 'none',
                        background: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
                        border: `1px solid ${isActive ? 'rgba(255,255,255,.25)' : 'transparent'}`,
                        transition: 'background .15s,color .15s',
                        width: 'calc(100% - 16px)',
                      }}>
                      <NavIcon name={item.icon}/>
                      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                      {!collapsed && isActive && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4cca84', flexShrink: 0 }}/>
                      )}
                    </Link>
                  );
                })}

        
              </div>
            );
          })}
        </nav>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '8px 8px 12px', flexShrink: 0 }}>
          <Link href="/dashboard/perfil"
            style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '8px 12px', margin: '1px 0', borderRadius: 7, color: 'rgba(255,255,255,.7)', fontSize: '.8rem', textDecoration: 'none', width: '100%', border: '1px solid transparent', transition: 'background .15s' }}>
            <NavIcon name="user"/>
            {!collapsed && <span>Mi Perfil</span>}
          </Link>

          <button onClick={handleLogout} disabled={loggingOut}
            style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px 0' : '8px 12px', margin: '1px 0', borderRadius: 7, color: 'rgba(255,180,180,.85)', fontSize: '.8rem', fontWeight: 500, background: 'none', border: '1px solid transparent', cursor: loggingOut ? 'wait' : 'pointer', width: '100%', fontFamily: '"Barlow",sans-serif', opacity: loggingOut ? 0.6 : 1, transition: 'opacity .2s' }}>
            <NavIcon name="logout"/>
            {!collapsed && <span>{loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>}
          </button>

          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px 0' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4cca84', flexShrink: 0 }}/>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.54rem', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                SIGPA v1.0 · {new Date().getFullYear()}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}