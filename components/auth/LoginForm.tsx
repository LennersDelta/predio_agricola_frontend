// components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS RUT
// ─────────────────────────────────────────────────────────────────────────────

/** Elimina puntos, guión y espacios — deja solo dígitos y k/K */
function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '');
}

/** Formatea: 12345678-9  →  12.345.678-9 */
function formatearRut(raw: string): string {
  const limpio = limpiarRut(raw);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv     = limpio.slice(-1).toUpperCase();
  // Agregar puntos cada 3 dígitos desde la derecha
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${conPuntos}-${dv}`;
}

/** Valida dígito verificador */
function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1).toUpperCase();
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvCalculado = 11 - (suma % 11);
  const dvEsperado =
    dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : String(dvCalculado);

  return dvIngresado === dvEsperado;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginForm() {
  const router = useRouter();

  const [rut,          setRut]          = useState('163228149');
  const [rutValido,    setRutValido]    = useState<boolean | null>(null); // null = sin tocar
  const [password,     setPassword]     = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // ── Manejo de input RUT ─────────────────────────────────────────────────
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw    = e.target.value;
    const limpio = limpiarRut(raw);

    // Formatear solo si tiene suficientes caracteres
    const formateado = limpio.length >= 2 ? formatearRut(limpio) : limpio;
    setRut(formateado);

    // Validar en tiempo real a partir de 7 dígitos
    if (limpio.length >= 7) {
      setRutValido(validarRut(limpio));
    } else {
      setRutValido(null);
    }
  };

  const handleRutBlur = () => {
    if (rut) setRutValido(validarRut(limpiarRut(rut)));
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar RUT antes de enviar
    if (!validarRut(limpiarRut(rut))) {
      setError('El RUT ingresado no es válido');
      setRutValido(false);
      return;
    }

    setLoading(true);
    try {
      // Enviar RUT sin formato (solo dígitos + dv) al backend
      const rutLimpio = limpiarRut(rut);
      const user = await login(rutLimpio, password);
      localStorage.setItem('user', JSON.stringify({
        name: user.name, email: user.email, grado: user.grado, role: user.role,
      }));
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Colores de estado del RUT ───────────────────────────────────────────
  const rutBorderColor =
    rutValido === null  ? 'border-verde-medio/50' :
    rutValido           ? 'border-verde-acento/70' :
                          'border-red-500/60';

  return (
    <div
      className="relative z-10 w-full max-w-5xl mx-4 lg:mx-auto flex rounded-2xl overflow-hidden shadow-2xl border border-verde-medio/40"
      style={{ background: 'rgba(13,34,24,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* ── PANEL IZQUIERDO ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between diagonal-accent bg-gradient-to-br from-verde-medio to-verde-oscuro p-10 relative overflow-hidden">
        {/* Patrón interno */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #4CCA84 0, #4CCA84 1px, transparent 0, transparent 50%)',
            backgroundSize: '12px 12px',
          }}
        />

        {/* Logo */}
        <div className="relative animate-fade-up">
          <div className="escudo-glow mb-6">
            <Image src="/images/bienestar-logo.png" width={80} height={80} alt="Carabineros" />
          </div>
          <p className="text-verde-acento font-heading font-semibold tracking-[0.25em] text-xs uppercase mb-1">
            República de Chile
          </p>
          <h1 className="font-heading font-extrabold text-white text-4xl leading-none uppercase tracking-wide">
            Dirección de Bienestar<br />
            <span className="text-verde-neon">de Carabineros de Chile</span>
          </h1>
        </div>

        {/* Info central */}
        <div className="relative animate-fade-up-d2 space-y-6">
          <div className="border-l-2 border-dorado-base pl-4">
            <h2 className="font-heading font-bold text-white text-2xl uppercase tracking-widest leading-tight">
              SIGPA
            </h2>
            <p className="text-verde-acento text-sm font-body tracking-wider mt-1">
              Sistema de Gestión Predio Agrícola
            </p>
          </div>
          <p className="text-gris-claro/80 text-sm font-body leading-relaxed">
            Plataforma centralizada para la gestión, control y administración del
            predio agrícola institucional DIBICAR.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-verde-oscuro/60 border border-verde-base/30 rounded-lg p-3 text-center">
              <p className="text-verde-neon font-heading font-bold text-xl">16</p>
              <p className="text-gris-claro/60 text-xs font-body uppercase tracking-wider">Regiones</p>
            </div>
            <div className="bg-verde-oscuro/60 border border-verde-base/30 rounded-lg p-3 text-center">
              <p className="text-verde-neon font-heading font-bold text-sm">
                {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-gris-claro/60 text-xs font-body uppercase tracking-wider mt-1">Fecha</p>
            </div>
          </div>
        </div>

        {/* Footer panel */}
        <div className="relative animate-fade-up-d3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-verde-neon animate-pulse-slow" />
            <p className="text-gris-claro/50 text-xs font-body">Versión 1.0</p>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center p-8 lg:p-12 relative">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 lg:mb-10 animate-fade-up">
          <Image src="/images/bienestar-logo.png" width={40} height={40} alt="Carabineros" />
          <div>
            <p className="text-verde-acento font-heading tracking-[0.2em] text-xs uppercase font-semibold">
              Acceso Restringido
            </p>
            <h2 className="text-white font-heading font-bold text-2xl uppercase tracking-wide">
              Iniciar Sesión
            </h2>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 animate-fade-up bg-red-900/30 border border-red-500/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-red-300 text-sm font-body">{error}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* RUT */}
          <div className="animate-fade-up-d1">
            <label className="block text-gris-claro/70 font-body text-xs uppercase tracking-widest font-semibold mb-2">
              RUT
            </label>
            <div className="input-wrap relative flex items-center">
              {/* Icono cédula */}
              <span className="input-icon absolute left-4 text-gris-claro/40 transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 .621-.504 1-1 1H7a1 1 0 01-1-1v-1a3 3 0 016 0v1z" />
                </svg>
              </span>

              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                onBlur={handleRutBlur}
                required
                placeholder="12.345.678-9"
                maxLength={12}
                autoComplete="username"
                className={`input-field w-full border text-white placeholder-gris-claro/30 font-body text-sm rounded-lg pl-11 pr-10 py-3.5 transition-all duration-300 ${rutBorderColor}`}
                style={{ background: 'rgba(13,34,24,0.5)' }}
              />

              {/* Indicador válido/inválido */}
              {rutValido !== null && (
                <span className="absolute right-4 transition-all duration-200">
                  {rutValido ? (
                    <svg className="w-4 h-4 text-verde-acento" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
              )}
            </div>

            {/* Hint / error inline */}
            <p className={`text-xs font-body mt-1.5 transition-colors duration-200 ${
              rutValido === false ? 'text-red-400' : 'text-gris-claro/30'
            }`}>
              {rutValido === false
                ? 'RUT inválido — verifica el dígito verificador'
                : 'Formato: 12.345.678-9'}
            </p>
          </div>

          {/* Contraseña */}
          <div className="animate-fade-up-d2">
            <label className="block text-gris-claro/70 font-body text-xs uppercase tracking-widest font-semibold mb-2">
              Contraseña
            </label>
            <div className="input-wrap relative flex items-center">
              <span className="input-icon absolute left-4 text-gris-claro/40 transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="input-field w-full border border-verde-medio/50 text-white placeholder-gris-claro/30 font-body text-sm rounded-lg pl-11 pr-12 py-3.5 transition-all duration-300"
                style={{ background: 'rgba(13,34,24,0.5)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gris-claro/40 hover:text-verde-acento transition-colors duration-200"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Botón */}
          <div className="animate-fade-up-d4 pt-2">
            <button
              type="submit"
              disabled={loading || rutValido === false}
              className="btn-primary w-full text-white font-heading font-bold text-base uppercase tracking-[0.2em] py-4 rounded-lg transition-all duration-300 shadow-lg shadow-verde-base/30 hover:shadow-verde-acento/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-verde-medio/30 animate-fade-up-d4">
          <p className="text-gris-claro/30 text-xs font-body">
            © {new Date().getFullYear()} Carabineros de Chile
          </p>
          <p className="text-gris-claro/25 text-xs font-body mt-2">
            El acceso no autorizado a este sistema es un delito sancionado por la Ley N° 0000.
          </p>
        </div>
      </div>
    </div>
  );
}