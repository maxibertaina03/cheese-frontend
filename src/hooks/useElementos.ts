// src/hooks/useElementos.ts
import { useCallback, useState } from 'react';
import { Elemento, MovimientoElemento } from '../types';
import { apiService } from '../services/api';

export const useElementos = (apiFetch: any) => {
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchElementos = useCallback(async () => {
    try {
      const response = await apiService.getElementos(apiFetch);
      const data = await response.json();
      
      // 🔧 FIX: Validar que data sea un array
      if (Array.isArray(data)) {
        setElementos(data);
      } else {
        console.error('API devolvió datos no válidos:', data);
        setElementos([]); // ← Mantener como array vacío
        setError('Error: formato de datos inválido');
      }
    } catch (err) {
      console.error('Error al cargar elementos:', err);
      setElementos([]); // 🔧 FIX: En caso de error, mantener array vacío
      setError('Error al cargar elementos');
    }
  }, [apiFetch]);

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
        return Array.isArray(data) ? data : []; // 🔧 FIX: Validar array
      } catch (err) {
        setError('Error de conexión con el servidor');
        return [];
      }
    },
    [apiFetch]
  );

  const createElemento = async (data: {
    nombre: string;
    cantidadTotal: number;
    descripcion?: string | null;
  }) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createElemento(apiFetch, data);
      if (response.ok) {
        setSuccess('Elemento creado correctamente');
        await fetchElementos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear elemento');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateElemento = async (elementoId: number, data: { nombre: string; descripcion?: string | null }) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateElemento(apiFetch, elementoId, data);
      if (response.ok) {
        setSuccess('Elemento actualizado correctamente');
        await fetchElementos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al actualizar elemento');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteElemento = async (elementoId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteElemento(apiFetch, elementoId);
      if (response.ok) {
        setSuccess('Elemento eliminado correctamente');
        await fetchElementos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al eliminar elemento');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const registrarIngreso = async (elementoId: number, data: { cantidad: number; observaciones?: string | null }) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.elementoIngreso(apiFetch, elementoId, data);
      if (response.ok) {
        setSuccess('Ingreso registrado correctamente');
        await fetchElementos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al registrar ingreso');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const registrarEgreso = async (
    elementoId: number,
    data: { cantidad: number; motivoId?: number | null; observaciones?: string | null }
  ) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.elementoEgreso(apiFetch, elementoId, data);
      if (response.ok) {
        setSuccess('Egreso registrado correctamente');
        await fetchElementos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al registrar egreso');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

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