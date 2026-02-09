// src/components/History/HistorialView.tsx
import React, { useState } from 'react';
import { Unidad, User } from '../../types';
import { UnidadCard } from '../Inventory/UnidadCard';
import { DeleteConfirmModal } from '../Admin/DeleteConfirmModal';
import { usePermissions } from '../../utils/permissions';

interface HistorialViewProps {
  user: User | null;
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
  onSetFiltro: (filtro: 'todos' | 'activos' | 'agotados') => void;
  onSetBusqueda: (busqueda: string) => void;
  onSetFechaInicio: (fecha: string) => void;
  onSetFechaFin: (fecha: string) => void;
  onSetTipoQueso: (tipo: string) => void;
  getStockActual: (productoId: number) => number;
  getUnidadesAgotadas: (productoId: number) => number;
  getPesoVendido: (productoId: number) => number;
  onDeleteUnidad?: (unidadId: number) => Promise<{ success: boolean }>;
  onVolver: () => void;
}

export const HistorialView: React.FC<HistorialViewProps> = ({
  user,
  unidades,
  stats,
  filtroHistorial,
  busquedaHistorial,
  fechaInicio,
  fechaFin,
  tipoQuesoFiltro,
  onSetFiltro,
  onSetBusqueda,
  onSetFechaInicio,
  onSetFechaFin,
  onSetTipoQueso,
  getStockActual,
  getUnidadesAgotadas,
  getPesoVendido,
  onDeleteUnidad,
  onVolver,
}) => {
  const { canDelete } = usePermissions(user);
  const [unidadEliminando, setUnidadEliminando] = useState<Unidad | null>(null);
  const [vistaHistorial, setVistaHistorial] = useState<'lista' | 'grid'>('lista');

  const handleDelete = async () => {
    if (!unidadEliminando || !onDeleteUnidad) return;
    await onDeleteUnidad(unidadEliminando.id);
    setUnidadEliminando(null);
  };

  return (
    <div className="historial-page">
      {/* Header del Historial */}
      <div className="historial-page-header">
        <div className="historial-title-section">
          <h2 className="page-title">📋 Historial Completo</h2>
          <p className="page-subtitle">Registro de todas las unidades ingresadas y agotadas</p>
        </div>
        <button className="btn-back" onClick={onVolver}>
          ← Volver al Inventario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="historial-stats-container">
        <div className="stat-card-large">
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Unidades</div>
        </div>
        <div className="stat-card-large stat-card-success">
          <div className="stat-card-value">{stats.activos}</div>
          <div className="stat-card-label">Activas</div>
        </div>
        <div className="stat-card-large stat-card-inactive">
          <div className="stat-card-value">{stats.agotados}</div>
          <div className="stat-card-label">Agotadas</div>
        </div>
        <div className="stat-card-large stat-card-primary">
          <div className="stat-card-value">{(stats.pesoTotal / 1000).toFixed(1)}kg</div>
          <div className="stat-card-label">Peso Total</div>
        </div>
        <div className="stat-card-large stat-card-warning">
          <div className="stat-card-value">{(stats.pesoVendido / 1000).toFixed(1)}kg</div>
          <div className="stat-card-label">Egreso Total</div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="filters-panel-full">
        <div className="filters-header-full">
          <span className="filters-title">🔍 Filtros de Búsqueda</span>
          <div className="filters-actions">
            {/* Toggle Vista */}
            <div className="view-toggle-historial">
              <button 
                className={`view-btn-historial ${vistaHistorial === 'lista' ? 'active' : ''}`}
                onClick={() => setVistaHistorial('lista')}
                title="Vista Lista"
              >
                ☰
              </button>
              <button 
                className={`view-btn-historial ${vistaHistorial === 'grid' ? 'active' : ''}`}
                onClick={() => setVistaHistorial('grid')}
                title="Vista Grid"
              >
                ⊞
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

        <div className="filters-body">
          <div className="filters-row">
            {/* Búsqueda */}
            <div className="filter-group-large">
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

            {/* Tipo de Queso */}
            <div className="filter-group-medium">
              <label className="filter-label">Tipo de Queso</label>
              <select
                className="form-select"
                value={tipoQuesoFiltro}
                onChange={(e) => onSetTipoQueso(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="blando">Blando</option>
                <option value="semi-duro">Semi-duro</option>
                <option value="duro">Duro</option>
              </select>
            </div>

            {/* Fechas */}
            <div className="filter-group-large">
              <label className="filter-label">Rango de Fechas</label>
              <div className="date-range-wrapper">
                <div className="date-field">
                  <span className="date-tag">Desde</span>
                  <input
                    type="date"
                    className="form-input date-input"
                    value={fechaInicio}
                    onChange={(e) => onSetFechaInicio(e.target.value)}
                  />
                </div>
                <span className="date-arrow">→</span>
                <div className="date-field">
                  <span className="date-tag">Hasta</span>
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

          {/* Filtros Rápidos */}
          <div className="quick-filters-row">
            <span className="quick-label">Mostrar:</span>
            <div className="quick-filters-group">
              <button 
                className={`quick-filter-chip ${filtroHistorial === 'todos' ? 'active' : ''}`}
                onClick={() => onSetFiltro('todos')}
              >
                <span className="chip-count">{stats.total}</span>
                <span>Todos</span>
              </button>
              <button 
                className={`quick-filter-chip ${filtroHistorial === 'activos' ? 'active' : ''}`}
                onClick={() => onSetFiltro('activos')}
              >
                <span className="chip-count success">{stats.activos}</span>
                <span>Activos</span>
              </button>
              <button 
                className={`quick-filter-chip ${filtroHistorial === 'agotados' ? 'active' : ''}`}
                onClick={() => onSetFiltro('agotados')}
              >
                <span className="chip-count danger">{stats.agotados}</span>
                <span>Agotados</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="historial-content-full">
        {unidades.length === 0 ? (
          <div className="empty-state-large">
            <div className="empty-icon">📋</div>
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
                  // Opcional: agregar una prop para saber si es vista grid
                />
              ) : null
            ))}
          </div>
      )}
      </div>

      {/* Modal Eliminar */}
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