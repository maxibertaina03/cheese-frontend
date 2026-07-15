// src/App.tsx - Shell de la aplicación: layout, vistas y arranque de datos.
// La lógica de cada bounded context vive en su contenedor (contextos/*).
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Unidad, TipoQueso, StockAlCorteResponse, Modulo } from './types';
import { apiService, createApiFetch } from './services/api';
import { useAuth } from './contextos/identidad/hooks/useAuth';
import { canAccess } from './utils/permissions';
import { useInventory } from './contextos/inventario-quesos/hooks/useInventory';
import { useHistorial } from './contextos/inventario-quesos/hooks/useHistorial';
import { useAdmin } from './contextos/inventario-quesos/hooks/useAdmin';
import { Login } from './contextos/identidad/componentes/Login';
import { Header } from './components/Layout/Header';
import { Alerts } from './components/Layout/Alerts';
import { InventoryForm } from './contextos/inventario-quesos/componentes/InventoryForm';
import { InventoryList } from './contextos/inventario-quesos/componentes/InventoryList';
import { EditModal } from './contextos/inventario-quesos/componentes/EditModal';
import { CutModal } from './contextos/inventario-quesos/componentes/CutModal';
import { StockAlLunesModal } from './contextos/inventario-quesos/componentes/StockAlLunesModal';
import { DeleteConfirmModal } from './components/Admin/DeleteConfirmModal';
import { HistorialView } from './contextos/inventario-quesos/componentes/HistorialView';
import { AdminPanel } from './components/Admin/AdminPanel';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useUsuarios } from './contextos/identidad/hooks/useUsuarios';
import { useElementos } from './contextos/elementos/hooks/useElementos';
import { ElementosView } from './contextos/elementos/componentes/ElementosView';
import { useProveedores } from './compartido/hooks/useProveedores';
import { IndumentariaContenedor } from './contextos/indumentaria/componentes/IndumentariaContenedor';
import { FacturacionContenedor } from './contextos/facturacion/componentes/FacturacionContenedor';
import { descargarBlob } from './compartido/utils/descargas';
import { exportHistorialPdfLocal, exportInventarioPdfLocal } from './utils/pdfExport';

function App() {
  const { user, setUser, logout, authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [exportingInventarioPdf, setExportingInventarioPdf] = useState(false);
  const [exportingHistorialPdf, setExportingHistorialPdf] = useState(false);

  // Listado del stock al último lunes (reconstrucción histórica)
  const [stockLunesData, setStockLunesData] = useState<StockAlCorteResponse | null>(null);
  const [loadingStockLunes, setLoadingStockLunes] = useState(false);
  const [showStockLunesModal, setShowStockLunesModal] = useState(false);
  const [stockLunesFecha, setStockLunesFecha] = useState<string | null>(null);
  const [imprimiendoStockLunes, setImprimiendoStockLunes] = useState(false);

  // ✨ ACTUALIZADO: Agregar 'dashboard' como opción
  const [vistaActual, setVistaActual] = useState<'inventario' | 'historial' | 'dashboard' | 'elementos' | 'indumentaria' | 'facturacion'>('inventario');
  
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
    setError: setErrorUsuarios,
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
    setError: setErrorAdmin,
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
    setError: setErrorElementos,
  } = useElementos(apiFetch);

  const {
    proveedores,
    loading: loadingProveedores,
    error: errorProveedores,
    success: successProveedores,
    fetchProveedores,
    createProveedor,
    updateProveedor,
    deleteProveedor,
    setError: setErrorProveedores,
  } = useProveedores(apiFetch);

  // Puente: FacturacionContenedor registra acá cómo refrescar el stock comercial,
  // para que admin lo actualice al crear un producto nuevo.
  const refrescarStockComercialRef = useRef<(() => Promise<void>) | null>(null);

  const fetchTiposQueso = useCallback(async () => {
    try {
      const response = await apiFetch(`${process.env.REACT_APP_API_URL}/api/tipos-queso`);
      const data = await response.json();
      setTiposQueso(data);
    } catch (error) {
      console.error('Error al cargar tipos de queso:', error);
    }
  }, [apiFetch]);

  // Arranque de datos transversales. Cada contenedor de contexto (facturación,
  // indumentaria) carga los suyos al montarse.
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
          fetchProveedores(),
        ]);
      };
      fetchData();
      setDataLoaded(true);
    }
  }, [user, dataLoaded, fetchUnidades, fetchProductos, fetchMotivos, fetchTiposQueso, fetchHistorial, fetchElementos, fetchProveedores]);
  const historialCargado = useRef(false);

  // Llevar al usuario a la primera seccion a la que tiene acceso al iniciar sesion.
  // Asi, por ejemplo, un usuario sin permiso de quesos no aterriza en el inventario vacio.
  const landingSet = useRef(false);
  useEffect(() => {
    if (!user) {
      landingSet.current = false;
      return;
    }
    if (landingSet.current) return;

    const orden: { modulo: Modulo; vista: typeof vistaActual }[] = [
      { modulo: 'quesos', vista: 'inventario' },
      { modulo: 'dashboard', vista: 'dashboard' },
      { modulo: 'elementos', vista: 'elementos' },
      { modulo: 'indumentaria', vista: 'indumentaria' },
      { modulo: 'facturacion', vista: 'facturacion' },
      { modulo: 'historial', vista: 'historial' },
    ];
    const primera = orden.find((o) => canAccess(user, o.modulo));
    if (primera) {
      setVistaActual(primera.vista);
    }
    landingSet.current = true;
  }, [user]);

  
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
      fetchProveedores(),
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

  // Admin: crear producto y refrescar también el stock de venta por cantidad,
  // para que el producto nuevo aparezca ahí sin recargar la página.
  const handleCreateProducto = async (data: Parameters<typeof createProducto>[0]) => {
    const result = await createProducto(data);
    if (result.success) {
      await refrescarStockComercialRef.current?.();
    }
    return result;
  };

  // Precios (facturación): guardar precio por unidad de un producto y refrescar.
  // El contenedor de facturación refresca además su stock comercial.
  const handleSaveProductoPrecio = async (id: number, precioUnitario: number | null) => {
    const result = await updateProducto(id, { precioUnitario });
    if (result.success) {
      await fetchProductos();
    }
    return result;
  };

  const handleSaveElementoVenta = async (
    id: number,
    data: { precioUnitario: number; esVendible: boolean }
  ) => {
    return updateElemento(id, data);
  };

  const handleCreateUnidad = async (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
    fechaElaboracion: string;
    numeroLote: string | null;
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

  // Indumentaria y facturación muestran sus alertas dentro de su contenedor.
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

  // Calcula el inicio (00:00) del lunes más reciente en la zona horaria del navegador.
  // Si hoy es lunes, devuelve hoy a las 00:00.
  const getUltimoLunes = (): Date => {
    const now = new Date();
    const diasDesdeLunes = (now.getDay() + 6) % 7; // 0=domingo => 6, 1=lunes => 0, ...
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diasDesdeLunes, 0, 0, 0, 0);
  };

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

  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verificando sesion...</div>;
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <Header
        user={user}
        title={
          vistaActual === 'elementos'
            ? 'Stock de Elementos'
            : vistaActual === 'indumentaria'
            ? 'Stock de Indumentaria'
            : 'Stock de Quesos'
        }
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
        onOpenIndumentaria={() => {
          setVistaActual('indumentaria');
          setShowForm(false);
        }}
        onOpenFacturacion={() => {
          setVistaActual('facturacion');
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
            onListadoStockLunes={handleListadoStockLunes}
            loadingStockLunes={loadingStockLunes}
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
          error={errorElementos}
          onClearError={() => setErrorElementos('')}
          onCreateElemento={createElemento}
          onUpdateElemento={updateElemento}
          onDeleteElemento={deleteElemento}
          onRegistrarIngreso={registrarIngreso}
          onRegistrarEgreso={registrarEgreso}
          onFetchMovimientos={fetchMovimientos}
          onVolver={() => setVistaActual('inventario')}
        />
      ) : vistaActual === 'dashboard' ? (
        <Dashboard
          user={user}
          apiFetch={apiFetch}
          onVolver={() => setVistaActual('inventario')}
          unidades={unidades}
          historialUnidades={historialUnidades}
          productos={productos}
        />
      ) : null}

      {/* Contenedores de bounded contexts: siempre montados (conservan sus
          datos entre navegaciones), visibles solo en su vista. */}
      <IndumentariaContenedor
        visible={vistaActual === 'indumentaria'}
        user={user}
        apiFetch={apiFetch}
        proveedores={proveedores}
        onCreateProveedor={async (nombre) => {
          const result = await createProveedor({ nombre });
          return result.success && result.proveedor ? result.proveedor : null;
        }}
        onVolver={() => setVistaActual('inventario')}
      />

      <FacturacionContenedor
        visible={vistaActual === 'facturacion'}
        user={user}
        apiFetch={apiFetch}
        productos={productos}
        elementos={elementos}
        proveedores={proveedores}
        loadingPrecios={loadingAdmin || loadingElementos}
        errorPrecios={errorAdmin || errorElementos}
        successPrecios={successAdmin || successElementos}
        onSaveProductoPrecio={handleSaveProductoPrecio}
        onSaveElemento={handleSaveElementoVenta}
        refrescarElementos={fetchElementos}
        refrescarStockRef={refrescarStockComercialRef}
      />

      {/* Modales (compartidos entre todas las vistas) */}
      {showEditModal && (
        <EditModal
          unidad={unidadParaEditar}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
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
          onClearErrorProductos={() => setErrorAdmin('')}
          onCreateProducto={handleCreateProducto}
          onUpdateProducto={updateProducto}
          onDeleteProducto={deleteProducto}
          usuarios={usuarios}
          loadingUsuarios={loadingUsuarios}
          errorUsuarios={errorUsuarios}
          successUsuarios={successUsuarios}
          onClearErrorUsuarios={() => setErrorUsuarios('')}
          onCreateUsuario={createUsuario}
          onUpdateUsuario={updateUsuario}
          onDeleteUsuario={deleteUsuario}
          proveedores={proveedores}
          loadingProveedores={loadingProveedores}
          errorProveedores={errorProveedores}
          successProveedores={successProveedores}
          onClearErrorProveedores={() => setErrorProveedores('')}
          onCreateProveedor={createProveedor}
          onUpdateProveedor={updateProveedor}
          onDeleteProveedor={deleteProveedor}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

export default App;
