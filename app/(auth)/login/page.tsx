// app/(auth)/login/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { login } from '@/lib/auth';

// ── CONFIGURACIÓN — cambiar por proyecto ─────────────────────────────────────
const NOMBRE_SISTEMA = 'Sistema de Gestión de Predio Agrícola';
const SUBTITULO      = 'Sección Predio Agrícola';
const VERSION        = 'v1.0.0';
const BASE           = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const OBJETIVO       = 'Sistema centralizado para la gestión, control y administración predio agrícola DIBICAR.';
// ─────────────────────────────────────────────────────────────────────────────

function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '');
}

function validarRut(rut: string): boolean {
  const limpio = limpiarRut(rut);
  if (limpio.length < 7) return false;
  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1).toUpperCase();
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0, multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvCalc = 11 - (suma % 11);
  const dvEsp = dvCalc === 11 ? '0' : dvCalc === 10 ? 'K' : String(dvCalc);
  return dvIngresado === dvEsp;
}

export default function LoginPage() {
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const links = [
      `${BASE}/autentificatic/css/font-awesome.min.css`,
      `${BASE}/autentificatic/css/style.css`,
    ];
    const added = links.map(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => added.forEach(l => document.head.removeChild(l));
  }, []);

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace('.', '').replace('-', '');
    const cuerpo = val.slice(0, -1);
    const dv = val.slice(-1).toUpperCase();
    setRut(cuerpo + dv);
    setRutError('');
    setError('');
  }

  function handleRutBlur() {
    const limpio = limpiarRut(rut);
    if (!limpio) return;
    if (limpio.length < 7) { setRutError('RUT Incompleto'); return; }
    if (!validarRut(limpio)) { setRutError('RUT no válido'); return; }
    setRutError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const rutLimpio = limpiarRut(rut);
    if (!validarRut(rutLimpio)) { setRutError('RUT no válido'); return; }
    setLoading(true);
    try {
      const user = await login(rutLimpio, password);
      localStorage.setItem('user', JSON.stringify({
        name: user.name, email: user.email, grado: user.grado, role: user.role,
      }));
      const expiry = new Date(Date.now() + 30 * 60 * 1000).toUTCString();
      document.cookie = `auth_ok=1; path=/; expires=${expiry}; SameSite=Lax`;
      document.cookie = `user_role=${(user.role ?? 'usuario').toLowerCase()}; path=/; expires=${expiry}; SameSite=Lax`;
      await new Promise(r => setTimeout(r, 50));
      window.location.href = `${BASE}/dashboard`;
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.errors?.rut
        ? (Array.isArray(data.errors.rut) ? data.errors.rut[0] : data.errors.rut)
        : data?.message ?? 'Credenciales incorrectas';
      setError(msg);
      document.cookie = 'auth_ok=; path=/; max-age=0';
      document.cookie = 'user_role=; path=/; max-age=0';
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      backgroundImage: `url(${BASE}/autentificatic/images/bg.png)`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      margin: 0,
    }}>
      <div style={{ paddingTop: '5%' }}>

        {/* Header institucional */}
        <div className="carabineros">
          <div style={{ lineHeight: '32px', width: '80%', float: 'right', textAlign: 'left' }}>
            <h1 className="title-name-app">{NOMBRE_SISTEMA}</h1>
            <h5 className="subtitle-name-app">{SUBTITULO}</h5>
          </div>
          <div style={{ width: '30%' }}>
            <img src={`${BASE}/autentificatic/images/carabineros.png`} width={70} alt="Carabineros" />
          </div>
        </div>
        <div style={{ clear: 'both' }} />

        {/* Card login */}
        <div className="login-page">

          {/* Sello AutentificaTic */}
          <div className="autentificatic-sello" style={{ textAlign: 'center' }}>
            <a href="http://autentificaticapi.carabineros.cl/assets/documents/procedimiento_de_seguridad.pdf" target="_blank" rel="noopener noreferrer">
              <img src="http://autentificaticapi.carabineros.cl/assets/images/autentificatic.png" width={280} style={{ paddingTop: 6 }} alt="Autentificatic" />
            </a>
          </div>

          {/* Info popup */}
          <div style={{ display: 'flex', width: '100%', justifyContent: 'center', margin: '8px auto' }}>
            <a href="#popup">
              <img src={`${BASE}/autentificatic/images/info.png`} width={50} alt="Info" />
            </a>
          </div>

          {/* Error general */}
          {error && (
            <div style={{ margin: '0 30px 25px', padding: '10px 14px', background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: 6, color: '#721c24', fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Formulario */}
          <div className="input-size">
            <form id="form_login" onSubmit={handleSubmit}>

              {/* RUT */}
              <div className="input-group form-group">
                <input
                  name="rut_funcionario" id="rut_funcionario" type="text"
                  className={rutError ? 'input-style-invalid' : 'input-style'}
                  size={10} value={rut}
                  onChange={handleRutChange}
                  onBlur={handleRutBlur}
                  required
                />
                <span className="highlight" />
                <span className="bar" />
                <label className="label-input">
                  RUT (sin puntos ni guión)
                </label>
                {rutError && (
                  <div className="invalid-feedback" style={{ display: 'block' }}>
                    <span>{rutError}</span>
                  </div>
                )}
              </div>

              {/* Contraseña */}
              <div className="input-group form-group">
                <input
                  name="password" id="password" type="password"
                  className="input-style" size={20}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <span className="highlight" />
                <span className="bar" />
                <label className="label-input">
                  Contraseña
                </label>
              </div>

              {/* Links */}
              <div style={{ float: 'left' }}>
                <a href="http://autentificatic.carabineros.cl/password/reset">Recuperar contraseña</a>
              </div>
              <div style={{ float: 'right' }}>
                <a href="http://autentificatic.carabineros.cl/register">Registrate en autentificatic</a>
              </div>
              <div style={{ clear: 'both', paddingBottom: 15 }} />

              {/* Botón */}
              <div style={{ textAlign: 'center' }}>
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Verificando...' : 'Iniciar Sesion'}
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: 0 }}><strong>{NOMBRE_SISTEMA} {VERSION}</strong></p>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center'}}>
          <div className="title-by">Desarrollado por Departamento B.10 - Sección Tecnología de la Información</div>
          {/* <div className="title-deskhelp">MESA DE AYUDA: 22300</div> */}
        </div>

        <div className="logos-bottom">
          <img src="http://intranetv2.carabineros.cl/DescargasTIC/aniversario.png" width={70} style={{ float: 'left', paddingTop: 20 }} alt="" />
          <img src="http://intranetv2.carabineros.cl/DescargasTIC/sello-TIC.png" width={70} style={{ float: 'right' }} alt="" />
        </div>

        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center'}} className="slogan">
          <img src="http://intranetv2.carabineros.cl/DescargasTIC/slogan.png" style={{ paddingTop: 20 }} alt="" />
        </div>

      </div>

      {/* Popup objetivo */}
      <div id="popup" className="overlay">
        <div id="popupBody">
          <h2>Objetivo del sistema</h2>
          <a id="cerrar" href="#">&times;</a>
          <div className="popupContent">
            <p>{OBJETIVO}</p>
          </div>
        </div>
      </div>

    </div>
  );
}