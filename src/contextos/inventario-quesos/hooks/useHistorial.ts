// src/contextos/inventario-quesos/hooks/useHistorial.ts
import { useState, useMemo } from 'react';
import { Unidad, FiltroHistorial } from '../../../types';
import { apiService } from '../../../services/api';
import { useColeccion } from '../../../compartido/hooks/useColeccion';

export const useHistorial = (apiFetch: any) => {
  const {
    items: historialUnidades,
    setItems: setHistorialUnidades,
    refrescar: fetchHistorial,
  } = useColeccion<Unidad>(() => apiService.getHistorial(apiFetch));

  const [showHistorial, setShowHistorial] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>('todos');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoQuesoFiltro, setTipoQuesoFiltro] = useState<string>('todos');

  const historialFiltrado = useMemo(() => {
    return historialUnidades.filter(unidad => {
      // Filtro por estado
      if (filtroHistorial === 'activos' && !unidad.activa) return false;
      if (filtroHistorial === 'agotados' && unidad.activa) return false;

      // Filtro por tipo de queso
      if (tipoQuesoFiltro !== 'todos' && String(unidad.producto.tipoQueso.id) !== tipoQuesoFiltro) {
        return false;
      }

      // Filtro por fechas (comparando solo la parte de fecha, sin hora)
      if (fechaInicio || fechaFin) {
        const unidadFecha = new Date(unidad.createdAt);

        if (fechaInicio) {
          const inicio = new Date(fechaInicio + 'T00:00:00');
          const unidadDia = new Date(unidadFecha.getFullYear(), unidadFecha.getMonth(), unidadFecha.getDate());
          const inicioDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
          if (unidadDia < inicioDia) return false;
        }

        if (fechaFin) {
          const fin = new Date(fechaFin + 'T23:59:59');
          const unidadDia = new Date(unidadFecha.getFullYear(), unidadFecha.getMonth(), unidadFecha.getDate());
          const finDia = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
          if (unidadDia > finDia) return false;
        }
      }

      // Filtro por búsqueda de texto
      if (busquedaHistorial) {
        const searchLower = busquedaHistorial.toLowerCase();
        const matchNombre = unidad.producto.nombre.toLowerCase().includes(searchLower);
        const matchPLU = unidad.producto.plu.includes(searchLower);
        const matchID = unidad.id.toString().includes(searchLower);
        const matchObservaciones = unidad.observacionesIngreso?.toLowerCase().includes(searchLower);

        return matchNombre || matchPLU || matchID || matchObservaciones;
      }

      return true;
    });
  }, [historialUnidades, filtroHistorial, tipoQuesoFiltro, fechaInicio, fechaFin, busquedaHistorial]);

  const statsHistorial = useMemo(() => ({
    total: historialFiltrado.length,
    activos: historialFiltrado.filter(u => u.activa).length,
    agotados: historialFiltrado.filter(u => !u.activa).length,
    pesoTotal: historialFiltrado.reduce((sum, u) => sum + Number(u.pesoInicial), 0),
    pesoVendido: historialFiltrado.reduce((sum, u) =>
      sum + (Number(u.pesoInicial) - Number(u.pesoActual)), 0),
    productosDiferentes: new Set(historialFiltrado.map(u => u.producto.id)).size,
  }), [historialFiltrado]);

  const openHistorial = async () => {
    setShowHistorial(true);
    await fetchHistorial();
  };

  const closeHistorial = () => {
    setShowHistorial(false);
  };

  // Borrado permanente: actualiza la lista local sin refetch y devuelve el error
  // en el resultado (el llamador decide cómo mostrarlo), por eso no usa ejecutar().
  const deleteUnidadPermanente = async (unidadId: number) => {
    try {
      const response = await apiService.deleteUnidadPermanente(apiFetch, unidadId);
      if (response.ok) {
        setHistorialUnidades(prev => prev.filter(u => u.id !== unidadId));
        return { success: true };
      }
      const errorData = await response.json();
      return { success: false, error: errorData.error };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  return {
    historialUnidades,
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
    deleteUnidadPermanente,
    openHistorial,
    closeHistorial,
    fetchHistorial,
  };
};
