// src/hooks/useUsuarios.ts
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export interface Usuario {
  id: number;
  username: string;
  rol: 'admin' | 'usuario';
  createdAt: string;
}

export const useUsuarios = (apiFetch: any) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsuarios = useCallback(async () => {
    try {
      const response = await apiService.getUsuarios(apiFetch);
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  }, [apiFetch]);

  const createUsuario = async (data: {
    username: string;
    password: string;
    rol: 'admin' | 'usuario';
  }) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createUsuario(apiFetch, data);
      if (response.ok) {
        setSuccess('Usuario creado correctamente');
        await fetchUsuarios();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear usuario');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateUsuario = async (id: number, data: Partial<Usuario>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateUsuario(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Usuario actualizado correctamente');
        await fetchUsuarios();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar usuario');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteUsuario(apiFetch, id);
      if (response.ok) {
        setSuccess('Usuario eliminado correctamente');
        await fetchUsuarios();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar usuario');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

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