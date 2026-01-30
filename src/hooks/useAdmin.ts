// src/hooks/useAdmin.ts
import { useState, useCallback } from 'react';
import { Producto, CreateProductoData } from '../types';
import { apiService } from '../services/api';

export const useAdmin = (apiFetch: any) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProductos = useCallback(async () => {
    try {
      const response = await apiService.getProductos(apiFetch);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  }, [apiFetch]);

  const createProducto = async (data: CreateProductoData) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.createProducto(apiFetch, data);
      if (response.ok) {
        setSuccess('Producto creado correctamente');
        await fetchProductos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear producto');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateProducto = async (id: number, data: Partial<CreateProductoData>) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.updateProducto(apiFetch, id, data);
      if (response.ok) {
        setSuccess('Producto actualizado correctamente');
        await fetchProductos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar producto');
        return { success: false };
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteProducto = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.deleteProducto(apiFetch, id);
      if (response.ok) {
        setSuccess('Producto eliminado correctamente');
        await fetchProductos();
        setTimeout(() => setSuccess(''), 3000);
        return { success: true };
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar producto');
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
    productos,
    loading,
    error,
    success,
    fetchProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    setError,
    setSuccess,
  };
};