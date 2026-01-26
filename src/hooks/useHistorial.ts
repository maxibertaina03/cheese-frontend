// src/hooks/useHistorial.ts
import { useState, useMemo, useCallback } from 'react';
import { Unidad, FiltroHistorial } from '../types';
import { apiService } from '../services/api';

export const useHistorial = (apiFetch: any) => {
  const [historialUnidades, setHistorialUnidades] = useState<Unidad[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>('todos');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoQuesoFiltro, setTipoQuesoFiltro] = useState<string>('todos');

  const fetchHistorial = useCallback(async () => {
    try {
      const response = await apiService.getHistorial(apiFetch);
      const data = await response.json();
      setHistorialUnidades(data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }, [apiFetch]);

  const historialFiltrado = useMemo(() => {
    return historialUnidades.filter(unidad => {
      // Filtro por estado
      if (filtroHistorial === 'activos' && !unidad.activa) return false;
      if (filtroHistorial === 'agotados' && unidad.activa) return false;

      // Filtro por tipo de queso
      if (tipoQuesoFiltro !== 'todos' && 
          unidad.producto.tipoQueso.nombre.toLowerCase() !== tipoQuesoFiltro) {
        return false;
      }

      // Filtro por fechas
      if (fechaInicio || fechaFin) {
        const unidadFecha = new Date(unidad.createdAt);
        const inicio = fechaInicio ? new Date(fechaInicio) : null;
        const fin = fechaFin ? new Date(fechaFin) : null;

        if (inicio && unidadFecha < inicio) return false;
        if (fin && unidadFecha > fin) return false;
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
    openHistorial,
    closeHistorial,
    fetchHistorial,
  };
};