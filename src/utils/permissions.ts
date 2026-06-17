import { User, Modulo } from '../types';

export const isAdmin = (user: User | null): boolean => user?.rol === 'admin';

// ¿El usuario puede acceder/operar en una seccion concreta?
// Los admin tienen acceso a todo; el resto, segun su lista de permisos.
export const canAccess = (user: User | null, modulo: Modulo): boolean =>
  isAdmin(user) || !!user?.permisos?.includes(modulo);

// Lista de secciones accesibles para el usuario (admin = todas).
const TODOS_LOS_MODULOS: Modulo[] = ['quesos', 'elementos', 'indumentaria', 'dashboard', 'historial'];

export const modulosAccesibles = (user: User | null): Modulo[] =>
  isAdmin(user) ? TODOS_LOS_MODULOS : (user?.permisos ?? []);

export const canDelete = (user: User | null): boolean => isAdmin(user);

export const canManageProducts = (user: User | null): boolean => isAdmin(user);

// Hook de permisos.
// - Sin `modulo`: comportamiento original (las acciones requieren ser admin).
// - Con `modulo`: las acciones de esa seccion se habilitan para admin
//   o para usuarios que tengan ese modulo en sus permisos ("operar completo").
export const usePermissions = (user: User | null, modulo?: Modulo) => {
  const admin = isAdmin(user);
  const canOperate = modulo ? canAccess(user, modulo) : admin;

  return {
    isAdmin: admin,
    canDelete: canOperate,
    canCreate: canOperate,
    canEdit: canOperate,
    canCut: canOperate,
    canManageProducts: admin,
    canAccess: (m: Modulo) => canAccess(user, m),
  };
};
