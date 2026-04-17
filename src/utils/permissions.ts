import { User } from '../types';

export const isAdmin = (user: User | null): boolean => user?.rol === 'admin';

export const canDelete = (user: User | null): boolean => isAdmin(user);

export const canManageProducts = (user: User | null): boolean => isAdmin(user);

export const usePermissions = (user: User | null) => {
  const admin = isAdmin(user);

  return {
    isAdmin: admin,
    canDelete: admin,
    canCreate: admin,
    canEdit: admin,
    canCut: admin,
    canManageProducts: admin,
  };
};
