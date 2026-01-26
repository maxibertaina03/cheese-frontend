// src/components/Inventory/UnidadCard.tsx
import React from 'react';
import { Unidad } from '../../types';
import { formatDate } from '../../utils/dates';

interface UnidadCardProps {
  unidad: Unidad;
  stockCount?: number;
  stockActual?: number;
  unidadesAgotadas?: number;
  pesoVendido?: number;
  onEdit?: (unidad: Unidad) => void;
  onCut?: (unidad: Unidad) => void;
  isHistorial: boolean;
}

export const UnidadCard: React.FC<UnidadCardProps> = ({
  unidad,
  stockCount,
  stockActual,
  unidadesAgotadas,
  pesoVendido,
  onEdit,
  onCut,
  isHistorial,
}) => {
  const getTipoBadgeClass = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'blando': 'badge-blando',
      'semi-duro': 'badge-semi-duro',
      'duro': 'badge-duro',
    };
    return tipos[tipo?.toLowerCase()] || 'badge-blando';
  };

  return (
    <div className="unit-card">
      <div className="unit-header">
        <div className="unit-info">
          <div className="unit-title-row">
            <span className={`badge ${getTipoBadgeClass(unidad.producto.tipoQueso.nombre)}`}>
              {unidad.producto.tipoQueso.nombre}
            </span>
            <span className="badge badge-plu">PLU: {unidad.producto.plu}</span>
            <span className={`badge ${unidad.activa ? 'badge-status' : 'badge-inactive'}`}>
              {unidad.activa ? 'Activa' : 'Agotada'}
            </span>
            
            {/* Mostrar stock actual solo en historial */}
            {isHistorial && stockActual !== undefined && (
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                Stock Actual: {stockActual}
              </span>
            )}
            
            {/* Mostrar contador solo en inventario actual */}
            {!isHistorial && unidad.activa && stockCount !== undefined && (
              <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                Stock: {stockCount}
              </span>
            )}
          </div>
          <h3 className="unit-name">{unidad.producto.nombre}</h3>
          <div className="unit-id">ID: #{unidad.id}</div>
          
          {/* Información adicional en el historial */}
          {isHistorial && !unidad.activa && unidadesAgotadas !== undefined && pesoVendido !== undefined && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Unidades agotadas: {unidadesAgotadas} | 
              Peso vendido: {(pesoVendido / 1000).toFixed(1)}kg
            </div>
          )}
        </div>

        {unidad.activa && !isHistorial && onEdit && onCut && (
          <div className="unit-actions">
            <button
              className="btn-action btn-cut"
              onClick={() => onCut(unidad)}
            >
              ✂️ Cortar
            </button>
            <button
              className="btn-action btn-edit"
              onClick={() => onEdit(unidad)}
            >
              ✏️ Editar
            </button>
          </div>
        )}
      </div>

      <div className="unit-details">
        <div className="detail-item">
          <div className="detail-label">Peso Inicial</div>
          <div className="detail-value">{unidad.pesoInicial}g</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Peso Actual</div>
          <div className="detail-value highlight">{unidad.pesoActual}g</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Cortado</div>
          <div className="detail-value">{Number(unidad.pesoInicial) - Number(unidad.pesoActual)}g</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Ingresado</div>
          <div className="detail-value" style={{ fontSize: '0.875rem' }}>
            {formatDate(unidad.createdAt)}
          </div>
        </div>
      </div>

      {unidad.motivo && (
        <div className="observaciones-section">
          <div className="observaciones-title">Motivo de Ingreso</div>
          <div className="observaciones-content">{unidad.motivo.nombre}</div>
        </div>
      )}

      {unidad.observacionesIngreso && (
        <div className="observaciones-section">
          <div className="observaciones-title">Observaciones de Ingreso</div>
          <div className="observaciones-content">{unidad.observacionesIngreso}</div>
        </div>
      )}

      {unidad.particiones && unidad.particiones.length > 0 && (
        <div className="partitions-section">
          <div className="partitions-header">
            <div className="partitions-title">Historial de Cortes</div>
            <div className="partitions-count">{unidad.particiones.length}</div>
          </div>
          <div className="partitions-list">
            {unidad.particiones.map((particion, idx) => (
              <div key={particion.id} className="partition-item">
                <div className="partition-number">Corte #{idx + 1}</div>
                <div className="partition-weight">{particion.peso}g</div>
                <div className="partition-date">{formatDate(particion.createdAt)}</div>
                {particion.observacionesCorte && (
                  <div className="partition-observaciones">{particion.observacionesCorte}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};