// src/hooks/useProveedores.ts
import { useCallback, useState } from 'react';
import { Proveedor } from '../types';
import { apiService } from '../services/api';

export const useProveedores = (apiFetch: any) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProveedores = useCallback(async () => {
    try {
      const response = await apiService.getProveedores(apiFetch);
      const data = await response.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setProveedores([]);
      setError('Error al cargar proveedores');
    }
  }, [apiFetch]);

  const createProveedor = async (data: Partial<Proveedor>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createProveedor(apiFetch, data);
      if (response.ok) {
        setSuccess('Proveedor creado correctamente');
        await fetchProveedores();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear proveedor');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateProveedor = async (id: number, data: Partial<Proveedor>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateProveedor(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Proveedor actualizado correctamente');
        await fetchProveedores();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al actualizar proveedor');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteProveedor = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteProveedor(apiFetch, id);
      if (response.ok) {
        setSuccess('Proveedor eliminado correctamente');
        await fetchProveedores();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al eliminar proveedor');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

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
