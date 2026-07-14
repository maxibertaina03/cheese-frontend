// src/hooks/useElementos.ts
import { useCallback } from 'react';
import { Elemento, MovimientoElemento } from '../types';
import { apiService } from '../services/api';
import { useColeccion } from '../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../compartido/hooks/useEstadoOperacion';

export const useElementos = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: elementos, refrescar: fetchElementos } = useColeccion<Elemento>(
    () => apiService.getElementos(apiFetch),
    { mensajeError: 'Error al cargar elementos', onError: setError }
  );

  // Trae los movimientos de un elemento puntual y los devuelve (no los guarda en estado).
  const fetchMovimientos = useCallback(
    async (elementoId: number): Promise<MovimientoElemento[]> => {
      try {
        const response = await apiService.getElementoMovimientos(apiFetch, elementoId);
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

  const createElemento = (data: { nombre: string; cantidadTotal: number; descripcion?: string | null }) =>
    ejecutar(() => apiService.createElemento(apiFetch, data), {
      mensajeExito: 'Elemento creado correctamente',
      mensajeErrorDefault: 'Error al crear elemento',
      alTerminar: fetchElementos,
    });

  const updateElemento = (
    elementoId: number,
    data: { nombre?: string; descripcion?: string | null; precioUnitario?: number; esVendible?: boolean }
  ) =>
    ejecutar(() => apiService.updateElemento(apiFetch, elementoId, data), {
      mensajeExito: 'Elemento actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar elemento',
      alTerminar: fetchElementos,
    });

  const deleteElemento = (elementoId: number) =>
    ejecutar(() => apiService.deleteElemento(apiFetch, elementoId), {
      mensajeExito: 'Elemento eliminado correctamente',
      mensajeErrorDefault: 'Error al eliminar elemento',
      alTerminar: fetchElementos,
    });

  const registrarIngreso = (elementoId: number, data: { cantidad: number; observaciones?: string | null }) =>
    ejecutar(() => apiService.elementoIngreso(apiFetch, elementoId, data), {
      mensajeExito: 'Ingreso registrado correctamente',
      mensajeErrorDefault: 'Error al registrar ingreso',
      alTerminar: fetchElementos,
    });

  const registrarEgreso = (
    elementoId: number,
    data: { cantidad: number; motivoId?: number | null; observaciones?: string | null }
  ) =>
    ejecutar(() => apiService.elementoEgreso(apiFetch, elementoId, data), {
      mensajeExito: 'Egreso registrado correctamente',
      mensajeErrorDefault: 'Error al registrar egreso',
      alTerminar: fetchElementos,
    });

  return {
    elementos,
    loading,
    error,
    success,
    fetchElementos,
    fetchMovimientos,
    createElemento,
    updateElemento,
    deleteElemento,
    registrarIngreso,
    registrarEgreso,
    setError,
    setSuccess,
  };
};
