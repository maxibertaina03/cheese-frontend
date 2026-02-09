// src/components/Elementos/ElementoCard.tsx
import React from 'react';
import { Elemento, User } from '../../types';
import { usePermissions } from '../../utils/permissions';

interface ElementoCardProps {
  elemento: Elemento;
  user: User | null;
  onIngreso: (elemento: Elemento) => void;
  onEgreso: (elemento: Elemento) => void;
  onEdit: (elemento: Elemento) => void;
  onDelete: (elemento: Elemento) => void;
  onVerMovimientos: (elemento: Elemento) => void;
}

export const ElementoCard: React.FC<ElementoCardProps> = ({
  elemento,
  user,
  onIngreso,
  onEgreso,
  onEdit,
  onDelete,
  onVerMovimientos,
}) => {
  const { isAdmin } = usePermissions(user);
  const porcentaje = elemento.cantidadTotal > 0
    ? Math.round((elemento.cantidadDisponible / elemento.cantidadTotal) * 100)
    : 0;

  return (
    <div className="unit-card elemento-card">
      <div className="unit-header">
        <div className="unit-info">
          <div className="unit-title-row">
            <h3 className="unit-name">{elemento.nombre}</h3>
            <span className={`badge ${elemento.activo ? 'badge-status' : 'badge-inactive'}`}>
              {elemento.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="unit-id">ID: #{elemento.id}</div>
        </div>
        <div className="elemento-progress">
          <div className="elemento-progress-value">{porcentaje}%</div>
          <div className="elemento-progress-label">Disponible</div>
        </div>
      </div>

      <div className="unit-details">
        <div className="detail-item">
          <span className="detail-label">Disponible</span>
          <span className="detail-value highlight">{elemento.cantidadDisponible}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Total Histórico</span>
          <span className="detail-value">{elemento.cantidadTotal}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Estado</span>
          <span className="detail-value">{elemento.activo ? 'En stock' : 'Sin stock'}</span>
        </div>
      </div>

      {elemento.descripcion && (
        <div className="observaciones-section elemento-descripcion">
          <div className="observaciones-title">Descripción</div>
          <div className="observaciones-content">{elemento.descripcion}</div>
        </div>
      )}

      <div className="unit-actions elemento-actions">
        <button className="btn-action btn-view" onClick={() => onVerMovimientos(elemento)}>
          Historial
        </button>
        <button
          className="btn-action btn-ingreso"
          onClick={() => onIngreso(elemento)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Registrar ingreso'}
        >
          Ingreso
        </button>
        <button
          className="btn-action btn-egreso"
          onClick={() => onEgreso(elemento)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Registrar egreso'}
        >
          Egreso
        </button>
        <button
          className="btn-action btn-edit"
          onClick={() => onEdit(elemento)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Editar'}
        >
          Editar
        </button>
        <button
          className="btn-action btn-delete"
          onClick={() => onDelete(elemento)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Eliminar'}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};
