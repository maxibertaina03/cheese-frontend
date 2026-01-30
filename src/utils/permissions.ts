// src/utils/permissions.ts
import { User } from '../types';

export const isAdmin = (user: User | null): boolean => {
  const result = user?.rol === 'admin';
  console.log('isAdmin check:', { userRol: user?.rol, result });  // ← DEBUG
  return result;
};

export const canDelete = (user: User | null): boolean => {
  return isAdmin(user);
};

export const canManageProducts = (user: User | null): boolean => {
  return isAdmin(user);
};

// src/utils/permissions.ts
export const usePermissions = (user: User | null) => ({
  isAdmin: isAdmin(user),
  canDelete: isAdmin(user),
  canCreate: isAdmin(user),     // ← NUEVO
  canEdit: isAdmin(user),       // ← NUEVO  
  canCut: isAdmin(user),        // ← NUEVO
  canManageProducts: isAdmin(user),
});