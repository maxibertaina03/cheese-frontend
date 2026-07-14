// src/contextos/facturacion/hooks/useRecibos.ts
import { Recibo, CreateReciboData } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useRecibos = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: recibos, refrescar: fetchRecibos } = useColeccion<Recibo>(() =>
    apiService.getRecibos(apiFetch)
  );

  const createRecibo = async (data: CreateReciboData) => {
    const resultado = await ejecutar<Recibo>(() => apiService.createRecibo(apiFetch, data), {
      mensajeExito: (recibo) => `Recibo ${recibo.serie}-${recibo.numero} creado`,
      mensajeErrorDefault: 'Error al crear el recibo',
      alTerminar: fetchRecibos,
    });
    return resultado.success
      ? { success: true, recibo: resultado.data }
      : { success: false };
  };

  return { recibos, loading, error, success, fetchRecibos, createRecibo, setError, setSuccess };
};
