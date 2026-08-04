// app/perfil/page.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

// ── Estilos ───────────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'monospace', fontSize: '.58rem', fontWeight: 600,
  color: '#9ab8a2', textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 5,
};
const readStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', border: '1px solid rgba(0,0,0,.08)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', background: 'rgba(0,0,0,.03)',
  fontFamily: '"Barlow",sans-serif', boxSizing: 'border-box',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 8, color: '#1a2e22', fontSize: '.82rem', background: '#fff',
  fontFamily: '"Barlow",sans-serif', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .18s, box-shadow .18s',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Field label={label}>
      <div style={readStyle}>{value || '—'}</div>
    </Field>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.07)', marginBottom: 16 }}>
      <div style={{ padding: '13px 24px', borderBottom: '1px solid rgba(0,0,0,.06)',
                    background: 'rgba(0,0,0,.02)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2,
                      background: 'linear-gradient(180deg,#3aaf64,#3a9956)', flexShrink: 0 }}/>
        <span style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.82rem',
                        fontWeight: 700, color: '#1a2e22', textTransform: 'uppercase',
                        letterSpacing: '.08em' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function PerfilPage() {
  const [usuario, setUsuario]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [errors,  setErrors]    = useState<Record<string, string>>({});

  const [passForm, setPassForm] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    api.get('/api/user')
      .then(({ data }) => setUsuario(data.data ?? data))
      .catch(() => toast.error('Error al cargar perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación frontend
    const errs: Record<string, string> = {};
    if (!passForm.current_password)      errs.current_password      = 'Ingrese su contraseña actual.';
    if (!passForm.password)              errs.password              = 'Ingrese la nueva contraseña.';
    if (passForm.password.length < 8)    errs.password              = 'Mínimo 8 caracteres.';
    if (passForm.password !== passForm.password_confirmation)
                                          errs.password_confirmation = 'Las contraseñas no coinciden.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const toastId = toast.loading('Cambiando contraseña...');
    try {
      await api.put('/api/perfil/password', passForm);
      toast.success('Contraseña actualizada correctamente', { id: toastId, duration: 3000 });
      setPassForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err: any) {
      const backErrors = err.response?.data?.errors as Record<string, string[]> | undefined;
      if (backErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(backErrors).forEach(([k, v]) => { mapped[k] = v[0]; });
        setErrors(mapped);
        toast.error(err.response?.data?.message ?? 'Error al cambiar contraseña', { id: toastId });
      } else {
        toast.error(err.response?.data?.message ?? 'Error al cambiar contraseña', { id: toastId });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 300, gap: 12, fontFamily: 'monospace', fontSize: '.7rem',
                    color: '#9ab8a2' }}>
        <svg style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }}
          fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Cargando perfil...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '"Barlow",sans-serif', maxWidth: 820, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
          padding: '3px 10px 3px 8px', borderRadius: 999,
          background: 'rgba(58,153,86,.1)', border: '1px solid rgba(58,153,86,.25)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3a9956' }}/>
          <span style={{ fontFamily: 'monospace', fontSize: '.58rem', color: '#2e7d46',
            letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            Mi Cuenta
          </span>
        </div>
        <h2 style={{ fontFamily: '"Barlow Condensed",sans-serif', fontSize: '2.2rem',
          fontWeight: 800, color: '#1a2e22', textTransform: 'uppercase',
          letterSpacing: '.06em', lineHeight: 1, marginBottom: 6 }}>Mi Perfil</h2>
        <p style={{ fontSize: '.72rem', color: '#3d5c47', fontFamily: 'monospace' }}>
          {usuario?.rut_formateado ?? usuario?.rut} ·{' '}
          <span style={{ textTransform: 'capitalize' }}>{usuario?.role}</span>
        </p>
      </div>

      {/* 1. Identificación */}
      <Section title="1. Identificación del Solicitante">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                      gap: 16 }}>
          <ReadField label="RUT"              value={usuario?.rut_formateado ?? usuario?.rut} />
          <ReadField label="Nombre"           value={usuario?.name} />
          <ReadField label="Apellido Paterno" value={usuario?.apellido_ap} />
          <ReadField label="Apellido Materno" value={usuario?.apellido_mat} />
          <ReadField label="Grado / Cargo"    value={usuario?.grado} />
          <ReadField label="Tipo Contratación" value={usuario?.tipo_contratacion_nombre} />
          <ReadField label="Unidad / Repartición" value={usuario?.unidad} />
          <ReadField label="Correo Institucional" value={usuario?.email} />
          <ReadField label="Teléfono"         value={usuario?.telefono} />
        </div>
      </Section>

      {/* Cambiar contraseña */}
      <Section title="Cambiar Contraseña">
        <form onSubmit={handleCambiarPassword}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                        gap: 16, marginBottom: 20 }}>

            {/* Contraseña actual */}
            <Field label="Contraseña Actual">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passForm.current_password}
                  onChange={e => setPassForm(f => ({ ...f, current_password: e.target.value }))}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 38,
                    borderColor: errors.current_password ? '#ef4444' : 'rgba(0,0,0,.1)' }}
                />
                <EyeBtn show={showPass} onClick={() => setShowPass(!showPass)} />
              </div>
              {errors.current_password && <ErrorMsg msg={errors.current_password} />}
            </Field>

            {/* Nueva contraseña */}
            <Field label="Nueva Contraseña">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passForm.password}
                  onChange={e => setPassForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  style={{ ...inputStyle, paddingRight: 38,
                    borderColor: errors.password ? '#ef4444' : 'rgba(0,0,0,.1)' }}
                />
                <EyeBtn show={showPass} onClick={() => setShowPass(!showPass)} />
              </div>
              {errors.password && <ErrorMsg msg={errors.password} />}
            </Field>

            {/* Confirmar */}
            <Field label="Confirmar Nueva Contraseña">
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passForm.password_confirmation}
                  onChange={e => setPassForm(f => ({ ...f, password_confirmation: e.target.value }))}
                  placeholder="Repetir contraseña"
                  style={{ ...inputStyle, paddingRight: 38,
                    borderColor: errors.password_confirmation ? '#ef4444' : 'rgba(0,0,0,.1)' }}
                />
                <EyeBtn show={showPass} onClick={() => setShowPass(!showPass)} />
              </div>
              {errors.password_confirmation && <ErrorMsg msg={errors.password_confirmation} />}
            </Field>
          </div>

          {/* Indicador de fuerza */}
          {passForm.password && (
            <PasswordStrength password={passForm.password} />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="submit" disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 24px', borderRadius: 9, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
              color: '#0d2318', background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
              boxShadow: '0 4px 14px rgba(76,202,122,.28)', opacity: saving ? .7 : 1,
            }}>
              {saving ? (
                <svg style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }}
                  fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: .25 }} cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
              {saving ? 'Guardando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </Section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────
function EyeBtn({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ab8a2', padding: 0, display: 'flex' }}>
      <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={2}>
        {show ? (
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </>
        )}
      </svg>
    </button>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p style={{ fontFamily: 'monospace', fontSize: '.6rem', color: '#ef4444',
                marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      {msg}
    </p>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : 'rgba(0,0,0,.08)',
            transition: 'background .2s' }}/>
        ))}
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '.6rem',
                  color: colors[score] || '#9ab8a2', margin: 0 }}>
        {labels[score] || 'Ingresa una contraseña'}
      </p>
    </div>
  );
}