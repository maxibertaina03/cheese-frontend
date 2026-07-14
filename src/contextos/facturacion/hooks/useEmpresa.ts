// src/contextos/facturacion/hooks/useEmpresa.ts
import { useCallback, useState } from 'react';
import { Empresa } from '../../../types';
import { apiService } from '../../../services/api';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useEmpresa = (apiFetch: any) => {
  // La empresa es un singleton (un objeto, no una colección), por eso no usa useColeccion.
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

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
    const resultado = await ejecutar<Empresa>(() => apiService.updateEmpresa(apiFetch, data), {
      mensajeExito: 'Datos de la empresa guardados correctamente',
      mensajeErrorDefault: 'Error al guardar datos de la empresa',
    });
    if (resultado.success && resultado.data) setEmpresa(resultado.data);
    return { success: resultado.success };
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
