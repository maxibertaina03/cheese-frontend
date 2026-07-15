// src/contextos/inventario-quesos/componentes/InventarioContenedor.tsx
//
// Contenedor del bounded context de inventario de quesos: rinde sus dos vistas
// (inventario e historial), sus modales (alta, corte, edición, baja, stock al
// lunes) y las exportaciones a PDF.
//
// Los hooks del contexto (useInventory / useHistorial) se inyectan desde App
// porque su estado lo consumen además el Header (stats), el Dashboard y
// facturación. Cuando se introduzca un provider para este contexto, el
// contenedor pasará a leerlos del contexto sin tocar el resto del archivo.
import React, { useState } from 'react';
import { StockAlCorteResponse, TipoQueso, Unidad, User } from '../../../types';
import { apiService } from '../../../services/api';
import { descargarBlob } from '../../../compartido/utils/descargas';
import { exportHistorialPdfLocal, exportInventarioPdfLocal } from '../../../utils/pdfExport';
import { DeleteConfirmModal } from '../../../components/Admin/DeleteConfirmModal';
import { useInventory } from '../hooks/useInventory';
import { useHistorial } from '../hooks/useHistorial';
import { InventoryForm } from './InventoryForm';
import { InventoryList } from './InventoryList';
import { HistorialView } from './HistorialView';
import { EditModal } from './EditModal';
import { CutModal } from './CutModal';
import { StockAlLunesModal } from './StockAlLunesModal';

interface Props {
  // Vista activa del contexto; null cuando el usuario está en otra sección.
  vista: 'inventario' | 'historial' | null;
  user: User;
  apiFetch: any;
  tiposQueso: TipoQueso[];
  inventario: ReturnType<typeof useInventory>;
  historial: ReturnType<typeof useHistorial>;
  showForm: boolean;
  onCloseForm: () => void;
  onVolver: () => void;
}

// Calcula el inicio (00:00) del lunes más reciente en la zona horaria del navegador.
// Si hoy es lunes, devuelve hoy a las 00:00.
const getUltimoLunes = (): Date => {
  const now = new Date();
  const diasDesdeLunes = (now.getDay() + 6) % 7; // 0=domingo => 6, 1=lunes => 0, ...
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diasDesdeLunes, 0, 0, 0, 0);
};

export const InventarioContenedor: React.FC<Props> = ({
  vista,
  user,
  apiFetch,
  tiposQueso,
  inventario,
  historial,
  showForm,
  onCloseForm,
  onVolver,
}) => {
  const {
    unidades,
    productos,
    motivos,
    loading,
    createUnidad,
    updateUnidad,
    createParticion,
    deleteUnidad,
    setError,
    setSuccess,
  } = inventario;

  const {
    historialFiltrado,
    filtroHistorial,
    busquedaHistorial,
    fechaInicio,
    fechaFin,
    tipoQuesoFiltro,
    statsHistorial,
    setFiltroHistorial,
    setBusquedaHistorial,
    setFechaInicio,
    setFechaFin,
    setTipoQuesoFiltro,
    historialUnidades,
    deleteUnidadPermanente,
  } = historial;

  const [exportingInventarioPdf, setExportingInventarioPdf] = useState(false);
  const [exportingHistorialPdf, setExportingHistorialPdf] = useState(false);

  // Listado del stock al último lunes (reconstrucción histórica)
  const [stockLunesData, setStockLunesData] = useState<StockAlCorteResponse | null>(null);
  const [loadingStockLunes, setLoadingStockLunes] = useState(false);
  const [showStockLunesModal, setShowStockLunesModal] = useState(false);
  const [stockLunesFecha, setStockLunesFecha] = useState<string | null>(null);
  const [imprimiendoStockLunes, setImprimiendoStockLunes] = useState(false);

  const [unidadEliminando, setUnidadEliminando] = useState<Unidad | null>(null);
  const [showCutModal, setShowCutModal] = useState(false);
  const [unidadParaCortar, setUnidadParaCortar] = useState<Unidad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unidadParaEditar, setUnidadParaEditar] = useState<Unidad | null>(null);

  const handleCreateUnidad = async (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
    fechaElaboracion: string;
    numeroLote: string | null;
  }) => {
    const result = await createUnidad(data);
    if (result.success) onCloseForm();
    return result;
  };

  const confirmDeleteUnidad = async () => {
    if (!unidadEliminando) return;
    const result = await deleteUnidad(unidadEliminando.id);
    if (result.success) setUnidadEliminando(null);
  };

  const handleCloseCutModal = () => {
    setShowCutModal(false);
    setUnidadParaCortar(null);
  };

  const handleCut = async (peso: number, observaciones: string, motivoId: number | null) => {
    if (!unidadParaCortar) return;
    const result = await createParticion(unidadParaCortar.id, peso, observaciones, motivoId);
    if (result.success) handleCloseCutModal();
  };

  const handleEgresoTotal = async (motivoId: number | null) => {
    if (!unidadParaCortar) return;
    const result = await createParticion(
      unidadParaCortar.id,
      unidadParaCortar.pesoActual,
      'Corte final – queso agotado',
      motivoId
    );
    if (result.success) handleCloseCutModal();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUnidadParaEditar(null);
  };

  const handleSaveEdit = async (observaciones: string) => {
    if (!unidadParaEditar) return;
    const result = await updateUnidad(unidadParaEditar.id, observaciones);
    if (result.success) handleCloseEditModal();
  };

  const getStockActualProducto = (productoId: number) =>
    unidades.filter((u) => u.producto?.id === productoId && u.activa).length;

  const getUnidadesAgotadasProducto = (productoId: number) =>
    historialUnidades.filter((u) => u.producto?.id === productoId && !u.activa).length;

  const getPesoVendidoProducto = (productoId: number) =>
    historialUnidades
      .filter((u) => u.producto?.id === productoId && !u.activa)
      .reduce((sum, u) => sum + Number(u.pesoInicial), 0);

  const handleListadoStockLunes = async () => {
    try {
      setLoadingStockLunes(true);
      setShowStockLunesModal(true);
      setStockLunesData(null);

      const fecha = getUltimoLunes().toISOString();
      setStockLunesFecha(fecha);
      const response = await apiService.getStockAlCorte(apiFetch, fecha);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const data: StockAlCorteResponse = await response.json();
      setStockLunesData(data);
    } catch (error) {
      console.error('Error al obtener el stock al lunes:', error);
      setShowStockLunesModal(false);
      setError('No se pudo calcular el stock al último lunes.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoadingStockLunes(false);
    }
  };

  const handleImprimirStockLunes = async () => {
    const fecha = stockLunesFecha ?? getUltimoLunes().toISOString();
    const filename = `stock_al_lunes_${fecha.slice(0, 10)}.pdf`;

    try {
      setImprimiendoStockLunes(true);
      const response = await apiService.downloadStockLunesPdf(apiFetch, fecha);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      descargarBlob(blob, filename);
      setSuccess('PDF del stock al lunes generado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al imprimir el stock al lunes:', error);
      setError('No se pudo generar el PDF del stock al lunes.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setImprimiendoStockLunes(false);
    }
  };

  const handleExportInventarioPdf = async (
    params: { search?: string; tipoQuesoId?: number; searchObservaciones?: 'true' | 'false' },
    visibleRows: Unidad[]
  ) => {
    const filename = `inventario_${new Date().toISOString().slice(0, 10)}.pdf`;

    try {
      setExportingInventarioPdf(true);
      const response = await apiService.downloadInventarioPdf(apiFetch, params);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      descargarBlob(blob, filename);
      setSuccess('PDF de inventario exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al exportar inventario:', error);
      exportInventarioPdfLocal(visibleRows, filename);
      setError('El backend no devolvio el PDF. Se genero una copia local con los datos visibles.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setExportingInventarioPdf(false);
    }
  };

  const handleExportHistorialPdf = async (
    params: {
      search?: string;
      tipoQuesoId?: number;
      estado?: 'todos' | 'activos' | 'agotados';
      fechaInicio?: string;
      fechaFin?: string;
    },
    visibleRows: Unidad[]
  ) => {
    const suffix =
      params.fechaInicio && params.fechaFin
        ? `${params.fechaInicio}_${params.fechaFin}`
        : new Date().toISOString().slice(0, 10);
    const filename = `historial_${suffix}.pdf`;

    try {
      setExportingHistorialPdf(true);
      const response = await apiService.downloadHistorialPdf(apiFetch, params);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      descargarBlob(blob, filename);
      setSuccess('PDF de historial exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al exportar historial:', error);
      exportHistorialPdfLocal(visibleRows, filename);
      setError('El backend no devolvio el PDF. Se genero una copia local con los datos visibles.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setExportingHistorialPdf(false);
    }
  };

  return (
    <>
      {vista === 'inventario' && (
        <>
          {showForm && (
            <InventoryForm
              productos={productos}
              motivos={motivos}
              loading={loading}
              onSubmit={handleCreateUnidad}
              onClose={onCloseForm}
            />
          )}

          <InventoryList
            unidades={unidades.filter((u) => u.activa)}
            tiposQueso={tiposQueso}
            user={user}
            onEdit={(unidad) => {
              setUnidadParaEditar(unidad);
              setShowEditModal(true);
            }}
            onCut={(unidad) => {
              setUnidadParaCortar(unidad);
              setShowCutModal(true);
            }}
            onDelete={setUnidadEliminando}
            onExportPdf={handleExportInventarioPdf}
            exportingPdf={exportingInventarioPdf}
            onListadoStockLunes={handleListadoStockLunes}
            loadingStockLunes={loadingStockLunes}
          />
        </>
      )}

      {vista === 'historial' && (
        <HistorialView
          user={user}
          unidades={historialFiltrado}
          tiposQueso={tiposQueso}
          stats={statsHistorial}
          filtroHistorial={filtroHistorial}
          busquedaHistorial={busquedaHistorial}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          tipoQuesoFiltro={tipoQuesoFiltro}
          onSetFiltro={setFiltroHistorial}
          onSetBusqueda={setBusquedaHistorial}
          onSetFechaInicio={setFechaInicio}
          onSetFechaFin={setFechaFin}
          onSetTipoQueso={setTipoQuesoFiltro}
          getStockActual={getStockActualProducto}
          getUnidadesAgotadas={getUnidadesAgotadasProducto}
          getPesoVendido={getPesoVendidoProducto}
          onDeleteUnidad={deleteUnidadPermanente}
          onExportPdf={handleExportHistorialPdf}
          exportingPdf={exportingHistorialPdf}
          onVolver={onVolver}
        />
      )}

      {/* Modales del contexto (se abren desde la vista de inventario) */}
      {showEditModal && (
        <EditModal unidad={unidadParaEditar} onClose={handleCloseEditModal} onSave={handleSaveEdit} />
      )}

      {showStockLunesModal && (
        <StockAlLunesModal
          data={stockLunesData}
          loading={loadingStockLunes}
          onClose={() => setShowStockLunesModal(false)}
          onImprimir={handleImprimirStockLunes}
          imprimiendo={imprimiendoStockLunes}
        />
      )}

      {showCutModal && (
        <CutModal
          unidad={unidadParaCortar}
          productos={productos}
          motivos={motivos}
          loading={loading}
          onClose={handleCloseCutModal}
          onCut={handleCut}
          onEgresoTotal={handleEgresoTotal}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!unidadEliminando}
        title="Eliminar Unidad"
        message="¿Estás seguro de que deseas eliminar esta unidad del inventario?"
        itemName={
          unidadEliminando ? `${unidadEliminando.producto.nombre} (ID: #${unidadEliminando.id})` : undefined
        }
        onClose={() => setUnidadEliminando(null)}
        onConfirm={confirmDeleteUnidad}
        loading={loading}
      />
    </>
  );
};
