// src/hooks/useProveedores.ts
import { Proveedor } from '../types';
import { apiService } from '../services/api';
import { useColeccion } from '../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../compartido/hooks/useEstadoOperacion';

export const useProveedores = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: proveedores, refrescar: fetchProveedores } = useColeccion<Proveedor>(
    () => apiService.getProveedores(apiFetch),
    { mensajeError: 'Error al cargar proveedores', onError: setError }
  );

  const createProveedor = async (data: Partial<Proveedor>) => {
    const resultado = await ejecutar<Proveedor>(() => apiService.createProveedor(apiFetch, data), {
      mensajeExito: 'Proveedor creado correctamente',
      mensajeErrorDefault: 'Error al crear proveedor',
      alTerminar: fetchProveedores,
    });
    return resultado.success
      ? { success: true, proveedor: resultado.data }
      : { success: false };
  };

  const updateProveedor = (id: number, data: Partial<Proveedor>) =>
    ejecutar(() => apiService.updateProveedor(apiFetch, id, data), {
      mensajeExito: 'Proveedor actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar proveedor',
      alTerminar: fetchProveedores,
    });

  const deleteProveedor = (id: number) =>
    ejecutar(() => apiService.deleteProveedor(apiFetch, id), {
      mensajeExito: 'Proveedor eliminado correctamente',
      mensajeErrorDefault: 'Error al eliminar proveedor',
      alTerminar: fetchProveedores,
    });

  return {
    proveedores,
    loading,
    error,
    success,
    fetchProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    setError,
    setSuccess,
  };
};
