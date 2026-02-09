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

      // Filtro por fechas (corregido para manejar zonas horarias correctamente)
      if (fechaInicio || fechaFin) {
        // Crear fechas ajustadas para comparar solo la parte de fecha (sin hora)
        const unidadFecha = new Date(unidad.createdAt);
        
        if (fechaInicio) {
          const inicio = new Date(fechaInicio + 'T00:00:00');
          // Comparar solo fecha, ignorando hora
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


  const deleteUnidadPermanente = async (unidadId: number) => {
  try {
    const response = await apiService.deleteUnidadPermanente(apiFetch, unidadId);
    if (response.ok) {
      // Actualizar lista local eliminando la unidad
      setHistorialUnidades(prev => prev.filter(u => u.id !== unidadId));
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error };
    }
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
    deleteUnidadPermanente,  // ← NUEVO
    openHistorial,
    closeHistorial,
    fetchHistorial,
    
  };
};