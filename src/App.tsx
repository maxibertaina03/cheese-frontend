// src/App.tsx - Shell de la aplicación: layout, navegación entre vistas y
// arranque de los datos transversales. La lógica de cada bounded context vive
// en su contenedor (contextos/*/componentes/*Contenedor.tsx).
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { TipoQueso, Modulo } from './types';
import { createApiFetch } from './services/api';
import { canAccess } from './utils/permissions';
import { Header } from './components/Layout/Header';
import { Alerts } from './components/Layout/Alerts';
import { AdminPanel } from './components/Admin/AdminPanel';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useProveedores } from './compartido/hooks/useProveedores';
import { useAuth } from './contextos/identidad/hooks/useAuth';
import { useUsuarios } from './contextos/identidad/hooks/useUsuarios';
import { Login } from './contextos/identidad/componentes/Login';
import { useInventory } from './contextos/inventario-quesos/hooks/useInventory';
import { useHistorial } from './contextos/inventario-quesos/hooks/useHistorial';
import { useAdmin } from './contextos/inventario-quesos/hooks/useAdmin';
import { InventarioContenedor } from './contextos/inventario-quesos/componentes/InventarioContenedor';
import { useElementos } from './contextos/elementos/hooks/useElementos';
import { ElementosView } from './contextos/elementos/componentes/ElementosView';
import { IndumentariaContenedor } from './contextos/indumentaria/componentes/IndumentariaContenedor';
import { FacturacionContenedor } from './contextos/facturacion/componentes/FacturacionContenedor';

type Vista = 'inventario' | 'historial' | 'dashboard' | 'elementos' | 'indumentaria' | 'facturacion';

function App() {
  const { user, setUser, logout, authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [vistaActual, setVistaActual] = useState<Vista>('inventario');

  const apiFetch = createApiFetch(user?.token, () => {
    setUser(null);
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
  });

  // Inventario e historial se inyectan enteros al contenedor del contexto, pero
  // App también los lee para las stats del Header y el Dashboard.
  const inventario = useInventory(apiFetch);
  const historial = useHistorial(apiFetch);
  const { unidades, productos, motivos, error, success, fetchUnidades, fetchProductos, fetchMotivos } = inventario;
  const { historialUnidades, fetchHistorial } = historial;

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

    const orden: { modulo: Modulo; vista: Vista }[] = [
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
    await Promise.all([fetchProductosAdmin(), fetchUsuarios(), fetchProveedores()]);
    setShowAdmin(true);
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
  ) => updateElemento(id, data);

  const headerStats =
    vistaActual === 'elementos'
      ? [
          {
            label: 'Disponibles',
            value: Array.isArray(elementos)
              ? elementos.reduce((sum, e) => sum + Number(e.cantidadDisponible || 0), 0)
              : 0,
          },
          { label: 'Elementos', value: Array.isArray(elementos) ? elementos.length : 0 },
        ]
      : [
          { label: 'Activas', value: unidades.filter((u) => u.activa).length },
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

  const irA = (vista: Vista) => {
    setVistaActual(vista);
    setShowForm(false);
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
        onOpenHistorial={() => irA('historial')}
        onOpenAdmin={handleOpenAdmin}
        onOpenDashboard={() => irA('dashboard')}
        onOpenElementos={() => irA('elementos')}
        onOpenIndumentaria={() => irA('indumentaria')}
        onOpenFacturacion={() => irA('facturacion')}
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

      {/* Contenedores de bounded contexts: siempre montados (conservan sus
          datos y sus modales), renderizan según la vista activa. */}
      <InventarioContenedor
        vista={vistaActual === 'inventario' ? 'inventario' : vistaActual === 'historial' ? 'historial' : null}
        user={user}
        apiFetch={apiFetch}
        tiposQueso={tiposQueso}
        inventario={inventario}
        historial={historial}
        showForm={showForm}
        onCloseForm={() => setShowForm(false)}
        onVolver={() => irA('inventario')}
      />

      {vistaActual === 'elementos' && (
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
          onVolver={() => irA('inventario')}
        />
      )}

      {vistaActual === 'dashboard' && (
        <Dashboard
          user={user}
          apiFetch={apiFetch}
          onVolver={() => irA('inventario')}
          unidades={unidades}
          historialUnidades={historialUnidades}
          productos={productos}
        />
      )}

      <IndumentariaContenedor
        visible={vistaActual === 'indumentaria'}
        user={user}
        apiFetch={apiFetch}
        proveedores={proveedores}
        onCreateProveedor={async (nombre) => {
          const result = await createProveedor({ nombre });
          return result.success && result.proveedor ? result.proveedor : null;
        }}
        onVolver={() => irA('inventario')}
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
