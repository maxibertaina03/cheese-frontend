// src/hooks/useStockComercial.ts
import { StockComercialItem, CargaStockComercial, MovimientoStockComercial } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';
import { useEstadoOperacion } from '../../../compartido/hooks/useEstadoOperacion';

export const useStockComercial = (apiFetch: any) => {
  const { cargando: loading, error, exito: success, setError, setExito: setSuccess, ejecutar } =
    useEstadoOperacion();

  const { items: stock, refrescar: fetchStock } = useColeccion<StockComercialItem>(() =>
    apiService.getStockComercial(apiFetch)
  );

  const { items: movimientos, refrescar: fetchMovimientos } = useColeccion<MovimientoStockComercial>(
    () => apiService.getMovimientosStockComercial(apiFetch)
  );

  const ingresar = (productoId: number, data: CargaStockComercial) =>
    ejecutar(() => apiService.ingresarStockComercial(apiFetch, productoId, data), {
      mensajeExito: 'Stock cargado correctamente',
      mensajeErrorDefault: 'Error al cargar stock',
      alTerminar: async () => {
        await Promise.all([fetchStock(), fetchMovimientos()]);
      },
    });

  return {
    stock,
    movimientos,
    loading,
    error,
    success,
    fetchStock,
    fetchMovimientos,
    ingresar,
    setError,
    setSuccess,
  };
};
