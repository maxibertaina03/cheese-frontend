// src/components/Inventory/UnidadCard.tsx - Versión corregida
import React from 'react';
import { Unidad, User } from '../../types';
import { formatDate } from '../../utils/dates';
import { usePermissions } from '../../utils/permissions';

interface UnidadCardProps {
  unidad: Unidad;
  user: User | null;
  stockCount?: number;
  stockActual?: number;
  unidadesAgotadas?: number;
  pesoVendido?: number;
  onEdit?: (unidad: Unidad) => void;
  onCut?: (unidad: Unidad) => void;
  onDelete?: (unidad: Unidad) => void;
  isHistorial: boolean;
  vistaMode?: 'lista' | 'grid';
}

export const UnidadCard: React.FC<UnidadCardProps> = ({
  unidad,
  user,
  stockCount,
  stockActual,
  unidadesAgotadas,
  pesoVendido,
  onEdit,
  onCut,
  onDelete,
  isHistorial,
  vistaMode = 'lista',
}) => {
  const { canDelete, canEdit, canCut } = usePermissions(user);

  if (!unidad.producto) return null;

  const getTipoBadgeClass = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'blando': 'badge-blando',
      'semi-duro': 'badge-semi-duro',
      'duro': 'badge-duro',
    };
    return tipos[tipo?.toLowerCase()] || 'badge-blando';
  };

  // RENDER MODO GRID - Cards compactas cuadradas
  if (vistaMode === 'grid') {
    return (
      <div className="unit-card-grid">
        <div className="grid-header">
          <div className="grid-badges">
            <span className={`badge-mini ${getTipoBadgeClass(unidad.producto.tipoQueso.nombre)}`}>
              {unidad.producto.tipoQueso.nombre}
            </span>
            <span className="badge-mini badge-plu-mini">
              {unidad.producto.plu}
            </span>
            {!isHistorial && stockCount !== undefined && stockCount > 1 && (
              <span className="badge-mini badge-stock-mini">
                {stockCount}
              </span>
            )}
          </div>
          <span className="grid-id">#{unidad.id}</span>
        </div>

        <h3 className="grid-title" title={unidad.producto.nombre}>
          {unidad.producto.nombre}
        </h3>

        <div className="grid-peso-box">
          <span className="grid-peso-valor">{unidad.pesoActual}g</span>
          {/* ✅ CORREGIDO: Mostrar "agotado" en historial cuando no está activa */}
          <span className="grid-peso-label" style={{ 
            color: (isHistorial && !unidad.activa) ? '#dc2626' : 'inherit',
            fontWeight: (isHistorial && !unidad.activa) ? 600 : 'normal'
          }}>
            {(isHistorial && !unidad.activa) ? 'agotado' : `de ${unidad.pesoInicial}g`}
          </span>
        </div>

        <div className="grid-meta">
          <span className={`grid-estado ${unidad.activa ? 'activo' : 'inactivo'}`}>
            {unidad.activa ? '● Activa' : '● Agotada'}
          </span>
          <span className="grid-fecha">
            {new Date(unidad.createdAt).toLocaleDateString('es-AR', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </span>
        </div>

        {!isHistorial && unidad.activa && (canCut || canEdit || canDelete) && (
          <div className="grid-botones">
            {canCut && onCut && (
              <button className="grid-btn grid-btn-cortar" onClick={() => onCut(unidad)} title="Cortar">
                ✂️
              </button>
            )}
            {canEdit && onEdit && (
              <button className="grid-btn grid-btn-editar" onClick={() => onEdit(unidad)} title="Editar">
                ✏️
              </button>
            )}
            {canDelete && onDelete && (
              <button className="grid-btn grid-btn-eliminar" onClick={() => onDelete(unidad)} title="Eliminar">
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // RENDER MODO LISTA - Vista detallada vertical
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
            
            {isHistorial && stockActual !== undefined && (
              <span className="badge badge-stock">
                Stock Actual: {stockActual}
              </span>
            )}
            
            {!isHistorial && unidad.activa && stockCount !== undefined && (
              <span className="badge badge-stock">
                Stock: {stockCount}
              </span>
            )}
          </div>
          <h3 className="unit-name">{unidad.producto.nombre}</h3>
          <div className="unit-id">ID: #{unidad.id}</div>
          
          {isHistorial && !unidad.activa && unidadesAgotadas !== undefined && pesoVendido !== undefined && (
            <div className="historial-info">
              Unidades agotadas: {unidadesAgotadas} | 
              Peso vendido: {(pesoVendido / 1000).toFixed(1)}kg
            </div>
          )}
        </div>

        {unidad.activa && !isHistorial && (
          <div className="unit-actions">
            {canCut && onCut && (
              <button className="btn-action btn-cut" onClick={() => onCut(unidad)}>
                ✂️ Cortar
              </button>
            )}
            {canEdit && onEdit && (
              <button className="btn-action btn-edit" onClick={() => onEdit(unidad)}>
                ✏️ Editar
              </button>
            )}
            {canDelete && onDelete && (
              <button className="btn-action btn-delete" onClick={() => onDelete(unidad)} title="Eliminar">
                🗑️
              </button>
            )}
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
          <div className="detail-value">{formatDate(unidad.createdAt)}</div>
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
            <div className="partitions-title">Historial de Cortes ({unidad.particiones.length})</div>
          </div>
          <div className="partitions-list">
            {unidad.particiones.map((particion: any, idx) => (
              <div key={particion.id}>
                <div className="partition-item">
                  <span>#{idx + 1}</span>
                  <span>{particion.peso}g</span>
                  <span>{formatDate(particion.createdAt)}</span>
                </div>
                
                {particion.observacionesCorte && particion.observacionesCorte !== 'Corte sin observaciones' && (
                  <div className="partition-observacion">
                    <strong>Observación:</strong> {particion.observacionesCorte}
                  </div>
                )}
                
                {particion.motivo && (
                  <div className="partition-motivo">
                    {particion.motivo.nombre}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};