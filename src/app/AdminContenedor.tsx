// src/app/AdminContenedor.tsx
//
// El panel de administración compone varios contextos (productos de
// inventario-quesos, usuarios de identidad y proveedores del shared kernel),
// así que vive en el shell y no dentro de un bounded context.
import React, { useEffect } from 'react';
import { Proveedor } from '../types';
import { AdminPanel } from '../components/Admin/AdminPanel';
import { useUsuarios } from '../contextos/identidad/hooks/useUsuarios';
import { useInventarioContexto } from '../contextos/inventario-quesos/InventarioContexto';

interface Props {
  abierto: boolean;
  apiFetch: any;
  onClose: () => void;
  // Proveedores (shared kernel): el shell los inyecta porque también los usan
  // indumentaria y facturación.
  proveedores: Proveedor[];
  loadingProveedores: boolean;
  errorProveedores: string;
  successProveedores: string;
  onClearErrorProveedores: () => void;
  onCreateProveedor: (data: Partial<Proveedor>) => Promise<{ success: boolean }>;
  onUpdateProveedor: (id: number, data: Partial<Proveedor>) => Promise<{ success: boolean }>;
  onDeleteProveedor: (id: number) => Promise<{ success: boolean }>;
  refrescarProveedores: () => Promise<void>;
  // Puente para refrescar el stock comercial de facturación al crear un producto.
  refrescarStockRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const AdminContenedor: React.FC<Props> = ({
  abierto,
  apiFetch,
  onClose,
  proveedores,
  loadingProveedores,
  errorProveedores,
  successProveedores,
  onClearErrorProveedores,
  onCreateProveedor,
  onUpdateProveedor,
  onDeleteProveedor,
  refrescarProveedores,
  refrescarStockRef,
}) => {
  const { productos: productosCtx, tiposQueso } = useInventarioContexto();
  const {
    productos,
    loading: loadingProductos,
    error: errorProductos,
    success: successProductos,
    fetchProductos,
    createProducto,
    updateProducto,
    deleteProducto,
    setError: setErrorProductos,
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

  // Refrescar los datos del panel cada vez que se abre.
  useEffect(() => {
    if (!abierto) return;
    Promise.all([fetchProductos(), fetchUsuarios(), refrescarProveedores()]);
  }, [abierto, fetchProductos, fetchUsuarios, refrescarProveedores]);

  // Crear producto y refrescar también el stock de venta por cantidad, para que
  // el producto nuevo aparezca ahí sin recargar la página.
  const handleCreateProducto = async (data: Parameters<typeof createProducto>[0]) => {
    const result = await createProducto(data);
    if (result.success) {
      await refrescarStockRef.current?.();
    }
    return result;
  };

  if (!abierto) return null;

  return (
    <AdminPanel
      productos={productos}
      tiposQueso={tiposQueso}
      loadingProductos={loadingProductos}
      errorProductos={errorProductos}
      successProductos={successProductos}
      onClearErrorProductos={() => setErrorProductos('')}
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
      onClearErrorProveedores={onClearErrorProveedores}
      onCreateProveedor={onCreateProveedor}
      onUpdateProveedor={onUpdateProveedor}
      onDeleteProveedor={onDeleteProveedor}
      onClose={onClose}
    />
  );
};
