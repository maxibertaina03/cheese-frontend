// src/hooks/useClientes.ts
import { useCallback, useState } from 'react';
import { Cliente } from '../types';
import { apiService } from '../services/api';

export const useClientes = (apiFetch: any) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchClientes = useCallback(async () => {
    try {
      const response = await apiService.getClientes(apiFetch);
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setClientes([]);
      setError('Error al cargar clientes');
    }
  }, [apiFetch]);

  const createCliente = async (data: Partial<Cliente>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createCliente(apiFetch, data);
      if (response.ok) {
        setSuccess('Cliente creado correctamente');
        await fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear cliente');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateCliente = async (id: number, data: Partial<Cliente>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateCliente(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Cliente actualizado correctamente');
        await fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al actualizar cliente');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteCliente = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteCliente(apiFetch, id);
      if (response.ok) {
        setSuccess('Cliente eliminado correctamente');
        await fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al eliminar cliente');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    clientes,
    loading,
    error,
    success,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    setError,
    setSuccess,
  };
};
