import React, { useState } from 'react';
import { TipoQueso, Unidad, User } from '../../types';
import { UnidadCard } from './UnidadCard';

interface InventoryListProps {
  unidades: Unidad[];
  tiposQueso: TipoQueso[];
  user: User | null;
  onEdit: (unidad: Unidad) => void;
  onCut: (unidad: Unidad) => void;
  onDelete?: (unidad: Unidad) => void;
  onExportPdf: (params: {
    search?: string;
    tipoQuesoId?: number;
    searchObservaciones?: 'true' | 'false';
  }, visibleRows: Unidad[]) => void;
  exportingPdf: boolean;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  unidades,
  tiposQueso,
  user,
  onEdit,
  onCut,
  onDelete,
  onExportPdf,
  exportingPdf,
}) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const [busquedaObservaciones, setBusquedaObservaciones] = useState(false);
  const [tipoQuesoFiltro, setTipoQuesoFiltro] = useState('todos');
  const [vistaMode, setVistaMode] = useState<'lista' | 'grid'>('lista');

  const unidadesFiltradas = unidades.filter((unidad) => {
    if (!unidad?.producto) {
      return false;
    }

    if (tipoQuesoFiltro !== 'todos' && String(unidad.producto.tipoQueso.id) !== tipoQuesoFiltro) {
      return false;
    }

    const searchLower = filtroInventario.trim().toLowerCase();
    if (!searchLower) {
      return true;
    }

    if (busquedaObservaciones) {
      return unidad.observacionesIngreso?.toLowerCase().includes(searchLower) ?? false;
    }

    return (
      unidad.producto.nombre.toLowerCase().includes(searchLower) ||
      unidad.producto.plu.toLowerCase().includes(searchLower) ||
      unidad.id.toString().includes(searchLower)
    );
  });

  const contarUnidadesPorProducto = (productoId: number) => {
    return unidades.filter((unidad) => unidad.producto?.id === productoId && unidad.activa).length;
  };

  const handleExportPdf = () => {
    onExportPdf(
      {
        search: filtroInventario.trim() || undefined,
        tipoQuesoId: tipoQuesoFiltro !== 'todos' ? Number(tipoQuesoFiltro) : undefined,
        searchObservaciones: busquedaObservaciones ? 'true' : undefined,
      },
      unidadesFiltradas
    );
  };

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Inventario Actual</h2>
          {user?.rol !== 'admin' && <span className="badge-readonly">Solo lectura</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-export" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? 'Exportando PDF...' : 'Exportar PDF'}
          </button>

          <div className="view-toggle">
            <button
              className={`view-btn ${vistaMode === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaMode('lista')}
              title="Vista lista"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Lista
            </button>
            <button
              className={`view-btn ${vistaMode === 'grid' ? 'active' : ''}`}
              onClick={() => setVistaMode('grid')}
              title="Vista grid"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Grid
            </button>
          </div>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Buscar en inventario</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            value={filtroInventario}
            onChange={(event) => setFiltroInventario(event.target.value)}
            placeholder="Buscar por nombre, PLU o ID..."
            style={{ flex: '1 1 260px' }}
          />
          <select
            className="form-select"
            value={tipoQuesoFiltro}
            onChange={(event) => setTipoQuesoFiltro(event.target.value)}
            style={{ flex: '0 0 190px' }}
          >
            <option value="todos">Todos los tipos</option>
            {tiposQueso.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          <button
            className={`filter-btn ${busquedaObservaciones ? 'active' : ''}`}
            onClick={() => setBusquedaObservaciones(!busquedaObservaciones)}
            style={{ marginBottom: 0 }}
          >
            Observaciones
          </button>
        </div>
      </div>

      {unidadesFiltradas.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron unidades</h3>
          <p>Intenta ajustar los filtros de busqueda</p>
        </div>
      ) : (
        <div className={`inventory-container ${vistaMode}`}>
          {unidadesFiltradas.map((unidad) =>
            unidad.producto ? (
              <UnidadCard
                key={unidad.id}
                unidad={unidad}
                user={user}
                stockCount={contarUnidadesPorProducto(unidad.producto.id)}
                onEdit={onEdit}
                onCut={onCut}
                onDelete={onDelete}
                isHistorial={false}
                vistaMode={vistaMode}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
};
