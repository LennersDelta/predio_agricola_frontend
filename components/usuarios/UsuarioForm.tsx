// components/usuarios/UsuarioForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AREAS, GRADOS, TIPOS_CONTRATACION, ROLES } from '@/lib/usuarios-config';
import { Usuario } from '@/hooks/useUsuarios';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
export interface UsuarioFormData {
  name: string;
  apellido_ap: string;
  apellido_mat: string;
  email: string;
  grado: string;
  tipo_contratacion: string;
  telefono: string;
  area_id: string;
  role: string;
  password: string;
  password_confirmation: string;
}

interface Props {
  modo: 'crear' | 'editar';
  inicial?: Partial<UsuarioFormData>;
  rutSoloLectura?: string;     // RUT formateado para mostrar en editar
  errors: Record<string, string>;
  loading: boolean;
  onSubmit: (data: UsuarioFormData) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
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

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'rgba(0,0,0,.04)',
  border: '1px solid rgba(0,0,0,.07)',
  color: '#6b8f75', cursor: 'default',
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string;
  hint?: string; children: React.ReactNode;
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
      {hint && !error && (
        <p style={{ fontFamily: 'monospace', fontSize: '.55rem',
                    color: '#9ab8a2', marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{ ...inputStyle, ...props.style }}
      onFocus={e => { e.target.style.borderColor = '#3a9956'; e.target.style.boxShadow = '0 0 0 3px rgba(58,153,86,.1)'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(0,0,0,.1)'; e.target.style.boxShadow = 'none'; }}
    />
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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '26px 28px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY: UsuarioFormData = {
  name: '', apellido_ap: '', apellido_mat: '',
  email: '', grado: '', tipo_contratacion: '',
  telefono: '', area_id: '', role: 'usuario',
  password: '', password_confirmation: '',
};

export default function UsuarioForm({
  modo, inicial, rutSoloLectura, errors, loading, onSubmit,
}: Props) {
  // Normalizar: reemplazar undefined/null por '' para mantener inputs controlados
  const inicialNormalizado = inicial
    ? Object.fromEntries(
        Object.entries(inicial).map(([k, v]) => [k, v ?? ''])
      )
    : {};

  const [form, setForm] = useState<UsuarioFormData>({ ...EMPTY, ...inicialNormalizado });
  const [showPass, setShowPass] = useState(false);

  const set = (k: keyof UsuarioFormData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)',
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,.1)' }}>

        {/* SECCIÓN 1 — Datos personales */}
        <Section>
          <SecTitle label="Datos Personales" />
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>

            {/* RUT — solo lectura en editar, oculto en crear (se ingresa aparte) */}
            {modo === 'editar' && rutSoloLectura && (
              <Field label="RUT">
                <input readOnly value={rutSoloLectura} style={readOnlyStyle} />
              </Field>
            )}

            <Field label="Nombres" required error={errors.name}>
              <FInput placeholder="Ej: Juan Carlos" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </Field>

            <Field label="Apellido Paterno" required error={errors.apellido_ap}>
              <FInput placeholder="Ej: González" value={form.apellido_ap}
                onChange={e => set('apellido_ap', e.target.value)} required />
            </Field>

            <Field label="Apellido Materno" error={errors.apellido_mat}>
              <FInput placeholder="Ej: Muñoz" value={form.apellido_mat}
                onChange={e => set('apellido_mat', e.target.value)} />
            </Field>

            <Field label="Correo electrónico" error={errors.email}
              hint="Opcional — se usa para notificaciones">
              <FInput type="email" placeholder="usuario@institución.cl"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>

            <Field label="Teléfono" error={errors.telefono}>
              <FInput type="tel" placeholder="+56 9 1234 5678"
                value={form.telefono} onChange={e => set('telefono', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* SECCIÓN 2 — Datos institucionales */}
        <Section>
          <SecTitle label="Datos Institucionales" />
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>

            <Field label="Grado" error={errors.grado}>
              <FSelect value={form.grado} onChange={e => set('grado', e.target.value)}>
                <option value="">Seleccione grado</option>
                {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
              </FSelect>
            </Field>

            <Field label="Tipo Contratación" error={errors.tipo_contratacion}>
              <FSelect value={form.tipo_contratacion}
                onChange={e => set('tipo_contratacion', e.target.value)}>
                <option value="">Seleccione tipo</option>
                {TIPOS_CONTRATACION.map(t => <option key={t} value={t}>{t}</option>)}
              </FSelect>
            </Field>

            <Field label="Área" error={errors.area_id}>
              <FSelect value={form.area_id} onChange={e => set('area_id', e.target.value)}>
                <option value="">Seleccione área</option>
                {AREAS.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </FSelect>
            </Field>

            <Field label="Rol en el Sistema" required error={errors.role}>
              <FSelect value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </FSelect>
            </Field>
          </div>
        </Section>

        {/* SECCIÓN 3 — Credenciales (crear) / Cambiar contraseña (editar) */}
        <Section>
          <SecTitle label={modo === 'crear' ? 'Credenciales de Acceso' : 'Cambiar Contraseña'} />

          {/* RUT solo en crear */}
          {modo === 'crear' && (
            <div style={{ display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                          gap: 16, marginBottom: 16 }}>
              <Field label="RUT" required error={errors.rut}
                hint="Sin puntos ni guión — Ej: 123456789">
                <FInput placeholder="123456789" value={(form as any).rut ?? ''}
                  onChange={e => set('rut' as any, e.target.value)} required />
              </Field>
            </div>
          )}

          {modo === 'editar' && (
            <p style={{ fontFamily: 'monospace', fontSize: '.62rem', color: '#9ab8a2',
                        marginBottom: 16 }}>
              Deja los campos en blanco para mantener la contraseña actual.
            </p>
          )}

          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            <Field
              label={modo === 'crear' ? 'Contraseña' : 'Nueva Contraseña'}
              required={modo === 'crear'}
              error={errors.password}
              hint="Mínimo 8 caracteres">
              <div style={{ position: 'relative' }}>
                <FInput
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required={modo === 'crear'}
                  style={{ paddingRight: 38 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 10, top: '50%',
                            transform: 'translateY(-50%)', background: 'none',
                            border: 'none', cursor: 'pointer', color: '#9ab8a2', padding: 0 }}>
                  <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    {showPass ? (
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </Field>

            <Field label="Confirmar Contraseña"
              required={modo === 'crear'}
              error={errors.password_confirmation}>
              <FInput
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password_confirmation}
                onChange={e => set('password_confirmation', e.target.value)}
                required={modo === 'crear'}
              />
            </Field>
          </div>
        </Section>

        {/* FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: 12, padding: '20px 28px',
                      background: 'rgba(0,0,0,.03)', borderTop: '1px solid rgba(0,0,0,.06)' }}>
          <p style={{ fontSize: '.65rem', color: '#9ab8a2', fontFamily: 'monospace' }}>
            <span style={{ color: '#fca5a5' }}>*</span> Campos obligatorios
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/usuarios"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '10px 20px', borderRadius: 9,
                        fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
                        color: '#6b8f75', background: '#eaf3ec',
                        border: '1px solid rgba(0,0,0,.1)', textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 24px', borderRadius: 9, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: '"Barlow Condensed",sans-serif', fontSize: '.85rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
              color: '#0d2318', background: 'linear-gradient(135deg,#3aaf64,#7dd494)',
              boxShadow: '0 4px 14px rgba(76,202,122,.28)', opacity: loading ? .7 : 1,
            }}
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
              {loading ? 'Guardando...' : modo === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}