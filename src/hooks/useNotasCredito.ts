// src/hooks/useNotasCredito.ts
import { useCallback, useState } from 'react';
import { NotaCredito, CreateNotaCreditoData } from '../types';
import { apiService } from '../services/api';

export const useNotasCredito = (apiFetch: any) => {
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotasCredito = useCallback(async () => {
    try {
      const response = await apiService.getNotasCredito(apiFetch);
      const data = await response.json();
      setNotasCredito(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar notas de crédito:', err);
      setNotasCredito([]);
    }
  }, [apiFetch]);

  const createNotaCredito = async (data: CreateNotaCreditoData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createNotaCredito(apiFetch, data);
      if (response.ok) {
        const nota = (await response.json()) as NotaCredito;
        setSuccess(`Nota de crédito ${nota.serie}-${nota.numero} creada`);
        await fetchNotasCredito();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true, nota };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear la nota de crédito');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { notasCredito, loading, error, success, fetchNotasCredito, createNotaCredito, setError, setSuccess };
};
