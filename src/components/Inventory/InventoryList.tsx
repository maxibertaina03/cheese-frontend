// src/components/Inventory/InventoryList.tsx
import React, { useState } from 'react';
import { Unidad } from '../../types';
import { UnidadCard } from './UnidadCard';

interface InventoryListProps {
  unidades: Unidad[];
  onEdit: (unidad: Unidad) => void;
  onCut: (unidad: Unidad) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  unidades,
  onEdit,
  onCut,
}) => {
  const [filtroInventario, setFiltroInventario] = useState('');
  const [busquedaObservaciones, setBusquedaObservaciones] = useState(false);

  const unidadesFiltradas = unidades.filter(unidad => {
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
    return unidades.filter(u => u.producto.id === productoId && u.activa).length;
  };

  return (
    <div className="card">
      <h2>Inventario Actual</h2>
      
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
        <div className="inventory-grid">
          {unidadesFiltradas.map(unidad => (
            <UnidadCard
              key={unidad.id}
              unidad={unidad}
              stockCount={contarUnidadesPorProducto(unidad.producto.id)}
              onEdit={onEdit}
              onCut={onCut}
              isHistorial={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};