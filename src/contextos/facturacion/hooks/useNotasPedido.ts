// src/hooks/useNotasPedido.ts
import { NotaPedido, CreateNotaPedidoData } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useNotasPedido = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: notas, refrescar: fetchNotas } = useColeccion<NotaPedido>(() =>
    apiService.getNotasPedido(apiFetch)
  );

  const createNota = async (data: CreateNotaPedidoData) => {
    const resultado = await ejecutar<NotaPedido>(() => apiService.createNotaPedido(apiFetch, data), {
      mensajeExito: (nota) => `Nota de pedido ${nota.serie}-${nota.numero} creada`,
      mensajeErrorDefault: 'Error al crear la nota de pedido',
      alTerminar: fetchNotas,
    });
    return resultado.success
      ? { success: true, nota: resultado.data }
      : { success: false };
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
