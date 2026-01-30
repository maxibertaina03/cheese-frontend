// src/App.tsx - Versión con Dashboard integrado
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Unidad, TipoQueso } from './types';
import { createApiFetch } from './services/api';
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

function App() {
  const { user, setUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // ✨ ACTUALIZADO: Agregar 'dashboard' como opción
  const [vistaActual, setVistaActual] = useState<'inventario' | 'historial' | 'dashboard'>('inventario');
  
  const [unidadEliminando, setUnidadEliminando] = useState<Unidad | null>(null);
  
  // Modals state
  const [showCutModal, setShowCutModal] = useState(false);
  const [unidadParaCortar, setUnidadParaCortar] = useState<Unidad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unidadParaEditar, setUnidadParaEditar] = useState<Unidad | null>(null);

  const apiFetch = createApiFetch(user?.token, () => {
    setUser(null);
    localStorage.removeItem('token');
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

  useEffect(() => {
    if (user?.token && !dataLoaded) {
      const fetchData = async () => {
        await Promise.all([
          fetchUnidades(),
          fetchProductos(),
          fetchMotivos(),
          fetchTiposQueso(),
          fetchHistorial(),
        ]);
      };
      fetchData();
      setDataLoaded(true);
    }
  }, [user, dataLoaded, fetchUnidades, fetchProductos, fetchMotivos, fetchHistorial]);
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


  const fetchTiposQueso = async () => {
    try {
      const response = await apiFetch(`${process.env.REACT_APP_API_URL}/api/tipos-queso`);
      const data = await response.json();
      setTiposQueso(data);
    } catch (error) {
      console.error('Error al cargar tipos de queso:', error);
    }
  };

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

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <Header
        user={user}
        unidadesActivas={unidades.filter(u => u.activa).length}
        totalProductos={productos.length}
        onNewIngreso={() => setShowForm(!showForm)}
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
        showForm={showForm}
      />

      <Alerts error={error} success={success} />

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
            user={user}
            onEdit={handleOpenEditModal}
            onCut={handleOpenCutModal}
            onDelete={handleDeleteUnidad}
          />
        </>
      ) : vistaActual === 'historial' ? (
        <HistorialView
          user={user}
          unidades={historialFiltrado}
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
          onVolver={() => setVistaActual('inventario')}
        />
      ) : (
        // ✨ NUEVO: Vista del Dashboard
        <Dashboard 
          user={user}
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