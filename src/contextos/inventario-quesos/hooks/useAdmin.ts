// src/contextos/inventario-quesos/hooks/useAdmin.ts
import { Producto, CreateProductoData } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useAdmin = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: productos, refrescar: fetchProductos } = useColeccion<Producto>(() =>
    apiService.getProductos(apiFetch)
  );

  const createProducto = (data: CreateProductoData) =>
    ejecutar(() => apiService.createProducto(apiFetch, data), {
      mensajeExito: 'Producto creado correctamente',
      mensajeErrorDefault: 'Error al crear producto',
      alTerminar: fetchProductos,
    });

  const updateProducto = (id: number, data: Partial<CreateProductoData>) =>
    ejecutar(() => apiService.updateProducto(apiFetch, id, data), {
      mensajeExito: 'Producto actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar producto',
      alTerminar: fetchProductos,
    });

  const deleteProducto = (id: number) =>
    ejecutar(() => apiService.deleteProducto(apiFetch, id), {
      mensajeExito: 'Producto eliminado correctamente',
      mensajeErrorDefault: 'Error al eliminar producto',
      alTerminar: fetchProductos,
    });

  // Solo el precio de venta por unidad (pestaña Precios de Facturación).
  const guardarPrecioUnitario = (id: number, precioUnitario: number | null) =>
    ejecutar(() => apiService.updateProductoPrecioUnitario(apiFetch, id, precioUnitario), {
      mensajeExito: 'Precio actualizado correctamente',
      mensajeErrorDefault: 'Error al actualizar el precio',
      alTerminar: fetchProductos,
    });

  return {
    productos,
    loading,
    error,
    success,
    fetchProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    guardarPrecioUnitario,
    setError,
    setSuccess,
  };
};
