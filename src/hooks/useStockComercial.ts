// src/hooks/useStockComercial.ts
import { useCallback, useState } from 'react';
import { StockComercialItem, CargaStockComercial } from '../types';
import { apiService } from '../services/api';

export const useStockComercial = (apiFetch: any) => {
  const [stock, setStock] = useState<StockComercialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStock = useCallback(async () => {
    try {
      const response = await apiService.getStockComercial(apiFetch);
      const data = await response.json();
      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar stock comercial:', err);
      setStock([]);
    }
  }, [apiFetch]);

  const ingresar = async (productoId: number, data: CargaStockComercial) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.ingresarStockComercial(apiFetch, productoId, data);
      if (response.ok) {
        setSuccess('Stock cargado correctamente');
        await fetchStock();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      }
      const errorData = await response.json();
      setError(errorData.error || 'Error al cargar stock');
      return { success: false };
    } catch (err) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { stock, loading, error, success, fetchStock, ingresar, setError, setSuccess };
};
