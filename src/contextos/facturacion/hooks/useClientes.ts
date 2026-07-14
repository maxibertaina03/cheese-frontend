// src/contextos/facturacion/hooks/useClientes.ts
import { Cliente } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useClientes = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const {
    items: clientes,
    refrescar: fetchClientes,
  } = useColeccion<Cliente>(() => apiService.getClientes(apiFetch), {
    mensajeError: 'Error al cargar clientes',
    onError: setError,
  });

  const createCliente = (data: Partial<Cliente>) =>
    ejecutar(() => apiService.createCliente(apiFetch, data), {
      mensajeExito: 'Cliente creado correctamente',
      mensajeErrorDefault: 'Error al crear cliente',
      alTerminar: fetchClientes,
    });

  const updateCliente = (id: number, data: Partial<Cliente>) =>
    ejecutar(() => apiService.updateCliente(apiFetch, id, data), {
      mensajeExito: 'Cliente actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar cliente',
      alTerminar: fetchClientes,
    });

  const deleteCliente = (id: number) =>
    ejecutar(() => apiService.deleteCliente(apiFetch, id), {
      mensajeExito: 'Cliente eliminado correctamente',
      mensajeErrorDefault: 'Error al eliminar cliente',
      alTerminar: fetchClientes,
    });

  return {
    clientes,
    loading,
    error,
    success,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    setError,
    setSuccess,
  };
};
