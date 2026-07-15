// src/app/AppShell.tsx
//
// Shell de la aplicación (composition root): layout, navegación entre vistas y
// composición de los contenedores de cada bounded context.
//
// Cuando un contexto necesita datos de otro (facturación vende productos y
// elementos; elementos usa motivos de quesos), el shell los lee y se los pasa
// como props: los contextos no se importan entre sí. Ver context map en plan.md.
import React, { useEffect, useRef, useState } from 'react';
import { Modulo, User } from '../types';
import { canAccess } from '../utils/permissions';
import { Header } from '../components/Layout/Header';
import { Alerts } from '../components/Layout/Alerts';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { useProveedores } from '../compartido/hooks/useProveedores';
import { useInventarioContexto } from '../contextos/inventario-quesos/InventarioContexto';
import { InventarioContenedor } from '../contextos/inventario-quesos/componentes/InventarioContenedor';
import { useElementosContexto } from '../contextos/elementos/ElementosContexto';
import { ElementosContenedor } from '../contextos/elementos/componentes/ElementosContenedor';
import { IndumentariaContenedor } from '../contextos/indumentaria/componentes/IndumentariaContenedor';
import { FacturacionContenedor } from '../contextos/facturacion/componentes/FacturacionContenedor';
import { AdminContenedor } from './AdminContenedor';

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

  // Contextos que el shell lee para el Header, el Dashboard y facturación.
  const { inventario, historial, productos: productosCtx } = useInventarioContexto();
  const { unidades, productos, motivos, error, success, fetchProductos } = inventario;
  const { historialUnidades } = historial;
  const { loading: loadingProductos, error: errorProductos, success: successProductos, updateProducto } = productosCtx;

  const elementosCtx = useElementosContexto();
  const {
    elementos,
    loading: loadingElementos,
    error: errorElementos,
    success: successElementos,
    fetchElementos,
    updateElemento,
  } = elementosCtx;

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

  // Proveedores es lo único que no vive en un provider (shared kernel).
  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    fetchProveedores();
  }, [fetchProveedores]);

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
        onOpenAdmin={() => setShowAdmin(true)}
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

      <ElementosContenedor
        visible={vistaActual === 'elementos'}
        user={user}
        motivos={motivos}
        onVolver={() => irA('inventario')}
      />

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
        loadingPrecios={loadingProductos || loadingElementos}
        errorPrecios={errorProductos || errorElementos}
        successPrecios={successProductos || successElementos}
        onSaveProductoPrecio={handleSaveProductoPrecio}
        onSaveElemento={handleSaveElementoVenta}
        refrescarElementos={fetchElementos}
        refrescarStockRef={refrescarStockComercialRef}
      />

      <AdminContenedor
        abierto={showAdmin}
        apiFetch={apiFetch}
        onClose={() => setShowAdmin(false)}
        proveedores={proveedores}
        loadingProveedores={loadingProveedores}
        errorProveedores={errorProveedores}
        successProveedores={successProveedores}
        onClearErrorProveedores={() => setErrorProveedores('')}
        onCreateProveedor={createProveedor}
        onUpdateProveedor={updateProveedor}
        onDeleteProveedor={deleteProveedor}
        refrescarProveedores={fetchProveedores}
        refrescarStockRef={refrescarStockComercialRef}
      />
    </div>
  );
};
