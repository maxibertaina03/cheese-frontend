// src/hooks/useInventory.ts
import { useState, useCallback } from 'react';
import { Unidad, Producto, Motivo } from '../types';
import { apiService } from '../services/api';

export const useInventory = (apiFetch: any) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUnidades = useCallback(async () => {
    try {
      const response = await apiService.getUnidades(apiFetch);
      const data = await response.json();
      setUnidades(data);
    } catch (error) {
      console.error('Error al cargar unidades:', error);
    }
  }, [apiFetch]);

  const fetchProductos = useCallback(async () => {
    try {
      const response = await apiService.getProductos(apiFetch);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  }, [apiFetch]);

  const fetchMotivos = useCallback(async () => {
    try {
      const response = await apiService.getMotivos(apiFetch);
      const data = await response.json();
      setMotivos(data);
    } catch (error) {
      console.error('Error al cargar motivos:', error);
    }
  }, [apiFetch]);

  const createUnidad = async (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
  }) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.createUnidad(apiFetch, data);

      if (response.ok) {
        setSuccess('Unidad ingresada correctamente');
        await fetchUnidades();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al ingresar unidad');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateUnidad = async (unidadId: number, observaciones: string) => {
    try {
      const response = await apiService.updateUnidad(apiFetch, unidadId, observaciones);

      if (response.ok) {
        setSuccess('Unidad actualizada correctamente');
        await fetchUnidades();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar unidad');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    }
  };

  const createParticion = async (
    unidadId: number,
    peso: number,
    observacionesCorte: string,
    motivoId: number | null
  ) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.createParticion(apiFetch, unidadId, {
        peso,
        observacionesCorte,
        motivoId,
      });

      if (response.ok) {
        setSuccess(`Corte registrado: ${peso}g`);
        await fetchUnidades();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al registrar el corte');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

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
    createParticion,
    clearMessages,
    setError,
    setSuccess,
  };
};