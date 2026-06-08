// src/hooks/useIndumentaria.ts
import { useCallback, useState } from 'react';
import { Indumentaria, MovimientoIndumentaria } from '../types';
import { apiService } from '../services/api';

export const useIndumentaria = (apiFetch: any) => {
  const [indumentaria, setIndumentaria] = useState<Indumentaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchIndumentaria = useCallback(async () => {
    try {
      const response = await apiService.getIndumentaria(apiFetch);
      const data = await response.json();
      if (Array.isArray(data)) {
        setIndumentaria(data);
      } else {
        console.error('API devolvió datos no válidos:', data);
        setIndumentaria([]);
        setError('Error: formato de datos inválido');
      }
    } catch (err) {
      console.error('Error al cargar indumentaria:', err);
      setIndumentaria([]);
      setError('Error al cargar indumentaria');
    }
  }, [apiFetch]);

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
    [apiFetch]
  );

  const createIndumentaria = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createIndumentaria(apiFetch, data);
      if (response.ok) {
        setSuccess('Prenda creada correctamente');
        await fetchIndumentaria();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear prenda');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateIndumentaria = async (id: number, data: any) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateIndumentaria(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Prenda actualizada correctamente');
        await fetchIndumentaria();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al actualizar prenda');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteIndumentaria = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteIndumentaria(apiFetch, id);
      if (response.ok) {
        setSuccess('Prenda eliminada correctamente');
        await fetchIndumentaria();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al eliminar prenda');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const registrarIngreso = async (
    id: number,
    data: { cantidad: number; proveedorId?: number | null; documentoReferencia?: string | null; observaciones?: string | null }
  ) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.indumentariaIngreso(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Ingreso registrado correctamente');
        await fetchIndumentaria();
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
    id: number,
    data: { cantidad: number; destino: string; observaciones?: string | null }
  ) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.indumentariaEgreso(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Entrega registrada correctamente');
        await fetchIndumentaria();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al registrar entrega');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const registrarAjuste = async (
    id: number,
    data: { cantidad: number; motivo: string; observaciones?: string | null }
  ) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.indumentariaAjuste(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Ajuste registrado correctamente');
        await fetchIndumentaria();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al registrar ajuste');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

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
