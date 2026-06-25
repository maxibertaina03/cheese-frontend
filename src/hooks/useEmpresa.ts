// src/hooks/useEmpresa.ts
import { useCallback, useState } from 'react';
import { Empresa } from '../types';
import { apiService } from '../services/api';

export const useEmpresa = (apiFetch: any) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchEmpresa = useCallback(async () => {
    try {
      const response = await apiService.getEmpresa(apiFetch);
      const data = await response.json();
      setEmpresa(data ?? null);
    } catch (err) {
      console.error('Error al cargar datos de empresa:', err);
      setEmpresa(null);
    }
  }, [apiFetch]);

  const saveEmpresa = async (data: Partial<Empresa>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateEmpresa(apiFetch, data);
      if (response.ok) {
        const saved = await response.json();
        setEmpresa(saved);
        setSuccess('Datos de la empresa guardados correctamente');
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al guardar datos de la empresa');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    empresa,
    loading,
    error,
    success,
    fetchEmpresa,
    saveEmpresa,
    setError,
    setSuccess,
  };
};
