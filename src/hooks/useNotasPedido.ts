// src/hooks/useNotasPedido.ts
import { useCallback, useState } from 'react';
import { NotaPedido, CreateNotaPedidoData } from '../types';
import { apiService } from '../services/api';

export const useNotasPedido = (apiFetch: any) => {
  const [notas, setNotas] = useState<NotaPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotas = useCallback(async () => {
    try {
      const response = await apiService.getNotasPedido(apiFetch);
      const data = await response.json();
      setNotas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar notas de pedido:', err);
      setNotas([]);
    }
  }, [apiFetch]);

  const createNota = async (data: CreateNotaPedidoData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createNotaPedido(apiFetch, data);
      if (response.ok) {
        const nota = (await response.json()) as NotaPedido;
        setSuccess(`Nota de pedido ${nota.serie}-${nota.numero} creada`);
        await fetchNotas();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true, nota };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al crear la nota de pedido');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    notas,
    loading,
    error,
    success,
    fetchNotas,
    createNota,
    setError,
    setSuccess,
  };
};
