// src/app/AppShell.tsx
//
// Shell de la aplicación (composition root): layout, navegación entre vistas y
// composición de los contenedores de cada bounded context.
//
// Cuando un contexto necesita datos de otro (facturación vende productos y
// elementos), el shell los lee y se los pasa como props: los contextos no se
// importan entre sí. Ver el context map en plan.md.
import React, { useEffect, useRef, useState } from 'react';
import { Modulo, User } from '../types';
import { canAccess } from '../utils/permissions';
import { Header } from '../components/Layout/Header';
import { Alerts } from '../components/Layout/Alerts';
import { AdminPanel } from '../components/Admin/AdminPanel';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { useProveedores } from '../compartido/hooks/useProveedores';
import { useUsuarios } from '../contextos/identidad/hooks/useUsuarios';
import { useInventarioContexto } from '../contextos/inventario-quesos/InventarioContexto';
import { InventarioContenedor } from '../contextos/inventario-quesos/componentes/InventarioContenedor';
import { useElementos } from '../contextos/elementos/hooks/useElementos';
import { ElementosView } from '../contextos/elementos/componentes/ElementosView';
import { IndumentariaContenedor } from '../contextos/indumentaria/componentes/IndumentariaContenedor';
import { FacturacionContenedor } from '../contextos/facturacion/componentes/FacturacionContenedor';

type Vista = 'inventario' | 'historial' | 'dashboard' | 'elementos' | 'indumentaria' | 'facturacion';

// Al iniciar sesión aterrizamos en la primera sección accesible: así, por
// ejemplo, un usuario sin permiso de quesos no cae en un inventario vacío.
const ORDEN_LANDING: { modulo: Modulo; vista: Vista }[] = [
  { modulo: 'quesos', vista: 'inventario' },
  { modulo: 'dashboard', vista: 'dashboard' },
  { modulo: 'elementos', vista: 'elementos' },
  { modulo: 'indumentaria', vista: 'indumentaria' },
  { modulo: 'facturacion', vista: 'facturacion' },
  { modulo: 'historial', vista: 'historial' },
];

const vistaInicial = (user: User): Vista =>
  ORDEN_LANDING.find((o) => canAccess(user, o.modulo))?.vista ?? 'inventario';

interface Props {
  user: User;
  apiFetch: any;
  onLogout: () => void;
}

export const AppShell: React.FC<Props> = ({ user, apiFetch, onLogout }) => {
  const [vistaActual, setVistaActual] = useState<Vista>(() => vistaInicial(user));
  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Contexto de inventario: dueño de unidades, productos, motivos, tipos de
  // queso e historial. Acá se lee para el Header, el Dashboard y facturación.
  const { inventario, historial, productos: productosCtx, tiposQueso } = useInventarioContexto();
  const { unidades, productos, motivos, error, success, fetchProductos } = inventario;
  const { historialUnidades } = historial;
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
  } = productosCtx;

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

  // Carga inicial de lo que no vive en un provider. El shell se monta con el
  // usuario ya logueado y se desmonta al cerrar sesión.
  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    Promise.all([fetchElementos(), fetchProveedores()]);
  }, [fetchElementos, fetchProveedores]);

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
        onLogout={onLogout}
        showForm={showForm}
      />

      <Alerts error={activeError} success={activeSuccess} />

      {/* Contenedores de bounded contexts: siempre montados (conservan sus
          datos y sus modales), renderizan según la vista activa. */}
      <InventarioContenedor
        vista={vistaActual === 'inventario' ? 'inventario' : vistaActual === 'historial' ? 'historial' : null}
        user={user}
        apiFetch={apiFetch}
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
};
