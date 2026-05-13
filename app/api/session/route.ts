// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';

// POST /api/session — setear cookies al hacer login
export async function POST(request: NextRequest) {
  const { role } = await request.json();

  const response = NextResponse.json({ ok: true });

  response.cookies.set('session_predio_agricola', '1', {
    httpOnly: false,   // false para que el cliente también pueda leerla
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 día
  });

  response.cookies.set('user_role', role ?? 'usuario', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}

// DELETE /api/session — limpiar cookies al hacer logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('session_predio_agricola', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('user_role', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}