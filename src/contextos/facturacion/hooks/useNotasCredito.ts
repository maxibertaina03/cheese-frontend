// src/hooks/useNotasCredito.ts
import { NotaCredito, CreateNotaCreditoData } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useNotasCredito = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: notasCredito, refrescar: fetchNotasCredito } = useColeccion<NotaCredito>(() =>
    apiService.getNotasCredito(apiFetch)
  );

  const createNotaCredito = async (data: CreateNotaCreditoData) => {
    const resultado = await ejecutar<NotaCredito>(() => apiService.createNotaCredito(apiFetch, data), {
      mensajeExito: (nota) => `Nota de crédito ${nota.serie}-${nota.numero} creada`,
      mensajeErrorDefault: 'Error al crear la nota de crédito',
      alTerminar: fetchNotasCredito,
    });
    return resultado.success
      ? { success: true, nota: resultado.data }
      : { success: false };
  };

  return { notasCredito, loading, error, success, fetchNotasCredito, createNotaCredito, setError, setSuccess };
};
