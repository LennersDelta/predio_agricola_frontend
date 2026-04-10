import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas solo para administrador
const ADMIN_ROUTES = [
  '/usuarios',
  '/configuracion',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.has('session_predio_agricola');
  const userRole   = request.cookies.get('user_role')?.value ?? 'usuario';

  // ── /login ────────────────────────────────────────────────────────────────
  if (pathname === '/login') {
    // Si ya tiene sesión, redirigir al dashboard
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── Rutas protegidas — sin sesión → login ─────────────────────────────────
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Rutas solo admin ──────────────────────────────────────────────────────
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (userRole !== 'administrador') {
      const url = new URL('/dashboard', request.url);
      url.searchParams.set('error', 'no_autorizado');
    //  return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/predio/:path*',
    '/reportes/:path*',
    '/usuarios/:path*',
  ],
};