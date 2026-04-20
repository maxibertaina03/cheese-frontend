// src/App.tsx - Versión con Dashboard integrado
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Unidad, TipoQueso } from './types';
import { apiService, createApiFetch } from './services/api';
import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useHistorial } from './hooks/useHistorial';
import { useAdmin } from './hooks/useAdmin';
import { Login } from './components/Auth/Login';
import { Header } from './components/Layout/Header';
import { Alerts } from './components/Layout/Alerts';
import { InventoryForm } from './components/Inventory/InventoryForm';
import { InventoryList } from './components/Inventory/InventoryList';
import { EditModal } from './components/Modals/EditModal';
import { CutModal } from './components/Modals/CutModal';
import { DeleteConfirmModal } from './components/Admin/DeleteConfirmModal';
import { HistorialView } from './components/History/HistorialView';
import { AdminPanel } from './components/Admin/AdminPanel';
import { Dashboard } from './components/Dashboard/Dashboard'; // ✨ NUEVO
import { useUsuarios } from './hooks/useUsuarios';
import { useElementos } from './hooks/useElementos';
import { ElementosView } from './components/Elementos/ElementosView';
import { exportHistorialPdfLocal, exportInventarioPdfLocal } from './utils/pdfExport';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

function App() {
  const { user, setUser, logout, authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [exportingInventarioPdf, setExportingInventarioPdf] = useState(false);
  const [exportingHistorialPdf, setExportingHistorialPdf] = useState(false);
  
  // ✨ ACTUALIZADO: Agregar 'dashboard' como opción
  const [vistaActual, setVistaActual] = useState<'inventario' | 'historial' | 'dashboard' | 'elementos'>('inventario');
  
  const [unidadEliminando, setUnidadEliminando] = useState<Unidad | null>(null);
  
  // Modals state
  const [showCutModal, setShowCutModal] = useState(false);
  const [unidadParaCortar, setUnidadParaCortar] = useState<Unidad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unidadParaEditar, setUnidadParaEditar] = useState<Unidad | null>(null);

  const apiFetch = createApiFetch(user?.token, () => {
    setUser(null);
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
  });
 
  const {
    usuarios,
    loading: loadingUsuarios,
    error: errorUsuarios,
    success: successUsuarios,
    fetchUsuarios,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  } = useUsuarios(apiFetch);

  const {
    unidades,
    productos,
    motivos,
    loading,
    error,
    success,
    fetchUnidades,
    fetchProductos,
    fetchMotivos,
    createUnidad,
    updateUnidad,
    createParticion,
    deleteUnidad,
    setError,
    setSuccess,
  } = useInventory(apiFetch);

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
    fetchHistorial,
  } = useHistorial(apiFetch);

  const {
    productos: productosAdmin,
    loading: loadingAdmin,
    error: errorAdmin,
    success: successAdmin,
    fetchProductos: fetchProductosAdmin,
    createProducto,
    updateProducto,
    deleteProducto,
  } = useAdmin(apiFetch);

  const {
    elementos,
    loading: loadingElementos,
    error: errorElementos,
    success: successElementos,
    fetchElementos,
    fetchMovimientos,
    createElemento,
    updateElemento,
    deleteElemento,
    registrarIngreso,
    registrarEgreso,
  } = useElementos(apiFetch);

  const fetchTiposQueso = useCallback(async () => {
    try {
      const response = await apiFetch(`${process.env.REACT_APP_API_URL}/api/tipos-queso`);
      const data = await response.json();
      setTiposQueso(data);
    } catch (error) {
      console.error('Error al cargar tipos de queso:', error);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (user?.token && !dataLoaded) {
      const fetchData = async () => {
        await Promise.all([
          fetchUnidades(),
          fetchProductos(),
          fetchMotivos(),
          fetchTiposQueso(),
          fetchHistorial(),
          fetchElementos(),
        ]);
      };
      fetchData();
      setDataLoaded(true);
    }
  }, [user, dataLoaded, fetchUnidades, fetchProductos, fetchMotivos, fetchTiposQueso, fetchHistorial, fetchElementos]);
  const historialCargado = useRef(false);

  
  useEffect(() => {
    if (vistaActual === 'historial' && user?.token && dataLoaded) {
      // Solo cargar una vez por visita al historial
      if (!historialCargado.current) {
        fetchHistorial();
        historialCargado.current = true;
      }
    }
    
    // Resetear cuando salimos del historial para poder recargar al volver
    if (vistaActual !== 'historial') {
      historialCargado.current = false;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, user?.token, dataLoaded]);

  const handleOpenAdmin = async () => {
    await Promise.all([
      fetchProductosAdmin(),
      fetchUsuarios(),
    ]);
    setShowAdmin(true);
  };

  const handleDeleteUnidad = (unidad: Unidad) => {
    setUnidadEliminando(unidad);
  };

  const confirmDeleteUnidad = async () => {
    if (!unidadEliminando) return;
    const result = await deleteUnidad(unidadEliminando.id);
    if (result.success) {
      setUnidadEliminando(null);
    }
  };

  const handleOpenCutModal = (unidad: Unidad) => {
    setUnidadParaCortar(unidad);
    setShowCutModal(true);
  };

  const handleCloseCutModal = () => {
    setShowCutModal(false);
    setUnidadParaCortar(null);
  };

  const handleCut = async (peso: number, observaciones: string, motivoId: number | null) => {
    if (!unidadParaCortar) return;
    const result = await createParticion(
      unidadParaCortar.id, 
      peso, 
      observaciones, 
      motivoId
    );
    if (result.success) {
      handleCloseCutModal();
    }
  };

  const handleEgresoTotal = async (motivoId: number | null) => {
    if (!unidadParaCortar) return;
    const result = await createParticion(
      unidadParaCortar.id,
      unidadParaCortar.pesoActual,
      'Corte final – queso agotado',
      motivoId
    );
    if (result.success) {
      handleCloseCutModal();
    }
  };

  const handleOpenEditModal = (unidad: Unidad) => {
    setUnidadParaEditar(unidad);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUnidadParaEditar(null);
  };

  const handleSaveEdit = async (observaciones: string) => {
    if (!unidadParaEditar) return;
    const result = await updateUnidad(unidadParaEditar.id, observaciones);
    if (result.success) {
      handleCloseEditModal();
    }
  };

  const handleCreateUnidad = async (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
  }) => {
    const result = await createUnidad(data);
    if (result.success) {
      setShowForm(false);
    }
    return result;
  };

  const getStockActualProducto = (productoId: number) => {
    return unidades.filter(u => u.producto?.id === productoId && u.activa).length;
  };

  const getUnidadesAgotadasProducto = (productoId: number) => {
    return historialUnidades.filter(u => u.producto?.id === productoId && !u.activa).length;
  };

  const getPesoVendidoProducto = (productoId: number) => {
    return historialUnidades
      .filter(u => u.producto?.id === productoId && !u.activa)
      .reduce((sum, u) => sum + Number(u.pesoInicial), 0);
  };

  // 🔧 FIX: Validar que elementos sea un array antes de usar reduce
  const headerStats =
    vistaActual === 'elementos'
      ? [
          { 
            label: 'Disponibles', 
            value: Array.isArray(elementos) 
              ? elementos.reduce((sum, e) => sum + Number(e.cantidadDisponible || 0), 0)
              : 0
          },
          { 
            label: 'Elementos', 
            value: Array.isArray(elementos) ? elementos.length : 0 
          },
        ]
      : [
          { label: 'Activas', value: unidades.filter(u => u.activa).length },
          { label: 'Productos', value: productos.length },
        ];

  const activeError = vistaActual === 'elementos' ? errorElementos : error;
  const activeSuccess = vistaActual === 'elementos' ? successElementos : success;

  const handleNewIngreso = () => {
    if (vistaActual !== 'inventario') {
      setVistaActual('inventario');
      setShowForm(true);
      return;
    }
    setShowForm(!showForm);
  };

  const handleExportInventarioPdf = async (
    params: {
      search?: string;
      tipoQuesoId?: number;
      searchObservaciones?: 'true' | 'false';
    },
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
      downloadBlob(blob, filename);
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
    const suffix = params.fechaInicio && params.fechaFin
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
      downloadBlob(blob, filename);
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

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verificando sesion...</div>;
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <Header
        user={user}
        title={vistaActual === 'elementos' ? 'Stock de Elementos' : 'Stock de Quesos'}
        subtitle="Las Tres Estrellas"
        stats={headerStats}
        onNewIngreso={handleNewIngreso}
        onOpenHistorial={() => {
          setVistaActual('historial');
          setShowForm(false);
        }}
        onOpenAdmin={handleOpenAdmin}
        // ✨ NUEVO: Agregar botón de dashboard
        onOpenDashboard={() => {
          setVistaActual('dashboard');
          setShowForm(false);
        }}
        onOpenElementos={() => {
          setVistaActual('elementos');
          setShowForm(false);
        }}
        onLogout={() => {
          setShowForm(false);
          setShowAdmin(false);
          setVistaActual('inventario');
          setDataLoaded(false);
          logout();
        }}
        showForm={showForm}
      />

      <Alerts error={activeError} success={activeSuccess} />

      {/* ✨ ACTUALIZADO: Agregar Dashboard como tercera vista */}
      {vistaActual === 'inventario' ? (
        <>
          {showForm && (
            <InventoryForm
              productos={productos}
              motivos={motivos}
              loading={loading}
              onSubmit={handleCreateUnidad}
              onClose={() => setShowForm(false)}
            />
          )}

          <InventoryList
            unidades={unidades.filter(u => u.activa)}
            tiposQueso={tiposQueso}
            user={user}
            onEdit={handleOpenEditModal}
            onCut={handleOpenCutModal}
            onDelete={handleDeleteUnidad}
            onExportPdf={handleExportInventarioPdf}
            exportingPdf={exportingInventarioPdf}
          />
        </>
      ) : vistaActual === 'historial' ? (
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
          onVolver={() => setVistaActual('inventario')}
        />
      ) : vistaActual === 'elementos' ? (
        <ElementosView
          user={user}
          elementos={elementos}
          motivos={motivos}
          loading={loadingElementos}
          onCreateElemento={createElemento}
          onUpdateElemento={updateElemento}
          onDeleteElemento={deleteElemento}
          onRegistrarIngreso={registrarIngreso}
          onRegistrarEgreso={registrarEgreso}
          onFetchMovimientos={fetchMovimientos}
          onVolver={() => setVistaActual('inventario')}
        />
      ) : (
        // ✨ NUEVO: Vista del Dashboard
        <Dashboard 
          user={user}
          apiFetch={apiFetch}
          onVolver={() => setVistaActual('inventario')}
          unidades={unidades}                    // ← Agregar
          historialUnidades={historialUnidades}  // ← Agregar  
          productos={productos}                  // ← Agregar

        />
      )}

      {/* Modales (compartidos entre todas las vistas) */}
      {showEditModal && (
        <EditModal
          unidad={unidadParaEditar}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
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
        itemName={unidadEliminando ? `${unidadEliminando.producto.nombre} (ID: #${unidadEliminando.id})` : undefined}
        onClose={() => setUnidadEliminando(null)}
        onConfirm={confirmDeleteUnidad}
        loading={loading}
      />

      {showAdmin && (
        <AdminPanel
          productos={productosAdmin}
          tiposQueso={tiposQueso}
          loadingProductos={loadingAdmin}
          errorProductos={errorAdmin}
          successProductos={successAdmin}
          onCreateProducto={createProducto}
          onUpdateProducto={updateProducto}
          onDeleteProducto={deleteProducto}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          errorUsuarios={errorUsuarios}
          successUsuarios={successUsuarios}
          onCreateUsuario={createUsuario}
          onUpdateUsuario={updateUsuario}
          onDeleteUsuario={deleteUsuario}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

export default App;
