// src/hooks/useInventory.ts
import { Unidad, Producto, Motivo } from '../types';
import { apiService } from '../services/api';
import { useColeccion } from '../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../compartido/hooks/useEstadoOperacion';

export const useInventory = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: unidades, refrescar: fetchUnidades } = useColeccion<Unidad>(() =>
    apiService.getUnidades(apiFetch)
  );
  const { items: productos, refrescar: fetchProductos } = useColeccion<Producto>(() =>
    apiService.getProductos(apiFetch)
  );
  const { items: motivos, refrescar: fetchMotivos } = useColeccion<Motivo>(() =>
    apiService.getMotivos(apiFetch)
  );

  const createUnidad = (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
    fechaElaboracion?: string;
    numeroLote?: string | null;
  }) =>
    ejecutar(() => apiService.createUnidad(apiFetch, data), {
      mensajeExito: 'Unidad ingresada correctamente',
      mensajeErrorDefault: 'Error al ingresar unidad',
      alTerminar: fetchUnidades,
    });

  const updateUnidad = (unidadId: number, observaciones: string) =>
    ejecutar(() => apiService.updateUnidad(apiFetch, unidadId, observaciones), {
      mensajeExito: 'Unidad actualizada correctamente',
      mensajeErrorDefault: 'Error al actualizar unidad',
      alTerminar: fetchUnidades,
    });

  const createParticion = (
    unidadId: number,
    peso: number,
    observacionesCorte: string,
    motivoId: number | null
  ) =>
    ejecutar(
      () => apiService.createParticion(apiFetch, unidadId, { peso, observacionesCorte, motivoId }),
      {
        mensajeExito: `Corte registrado: ${peso}g`,
        mensajeErrorDefault: 'Error al registrar el corte',
        alTerminar: fetchUnidades,
      }
    );

  const deleteUnidad = (unidadId: number) =>
    ejecutar(() => apiService.deleteUnidad(apiFetch, unidadId), {
      mensajeExito: 'Unidad eliminada correctamente',
      mensajeErrorDefault: 'Error al eliminar unidad',
      alTerminar: fetchUnidades,
    });

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    unidades,
    productos,
    motivos,
    loading,
    error,
    success,
    fetchUnidades,
    fetchProductos,
    fetchMotivos,
    createUnidad,
    updateUnidad,
    deleteUnidad,
    createParticion,
    clearMessages,
    setError,
    setSuccess,
  };
};
