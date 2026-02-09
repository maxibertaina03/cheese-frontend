// src/components/Inventory/InventoryList.tsx
import React, { useState } from 'react';
import { Unidad, User } from '../../types';
import { UnidadCard } from './UnidadCard';
import { usePermissions } from '../../utils/permissions';

interface InventoryListProps {
  unidades: Unidad[];
  user: User | null;
  onEdit: (unidad: Unidad) => void;
  onCut: (unidad: Unidad) => void;
  onDelete?: (unidad: Unidad) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  unidades,
  user,
  onEdit,
  onCut,
  onDelete,
}) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const [busquedaObservaciones, setBusquedaObservaciones] = useState(false);
  const [vistaMode, setVistaMode] = useState<'lista' | 'grid'>('lista');  // ← NUEVO

  const { isAdmin } = usePermissions(user);

  // Filtro igual que antes...
  const unidadesFiltradas = unidades.filter(unidad => {
    if (!unidad || !unidad.producto) return false;
    
    const searchLower = filtroInventario.toLowerCase();
    const matchNombre = unidad.producto.nombre.toLowerCase().includes(searchLower);
    const matchPLU = unidad.producto.plu.includes(searchLower);
    const matchID = unidad.id.toString().includes(searchLower);
    
    if (busquedaObservaciones && unidad.observacionesIngreso) {
      const matchObservaciones = unidad.observacionesIngreso.toLowerCase().includes(searchLower);
      return matchObservaciones;
    }
  
    return matchNombre || matchPLU || matchID;
  });

  const contarUnidadesPorProducto = (productoId: number) => {
    return unidades.filter(u => u.producto?.id === productoId && u.activa).length;
  };

  return (
    <div className="card">
      {/* Header con toggle de vistas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Inventario Actual</h2>
          {user?.rol !== 'admin' && (
            <span className="badge-readonly">🔒 Solo lectura</span>
          )}
        </div>
        
        {/* Toggle de vistas */}
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
      
      {/* Filtros */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Buscar en inventario</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <input
            type="text"
            className="form-input"
            value={filtroInventario}
            onChange={(e) => setFiltroInventario(e.target.value)}
            placeholder="Buscar por nombre, PLU o ID..."
            style={{ flex: 1 }}
          />
          <button
            className={`filter-btn ${busquedaObservaciones ? 'active' : ''}`}
            onClick={() => setBusquedaObservaciones(!busquedaObservaciones)}
            style={{ marginBottom: 0 }}
          >
            🔍 Observaciones
          </button>
        </div>
      </div>

      {unidadesFiltradas.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron unidades</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className={`inventory-container ${vistaMode}`}>
          {unidadesFiltradas.map(unidad => (
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
                vistaMode={vistaMode}  // ← Pasar modo a la card
              />
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};