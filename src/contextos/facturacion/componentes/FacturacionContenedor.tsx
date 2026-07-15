// src/contextos/facturacion/componentes/FacturacionContenedor.tsx
//
// Contenedor del bounded context de facturación: agrupa sus hooks, la carga
// inicial de datos y los handlers (crear comprobantes, imprimir PDFs, etc.).
// App solo le pasa lo que facturación consume de otros contextos (productos,
// elementos, proveedores y las acciones de precios) y queda como shell.
//
// Se monta siempre (visible o no) para conservar los datos entre navegaciones,
// igual que cuando los hooks vivían en App.
import React, { useEffect, useRef, useState } from 'react';
import {
  User,
  Producto,
  Elemento,
  Proveedor,
  CreateNotaPedidoData,
  CreateReciboData,
  CreateNotaCreditoData,
  NotaParaDevolver,
} from '../../../types';
import { apiService } from '../../../services/api';
import { canAccess } from '../../../utils/permissions';
import { descargarBlob } from '../../../compartido/utils/descargas';
import { Alerts } from '../../../components/Layout/Alerts';
import { useClientes } from '../hooks/useClientes';
import { useEmpresa } from '../hooks/useEmpresa';
import { useNotasPedido } from '../hooks/useNotasPedido';
import { useStockComercial } from '../hooks/useStockComercial';
import { useRecibos } from '../hooks/useRecibos';
import { useNotasCredito } from '../hooks/useNotasCredito';
import { FacturacionView } from './FacturacionView';

interface Props {
  visible: boolean;
  user: User;
  apiFetch: any;
  // Recursos de otros contextos que facturación consume (solo lectura acá)
  productos: Producto[];
  elementos: Elemento[];
  proveedores: Proveedor[];
  // Precios: la edición vive en inventario-quesos (producto) y elementos
  loadingPrecios: boolean;
  errorPrecios: string;
  successPrecios: string;
  onSaveProductoPrecio: (id: number, precioUnitario: number | null) => Promise<{ success: boolean }>;
  onSaveElemento: (
    id: number,
    data: { precioUnitario: number; esVendible: boolean }
  ) => Promise<{ success: boolean }>;
  // Vender descuenta elementos; el dueño de ese estado es App (contexto elementos)
  refrescarElementos: () => Promise<void>;
  // Puente para que admin refresque el stock comercial al crear un producto
  refrescarStockRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const FacturacionContenedor: React.FC<Props> = ({
  visible,
  user,
  apiFetch,
  productos,
  elementos,
  proveedores,
  loadingPrecios,
  errorPrecios,
  successPrecios,
  onSaveProductoPrecio,
  onSaveElemento,
  refrescarElementos,
  refrescarStockRef,
}) => {
  const [errorPdf, setErrorPdf] = useState('');
  const [downloadingReporte, setDownloadingReporte] = useState(false);

  const {
    clientes,
    loading: loadingClientes,
    error: errorClientes,
    success: successClientes,
    fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    setError: setErrorClientes,
  } = useClientes(apiFetch);

  const {
    empresa,
    loading: loadingEmpresa,
    error: errorEmpresa,
    success: successEmpresa,
    fetchEmpresa,
    saveEmpresa,
  } = useEmpresa(apiFetch);

  const {
    notas,
    loading: loadingNotas,
    error: errorNotas,
    success: successNotas,
    fetchNotas,
    createNota,
  } = useNotasPedido(apiFetch);

  const {
    stock: stockComercial,
    movimientos: movimientosStock,
    loading: loadingStock,
    error: errorStock,
    success: successStock,
    fetchStock,
    fetchMovimientos: fetchMovimientosStock,
    ingresar: ingresarStockComercial,
  } = useStockComercial(apiFetch);

  const {
    recibos,
    loading: loadingRecibos,
    error: errorRecibos,
    success: successRecibos,
    fetchRecibos,
    createRecibo,
  } = useRecibos(apiFetch);

  const {
    notasCredito,
    loading: loadingNotasCredito,
    error: errorNotasCredito,
    success: successNotasCredito,
    fetchNotasCredito,
    createNotaCredito,
  } = useNotasCredito(apiFetch);

  // Carga inicial (una sola vez por sesión, si el usuario tiene permiso)
  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current || !canAccess(user, 'facturacion')) return;
    cargado.current = true;
    Promise.all([
      fetchClientes(),
      fetchEmpresa(),
      fetchNotas(),
      fetchStock(),
      fetchMovimientosStock(),
      fetchRecibos(),
      fetchNotasCredito(),
    ]);
  }, [user, fetchClientes, fetchEmpresa, fetchNotas, fetchStock, fetchMovimientosStock, fetchRecibos, fetchNotasCredito]);

  // Puente: admin refresca el stock comercial al crear un producto nuevo
  useEffect(() => {
    if (!refrescarStockRef) return;
    refrescarStockRef.current = fetchStock;
    return () => {
      refrescarStockRef.current = null;
    };
  }, [refrescarStockRef, fetchStock]);

  const reportarErrorPdf = (mensaje: string) => {
    setErrorPdf(mensaje);
    setTimeout(() => setErrorPdf(''), 5000);
  };

  // Precios: al guardar el precio de un producto, refrescar también el stock
  // comercial (el precio se muestra ahí y en la nota).
  const handleSaveProductoPrecio = async (id: number, precioUnitario: number | null) => {
    const result = await onSaveProductoPrecio(id, precioUnitario);
    if (result.success) await fetchStock();
    return result;
  };

  const handleImprimirNota = async (id: number) => {
    try {
      const response = await apiService.downloadNotaPedidoPdf(apiFetch, id);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const nota = notas.find((n) => n.id === id);
      descargarBlob(blob, `nota_pedido_${nota ? `${nota.serie}-${nota.numero}` : id}.pdf`);
    } catch (error) {
      console.error('Error al imprimir la nota de pedido:', error);
      reportarErrorPdf('No se pudo generar el PDF de la nota de pedido.');
    }
  };

  // Crear nota de pedido, refrescar stock/movimientos/elementos y descargar el PDF
  const handleCrearNotaPedido = async (data: CreateNotaPedidoData) => {
    const result = await createNota(data);
    if (result.success && result.nota) {
      await Promise.all([fetchStock(), fetchMovimientosStock(), refrescarElementos()]);
      await handleImprimirNota(result.nota.id);
    }
    return { success: result.success };
  };

  const handleImprimirRecibo = async (id: number) => {
    try {
      const response = await apiService.downloadReciboPdf(apiFetch, id);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const recibo = recibos.find((r) => r.id === id);
      descargarBlob(blob, `recibo_${recibo ? `${recibo.serie}-${recibo.numero}` : id}.pdf`);
    } catch (error) {
      console.error('Error al imprimir el recibo:', error);
      reportarErrorPdf('No se pudo generar el PDF del recibo.');
    }
  };

  // Crear recibo, refrescar notas (saldos) y descargar el PDF
  const handleCrearRecibo = async (data: CreateReciboData) => {
    const result = await createRecibo(data);
    if (result.success && result.recibo) {
      await fetchNotas();
      await handleImprimirRecibo(result.recibo.id);
    }
    return { success: result.success };
  };

  // Traer una nota de pedido con sus ítems para devolver
  const handleFetchNotaParaDevolver = async (notaPedidoId: number): Promise<NotaParaDevolver | null> => {
    try {
      const response = await apiService.getNotaParaDevolver(apiFetch, notaPedidoId);
      if (!response.ok) return null;
      return (await response.json()) as NotaParaDevolver;
    } catch (error) {
      console.error('Error al traer la nota para devolver:', error);
      return null;
    }
  };

  const handleImprimirNotaCredito = async (id: number) => {
    try {
      const response = await apiService.downloadNotaCreditoPdf(apiFetch, id);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const nc = notasCredito.find((n) => n.id === id);
      descargarBlob(blob, `nota_credito_${nc ? `${nc.serie}-${nc.numero}` : id}.pdf`);
    } catch (error) {
      console.error('Error al imprimir la nota de crédito:', error);
      reportarErrorPdf('No se pudo generar el PDF de la nota de crédito.');
    }
  };

  // Crear nota de crédito, refrescar stock/notas/elementos y descargar el PDF
  const handleCrearNotaCredito = async (data: CreateNotaCreditoData) => {
    const result = await createNotaCredito(data);
    if (result.success && result.nota) {
      await Promise.all([fetchNotas(), fetchStock(), fetchMovimientosStock(), refrescarElementos()]);
      await handleImprimirNotaCredito(result.nota.id);
    }
    return { success: result.success };
  };

  // Descargar el PDF del reporte de ventas
  const handleDescargarReportePdf = async (desde: string, hasta: string) => {
    try {
      setDownloadingReporte(true);
      const response = await apiService.downloadReporteFacturacionPdf(apiFetch, desde, hasta);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      descargarBlob(blob, `reporte_ventas_${desde}_${hasta}.pdf`);
    } catch (error) {
      console.error('Error al descargar el reporte:', error);
      reportarErrorPdf('No se pudo generar el PDF del reporte.');
    } finally {
      setDownloadingReporte(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Alerts error={errorPdf} success="" />
      <FacturacionView
        clientes={clientes}
        loadingClientes={loadingClientes}
        errorClientes={errorClientes}
        successClientes={successClientes}
        onClearErrorClientes={() => setErrorClientes('')}
        onCreateCliente={createCliente}
        onUpdateCliente={updateCliente}
        onDeleteCliente={deleteCliente}
        empresa={empresa}
        loadingEmpresa={loadingEmpresa}
        errorEmpresa={errorEmpresa}
        successEmpresa={successEmpresa}
        onSaveEmpresa={saveEmpresa}
        productos={productos}
        elementos={elementos}
        loadingPrecios={loadingPrecios}
        errorPrecios={errorPrecios}
        successPrecios={successPrecios}
        onSaveProductoPrecio={handleSaveProductoPrecio}
        onSaveElemento={onSaveElemento}
        notas={notas}
        loadingNotas={loadingNotas}
        errorNotas={errorNotas}
        successNotas={successNotas}
        onCrearNota={handleCrearNotaPedido}
        onImprimirNota={handleImprimirNota}
        stockComercial={stockComercial}
        movimientosStock={movimientosStock}
        proveedores={proveedores}
        loadingStock={loadingStock}
        errorStock={errorStock}
        successStock={successStock}
        onIngresarStock={ingresarStockComercial}
        recibos={recibos}
        loadingRecibos={loadingRecibos}
        errorRecibos={errorRecibos}
        successRecibos={successRecibos}
        onCrearRecibo={handleCrearRecibo}
        onImprimirRecibo={handleImprimirRecibo}
        notasCredito={notasCredito}
        loadingNotasCredito={loadingNotasCredito}
        errorNotasCredito={errorNotasCredito}
        successNotasCredito={successNotasCredito}
        onFetchNotaParaDevolver={handleFetchNotaParaDevolver}
        onCrearNotaCredito={handleCrearNotaCredito}
        onImprimirNotaCredito={handleImprimirNotaCredito}
        apiFetch={apiFetch}
        onDownloadReportePdf={handleDescargarReportePdf}
        downloadingReporte={downloadingReporte}
        esAdmin={user?.rol === 'admin'}
      />
    </>
  );
};
