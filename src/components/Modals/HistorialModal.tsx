// src/components/Modals/HistorialModal.tsx
import React from 'react';
import { Unidad } from '../../types';
import { UnidadCard } from '../Inventory/UnidadCard';

interface HistorialModalProps {
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
}

export const HistorialModal: React.FC<HistorialModalProps> = ({
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
}) => {
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
            <div className="stat-card-label">EGRESO TOTAL</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="historial-filters">
          {/* Filtro por fechas */}
          <div className="filter-group">
            <label className="form-label">Rango de Fechas</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={fechaInicio}
                onChange={(e) => onSetFechaInicio(e.target.value)}
                style={{ flex: 1 }}
              />
              <span>hasta</span>
              <input
                type="date"
                className="form-input"
                value={fechaFin}
                onChange={(e) => onSetFechaFin(e.target.value)}
                style={{ flex: 1 }}
              />
              {(fechaInicio || fechaFin) && (
                <button
                  className="btn-action"
                  onClick={() => {
                    onSetFechaInicio('');
                    onSetFechaFin('');
                  }}
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filtro por tipo de queso */}
          <div className="filter-group">
            <label className="form-label">Tipo de Queso</label>
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

          {/* Búsqueda por texto */}
          <div className="filter-group">
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Buscar por nombre, PLU, ID o observaciones..."
              value={busquedaHistorial}
              onChange={(e) => onSetBusqueda(e.target.value)}
            />
          </div>

          {/* Botones de filtro rápido */}
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filtroHistorial === 'todos' ? 'active' : ''}`}
              onClick={() => onSetFiltro('todos')}
            >
              Todos ({stats.total})
            </button>
            <button 
              className={`filter-btn ${filtroHistorial === 'activos' ? 'active' : ''}`}
              onClick={() => onSetFiltro('activos')}
            >
              Activos ({stats.activos})
            </button>
            <button 
              className={`filter-btn ${filtroHistorial === 'agotados' ? 'active' : ''}`}
              onClick={() => onSetFiltro('agotados')}
            >
              Agotados ({stats.agotados})
            </button>
          </div>
        </div>

        {/* Lista del historial */}
        <div className="historial-content">
          {unidades.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron registros</h3>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="inventory-grid">
              {unidades.map(unidad => (
                <UnidadCard
                  key={unidad.id}
                  unidad={unidad}
                  stockActual={getStockActual(unidad.producto.id)}
                  unidadesAgotadas={getUnidadesAgotadas(unidad.producto.id)}
                  pesoVendido={getPesoVendido(unidad.producto.id)}
                  isHistorial={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};