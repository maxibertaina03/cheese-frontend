// src/contextos/indumentaria/hooks/useIndumentaria.ts
import { useCallback } from 'react';
import { Indumentaria, MovimientoIndumentaria } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useIndumentaria = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: indumentaria, refrescar: fetchIndumentaria } = useColeccion<Indumentaria>(
    () => apiService.getIndumentaria(apiFetch),
    { mensajeError: 'Error al cargar indumentaria', onError: setError }
  );

  // Trae los movimientos de una prenda puntual y los devuelve (no los guarda en estado).
  const fetchMovimientos = useCallback(
    async (id: number): Promise<MovimientoIndumentaria[]> => {
      try {
        const response = await apiService.getIndumentariaMovimientos(apiFetch, id);
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Error al cargar movimientos');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        setError('Error de conexión con el servidor');
        return [];
      }
    },
    [apiFetch, setError]
  );

  const createIndumentaria = (data: any) =>
    ejecutar(() => apiService.createIndumentaria(apiFetch, data), {
      mensajeExito: 'Prenda creada correctamente',
      mensajeErrorDefault: 'Error al crear prenda',
      alTerminar: fetchIndumentaria,
    });

  const updateIndumentaria = (id: number, data: any) =>
    ejecutar(() => apiService.updateIndumentaria(apiFetch, id, data), {
      mensajeExito: 'Prenda actualizada correctamente',
      mensajeErrorDefault: 'Error al actualizar prenda',
      alTerminar: fetchIndumentaria,
    });

  const deleteIndumentaria = (id: number) =>
    ejecutar(() => apiService.deleteIndumentaria(apiFetch, id), {
      mensajeExito: 'Prenda eliminada correctamente',
      mensajeErrorDefault: 'Error al eliminar prenda',
      alTerminar: fetchIndumentaria,
    });

  const registrarIngreso = (
    id: number,
    data: { cantidad: number; proveedorId?: number | null; documentoReferencia?: string | null; observaciones?: string | null }
  ) =>
    ejecutar(() => apiService.indumentariaIngreso(apiFetch, id, data), {
      mensajeExito: 'Ingreso registrado correctamente',
      mensajeErrorDefault: 'Error al registrar ingreso',
      alTerminar: fetchIndumentaria,
    });

  const registrarEgreso = (
    id: number,
    data: { cantidad: number; destino: string; observaciones?: string | null }
  ) =>
    ejecutar(() => apiService.indumentariaEgreso(apiFetch, id, data), {
      mensajeExito: 'Entrega registrada correctamente',
      mensajeErrorDefault: 'Error al registrar entrega',
      alTerminar: fetchIndumentaria,
    });

  const registrarAjuste = (
    id: number,
    data: { cantidad: number; motivo: string; observaciones?: string | null }
  ) =>
    ejecutar(() => apiService.indumentariaAjuste(apiFetch, id, data), {
      mensajeExito: 'Ajuste registrado correctamente',
      mensajeErrorDefault: 'Error al registrar ajuste',
      alTerminar: fetchIndumentaria,
    });

  return {
    indumentaria,
    loading,
    error,
    success,
    fetchIndumentaria,
    fetchMovimientos,
    createIndumentaria,
    updateIndumentaria,
    deleteIndumentaria,
    registrarIngreso,
    registrarEgreso,
    registrarAjuste,
    setError,
    setSuccess,
  };
};
