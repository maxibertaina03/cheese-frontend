// src/App.tsx - Versión corregida
import React, { useState, useEffect } from 'react';
import './App.css';
import { User, Unidad, TipoQueso, FiltroHistorial } from './types'; // ✅ Agregar FiltroHistorial
import { createApiFetch } from './services/api';
import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { useHistorial } from './hooks/useHistorial';
import { Login } from './components/Auth/Login';
import { Header } from './components/Layout/Header';
import { Alerts } from './components/Layout/Alerts';
import { InventoryForm } from './components/Inventory/InventoryForm';
import { InventoryList } from './components/Inventory/InventoryList';
import { EditModal } from './components/Modals/EditModal';
import { CutModal } from './components/Modals/CutModal';
import { HistorialModal } from './components/Modals/HistorialModal';

function App() {
  const { user, setUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);

  // Modals state
  const [showCutModal, setShowCutModal] = useState(false);
  const [unidadParaCortar, setUnidadParaCortar] = useState<Unidad | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unidadParaEditar, setUnidadParaEditar] = useState<Unidad | null>(null);

  // API fetch con autenticación
  const apiFetch = createApiFetch(user?.token, () => {
    setUser(null);
    localStorage.removeItem('token');
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
  });

  // Hooks personalizados
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
  } = useInventory(apiFetch); // ✅ Removido setError que no usas

  const {
    historialFiltrado,
    showHistorial,
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
    openHistorial,
    closeHistorial,
    historialUnidades,
  } = useHistorial(apiFetch);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.token && !dataLoaded) {
      fetchData();
      setDataLoaded(true);
    }
  }, [user, dataLoaded]);

  const fetchData = async () => {
    await Promise.all([
      fetchUnidades(),
      fetchProductos(),
      fetchMotivos(),
      fetchTiposQueso(),
    ]);
  };

  const fetchTiposQueso = async () => {
    try {
      const response = await apiFetch(`${process.env.REACT_APP_API_URL}/api/tipos-queso`);
      const data = await response.json();
      setTiposQueso(data);
    } catch (error) {
      console.error('Error al cargar tipos de queso:', error);
    }
  };

  // Handlers para modales
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
      handleCloseCutModal(); // ✅ Cerrar modal solo si fue exitoso
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

  // Handler para crear unidad con cierre de form
  const handleCreateUnidad = async (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
  }) => {
    const result = await createUnidad(data);
    if (result.success) {
      setShowForm(false); // ✅ Cerrar formulario
    }
    return result;
  };

  // Funciones auxiliares para historial
  const getStockActualProducto = (productoId: number) => {
    return unidades.filter(u => u.producto.id === productoId && u.activa).length;
  };

  const getUnidadesAgotadasProducto = (productoId: number) => {
    return historialUnidades.filter(u => u.producto.id === productoId && !u.activa).length;
  };

  const getPesoVendidoProducto = (productoId: number) => {
    return historialUnidades
      .filter(u => u.producto.id === productoId && !u.activa)
      .reduce((sum, u) => sum + Number(u.pesoInicial), 0);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <Header
        unidadesActivas={unidades.filter(u => u.activa).length}
        totalProductos={productos.length}
        onNewIngreso={() => setShowForm(!showForm)}
        onOpenHistorial={openHistorial}
        showForm={showForm}
      />

      <Alerts error={error} success={success} />

      {showForm && (
        <InventoryForm
          productos={productos}
          motivos={motivos}
          loading={loading}
          onSubmit={handleCreateUnidad} // ✅ Usar wrapper
          onClose={() => setShowForm(false)}
        />
      )}

      <InventoryList
        unidades={unidades.filter(u => u.activa)}
        onEdit={handleOpenEditModal}
        onCut={handleOpenCutModal}
      />

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

      <HistorialModal
        show={showHistorial}
        unidades={historialFiltrado}
        stats={statsHistorial}
        filtroHistorial={filtroHistorial}
        busquedaHistorial={busquedaHistorial}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        tipoQuesoFiltro={tipoQuesoFiltro}
        onClose={closeHistorial}
        onSetFiltro={setFiltroHistorial}
        onSetBusqueda={setBusquedaHistorial}
        onSetFechaInicio={setFechaInicio}
        onSetFechaFin={setFechaFin}
        onSetTipoQueso={setTipoQuesoFiltro}
        getStockActual={getStockActualProducto}
        getUnidadesAgotadas={getUnidadesAgotadasProducto}
        getPesoVendido={getPesoVendidoProducto}
      />
    </div>
  );
}

export default App;