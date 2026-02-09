// src/components/Modals/HistorialModal.tsx
import React, { useState } from 'react';
import { Unidad, User } from '../../types';
import { UnidadCard } from '../Inventory/UnidadCard';
import { DeleteConfirmModal } from '../Admin/DeleteConfirmModal';
import { usePermissions } from '../../utils/permissions';

interface HistorialModalProps {
  user: User | null;
  show: boolean;
  unidades: Unidad[];
  stats: {
    total: number;
    activos: number;
    agotados: number;
    pesoTotal: number;
    pesoVendido: number;
    productosDiferentes: number;
  };
  filtroHistorial: 'todos' | 'activos' | 'agotados';
  busquedaHistorial: string;
  fechaInicio: string;
  fechaFin: string;
  tipoQuesoFiltro: string;
  onClose: () => void;
  onSetFiltro: (filtro: 'todos' | 'activos' | 'agotados') => void;
  onSetBusqueda: (busqueda: string) => void;
  onSetFechaInicio: (fecha: string) => void;
  onSetFechaFin: (fecha: string) => void;
  onSetTipoQueso: (tipo: string) => void;
  getStockActual: (productoId: number) => number;
  getUnidadesAgotadas: (productoId: number) => number;
  getPesoVendido: (productoId: number) => number;
  onDeleteUnidad?: (unidadId: number) => Promise<{ success: boolean }>;
}

export const HistorialModal: React.FC<HistorialModalProps> = ({
  user,
  show,
  unidades,
  stats,
  filtroHistorial,
  busquedaHistorial,
  fechaInicio,
  fechaFin,
  tipoQuesoFiltro,
  onClose,
  onSetFiltro,
  onSetBusqueda,
  onSetFechaInicio,
  onSetFechaFin,
  onSetTipoQueso,
  getStockActual,
  getUnidadesAgotadas,
  getPesoVendido,
  onDeleteUnidad,
}) => {
  const { canDelete } = usePermissions(user);
  const [unidadEliminando, setUnidadEliminando] = useState<Unidad | null>(null);
  
  // NUEVO: Estado para el tipo de vista
  const [vistaHistorial, setVistaHistorial] = useState<'lista' | 'grid'>('lista');

  const handleDelete = async () => {
    if (!unidadEliminando || !onDeleteUnidad) return;
    await onDeleteUnidad(unidadEliminando.id);
    setUnidadEliminando(null);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal historial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📋 Historial Completo</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Estadísticas del historial */}
        <div className="historial-stats">
          <div className="stat-card">
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Total Unidades</div>
          </div>
          <div className="stat-card stat-card-success">
            <div className="stat-card-value">{stats.activos}</div>
            <div className="stat-card-label">Activas</div>
          </div>
          <div className="stat-card stat-card-inactive">
            <div className="stat-card-value">{stats.agotados}</div>
            <div className="stat-card-label">Agotadas</div>
          </div>
          <div className="stat-card stat-card-primary">
            <div className="stat-card-value">{(stats.pesoTotal / 1000).toFixed(1)}kg</div>
            <div className="stat-card-label">Peso Total</div>
          </div>
          <div className="stat-card stat-card-warning">
            <div className="stat-card-value">{(stats.pesoVendido / 1000).toFixed(1)}kg</div>
            <div className="stat-card-label">Egreso Total</div>
          </div>
        </div>

        {/* Panel de Filtros Mejorado */}
        <div className="filters-panel">
          <div className="filters-header">
            <span className="filters-title">🔍 Filtros de Búsqueda</span>
            <div className="filters-header-actions">
              {/* NUEVO: Toggle de vistas */}
              <div className="view-toggle-historial">
                <button 
                  className={`view-btn-historial ${vistaHistorial === 'lista' ? 'active' : ''}`}
                  onClick={() => setVistaHistorial('lista')}
                  title="Vista Lista"
                >
                  <span>☰</span>
                  <span className="view-label">Lista</span>
                </button>
                <button 
                  className={`view-btn-historial ${vistaHistorial === 'grid' ? 'active' : ''}`}
                  onClick={() => setVistaHistorial('grid')}
                  title="Vista Grid"
                >
                  <span>⊞</span>
                  <span className="view-label">Grid</span>
                </button>
              </div>
              
              {(fechaInicio || fechaFin || busquedaHistorial || tipoQuesoFiltro !== 'todos') && (
                <button 
                  className="btn-clear-filters"
                  onClick={() => {
                    onSetFechaInicio('');
                    onSetFechaFin('');
                    onSetBusqueda('');
                    onSetTipoQueso('todos');
                    onSetFiltro('todos');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="filters-grid">
            {/* Búsqueda por texto */}
            <div className="filter-item filter-search">
              <label className="filter-label">Buscar</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="form-input search-input"
                  placeholder="Nombre, PLU, ID u observaciones..."
                  value={busquedaHistorial}
                  onChange={(e) => onSetBusqueda(e.target.value)}
                />
                {busquedaHistorial && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => onSetBusqueda('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Tipo de Queso - FIX: Clase mejorada */}
            <div className="filter-item">
              <label className="filter-label">Tipo de Queso</label>
              <select
                className="form-select filter-select"
                value={tipoQuesoFiltro}
                onChange={(e) => onSetTipoQueso(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="blando">Blando</option>
                <option value="semi-duro">Semi-duro</option>
                <option value="duro">Duro</option>
              </select>
            </div>

            {/* Rango de Fechas */}
            <div className="filter-item filter-dates">
              <label className="filter-label">Rango de Fechas</label>
              <div className="date-range-wrapper">
                <div className="date-input-group">
                  <span className="date-label">Desde</span>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={fechaInicio}
                    onChange={(e) => onSetFechaInicio(e.target.value)}
                  />
                </div>
                <span className="date-separator">→</span>
                <div className="date-input-group">
                  <span className="date-label">Hasta</span>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={fechaFin}
                    onChange={(e) => onSetFechaFin(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de filtro rápido */}
          <div className="quick-filters">
            <span className="quick-filters-label">Mostrar:</span>
            <div className="quick-filters-buttons">
              <button 
                className={`quick-filter-btn ${filtroHistorial === 'todos' ? 'active' : ''}`}
                onClick={() => onSetFiltro('todos')}
              >
                <span className="quick-filter-count">{stats.total}</span>
                <span className="quick-filter-text">Todos</span>
              </button>
              <button 
                className={`quick-filter-btn ${filtroHistorial === 'activos' ? 'active' : ''}`}
                onClick={() => onSetFiltro('activos')}
              >
                <span className="quick-filter-count success">{stats.activos}</span>
                <span className="quick-filter-text">Activos</span>
              </button>
              <button 
                className={`quick-filter-btn ${filtroHistorial === 'agotados' ? 'active' : ''}`}
                onClick={() => onSetFiltro('agotados')}
              >
                <span className="quick-filter-count danger">{stats.agotados}</span>
                <span className="quick-filter-text">Agotados</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista del historial - NUEVO: Clases dinámicas según vista */}
        <div className="historial-content">
          {unidades.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron registros</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className={`inventory-container ${vistaHistorial}`}>
              {unidades.map(unidad => (
                unidad.producto ? (
                  <UnidadCard
                    key={unidad.id}
                    unidad={unidad}
                    user={user}
                    stockActual={getStockActual(unidad.producto.id)}
                    unidadesAgotadas={getUnidadesAgotadas(unidad.producto.id)}
                    pesoVendido={getPesoVendido(unidad.producto.id)}
                    onDelete={canDelete ? setUnidadEliminando : undefined}
                    isHistorial={true}
                  />
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmación para eliminar */}
      {unidadEliminando && (
        <DeleteConfirmModal
          isOpen={!!unidadEliminando}
          title="Eliminar Unidad del Historial"
          message="¿Estás seguro de que deseas eliminar permanentemente esta unidad?"
          itemName={`${unidadEliminando.producto?.nombre} (ID: #${unidadEliminando.id})`}
          onClose={() => setUnidadEliminando(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};