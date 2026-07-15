// src/contextos/inventario-quesos/InventarioContexto.tsx
//
// Provider del bounded context de inventario de quesos. Es el dueño del estado
// del contexto (unidades/cortes, productos, motivos, tipos de queso e historial)
// y hace su propia carga inicial al montarse.
//
// Existe porque este estado lo consumen varios lugares fuera del contenedor:
// las stats del Header, el Dashboard (reportes) y —vía el shell, que actúa de
// composition root— facturación. Con el provider, cada consumidor lo lee del
// contexto en vez de recibirlo drilleado por props desde App.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TipoQueso } from '../../types';
import { useInventory } from './hooks/useInventory';
import { useHistorial } from './hooks/useHistorial';
import { useAdmin } from './hooks/useAdmin';

export interface ValorInventarioContexto {
  // Unidades (hormas), productos y motivos + acciones de alta/corte/baja.
  inventario: ReturnType<typeof useInventory>;
  // Historial de unidades con sus filtros y estadísticas.
  historial: ReturnType<typeof useHistorial>;
  // ABM de productos del panel de administración.
  productos: ReturnType<typeof useAdmin>;
  tiposQueso: TipoQueso[];
  recargarTiposQueso: () => Promise<void>;
}

const InventarioContexto = createContext<ValorInventarioContexto | null>(null);

export const useInventarioContexto = (): ValorInventarioContexto => {
  const valor = useContext(InventarioContexto);
  if (!valor) {
    throw new Error('useInventarioContexto debe usarse dentro de <InventarioProvider>');
  }
  return valor;
};

interface Props {
  apiFetch: any;
  children: React.ReactNode;
}

export const InventarioProvider: React.FC<Props> = ({ apiFetch, children }) => {
  const inventario = useInventory(apiFetch);
  const historial = useHistorial(apiFetch);
  const productos = useAdmin(apiFetch);
  const [tiposQueso, setTiposQueso] = useState<TipoQueso[]>([]);

  const recargarTiposQueso = useCallback(async () => {
    try {
      const response = await apiFetch(`${process.env.REACT_APP_API_URL}/api/tipos-queso`);
      const data = await response.json();
      setTiposQueso(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar tipos de queso:', error);
    }
  }, [apiFetch]);

  const { fetchUnidades, fetchProductos, fetchMotivos } = inventario;
  const { fetchHistorial } = historial;

  // Carga inicial: el provider se monta recién con el usuario logueado y se
  // desmonta al cerrar sesión, así que alcanza con cargar una vez.
  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    Promise.all([fetchUnidades(), fetchProductos(), fetchMotivos(), fetchHistorial(), recargarTiposQueso()]);
  }, [fetchUnidades, fetchProductos, fetchMotivos, fetchHistorial, recargarTiposQueso]);

  return (
    <InventarioContexto.Provider value={{ inventario, historial, productos, tiposQueso, recargarTiposQueso }}>
      {children}
    </InventarioContexto.Provider>
  );
};
