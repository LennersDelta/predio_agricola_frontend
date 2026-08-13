
'use client';

import { useEffect, useState } from 'react';
import { getUser, type UserData } from '@/lib/auth';

export type Permiso =   | 'consultar'  | 'crear'  | 'editar'  | 'eliminar';

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usuario = getUser();

    console.log('USUARIO AUTH:', usuario);

    setUser(usuario);
    setLoading(false);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ROLES
  |--------------------------------------------------------------------------
  */

  // Tomamos roles[] si existe
  const roles = user?.roles ?? [];

  // También consideramos role por compatibilidad
  const rolePrincipal = user?.role;

  /*
   * Normalizamos los roles.
   *
   * Si roles[] viene vacío pero role tiene valor,
   * agregamos role a la lista.
   */
  const rolesNormalizados = Array.from(
    new Set([
      ...roles,
      ...(rolePrincipal ? [rolePrincipal] : []),
    ])
  );

  const isSuperAdministrador =
    rolesNormalizados.includes('super_administrador');

  const isAdministrador =
    rolesNormalizados.includes('administrador');

  const isSupervisor =
    rolesNormalizados.includes('supervisor');

  const isUsuarioConsulta =
    rolesNormalizados.includes('usuario_consulta');

  /*
  |--------------------------------------------------------------------------
  | PERMISOS CENTRALES
  |--------------------------------------------------------------------------
  */

  const puedeConsultar = !! user;

  const puedeCrear =
    isSuperAdministrador ||
    isAdministrador ||
    isSupervisor;

  const puedeEditar =
    isSuperAdministrador ||
    isAdministrador ||
    isSupervisor;

  const puedeEliminar =
    isSuperAdministrador ||
    isAdministrador ||
    isSupervisor;

  /*
  |--------------------------------------------------------------------------
  | FUNCIÓN CENTRAL DE PERMISOS
  |--------------------------------------------------------------------------
  */

  const puede = (permiso: Permiso): boolean => {
    switch (permiso) {
      case 'consultar':
        return puedeConsultar;

      case 'crear':
        return puedeCrear;

      case 'editar':
        return puedeEditar;

      case 'eliminar':
        return puedeEliminar;

      default:
        return false;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PREDIOS
  |--------------------------------------------------------------------------
  */

  const puedeAdministrarTodosLosPredios =
    isSuperAdministrador ||
    isAdministrador;

  const tieneAccesoRestringidoPredio =
    isSupervisor ||
    isUsuarioConsulta;

  /*
  |--------------------------------------------------------------------------
  | FUNCIONES DE ROLES
  |--------------------------------------------------------------------------
  */

  const hasRole = (role: string): boolean => {
    return rolesNormalizados.includes(role);
  };

  const hasAnyRole = (rolesBuscados: string[]): boolean => {
    return rolesBuscados.some(role =>
      rolesNormalizados.includes(role)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    /*
     * Usuario
     */
    user,
    loading,

    /*
     * Roles
     */
    roles: rolesNormalizados,

    isSuperAdministrador,
    isAdministrador,
    isSupervisor,
    isUsuarioConsulta,

    /*
     * Compatibilidad
     */
    isAdmin:
      isAdministrador ||
      isSuperAdministrador,

    isUsuario:
      isUsuarioConsulta,

    /*
     * Permisos
     */
    puede,
    puedeConsultar,
    puedeCrear,
    puedeEditar,
    puedeEliminar,

    /*
     * Predios
     */
    puedeAdministrarTodosLosPredios,
    tieneAccesoRestringidoPredio,

    /*
     * Roles
     */
    hasRole,
    hasAnyRole,
  };
}
