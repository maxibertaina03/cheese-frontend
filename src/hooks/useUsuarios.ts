// src/hooks/useUsuarios.ts
import { apiService } from '../services/api';
import { useColeccion } from '../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../compartido/hooks/useEstadoOperacion';

export type Modulo = 'quesos' | 'elementos' | 'indumentaria' | 'dashboard' | 'historial' | 'facturacion';

export interface Usuario {
  id: number;
  username: string;
  rol: 'admin' | 'usuario';
  permisos: Modulo[];
  createdAt: string;
}

export const useUsuarios = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: usuarios, refrescar: fetchUsuarios } = useColeccion<Usuario>(() =>
    apiService.getUsuarios(apiFetch)
  );

  const createUsuario = (data: {
    username: string;
    password: string;
    rol: 'admin' | 'usuario';
    permisos?: Modulo[];
  }) =>
    ejecutar(() => apiService.createUsuario(apiFetch, data), {
      mensajeExito: 'Usuario creado correctamente',
      mensajeErrorDefault: 'Error al crear usuario',
      alTerminar: fetchUsuarios,
    });

  const updateUsuario = (id: number, data: Partial<Usuario>) =>
    ejecutar(() => apiService.updateUsuario(apiFetch, id, data), {
      mensajeExito: 'Usuario actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar usuario',
      alTerminar: fetchUsuarios,
    });

  const deleteUsuario = (id: number) =>
    ejecutar(() => apiService.deleteUsuario(apiFetch, id), {
      mensajeExito: 'Usuario eliminado correctamente',
      mensajeErrorDefault: 'Error al eliminar usuario',
      alTerminar: fetchUsuarios,
    });

  return {
    usuarios,
    loading,
    error,
    success,
    fetchUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    setError,
    setSuccess,
  };
};
