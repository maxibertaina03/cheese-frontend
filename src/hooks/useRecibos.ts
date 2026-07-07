// src/hooks/useRecibos.ts
import { useCallback, useState } from 'react';
import { Recibo, CreateReciboData } from '../types';
import { apiService } from '../services/api';

export const useRecibos = (apiFetch: any) => {
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRecibos = useCallback(async () => {
    try {
      const response = await apiService.getRecibos(apiFetch);
      const data = await response.json();
      setRecibos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar recibos:', err);
      setRecibos([]);
    }
  }, [apiFetch]);

  const createRecibo = async (data: CreateReciboData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createRecibo(apiFetch, data);
      if (response.ok) {
        const recibo = (await response.json()) as Recibo;
        setSuccess(`Recibo ${recibo.serie}-${recibo.numero} creado`);
        await fetchRecibos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true, recibo };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear el recibo');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { recibos, loading, error, success, fetchRecibos, createRecibo, setError, setSuccess };
};
