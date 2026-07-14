// src/contextos/indumentaria/componentes/IndumentariaCard.tsx
import React from 'react';
import { Indumentaria, User } from '../../../types';
import { usePermissions } from '../../../utils/permissions';

interface Props {
  prenda: Indumentaria;
  user: User | null;
  onIngreso: (prenda: Indumentaria) => void;
  onEgreso: (prenda: Indumentaria) => void;
  onEdit: (prenda: Indumentaria) => void;
  onDelete: (prenda: Indumentaria) => void;
  onVerMovimientos: (prenda: Indumentaria) => void;
}

const CATEGORIA_LABEL: Record<string, string> = {
  blanca: 'Blanca',
  azul: 'Azul',
  oficina: 'Oficina',
  otra: 'Otra',
};

export const IndumentariaCard: React.FC<Props> = ({
  prenda,
  user,
  onIngreso,
  onEgreso,
  onEdit,
  onDelete,
  onVerMovimientos,
}) => {
  const { canEdit: isAdmin } = usePermissions(user, 'indumentaria');
  const stockBajo = prenda.stockMinimo > 0 && prenda.cantidadDisponible <= prenda.stockMinimo;

  return (
    <div className="unit-card elemento-card">
      <div className="unit-header">
        <div className="unit-info">
          <div className="unit-title-row">
            <h3 className="unit-name">{prenda.nombre}</h3>
            {prenda.categoria && (
              <span className="badge badge-status">
                {CATEGORIA_LABEL[prenda.categoria] || prenda.categoria}
              </span>
            )}
            {stockBajo && <span className="badge badge-inactive">Stock bajo</span>}
          </div>
          <div className="unit-id">ID: #{prenda.id}</div>
        </div>
        <div className="elemento-progress">
          <div className="elemento-progress-value">{prenda.cantidadDisponible}</div>
          <div className="elemento-progress-label">Disponible</div>
        </div>
      </div>

      <div className="unit-details">
        {prenda.talle && (
          <div className="detail-item">
            <span className="detail-label">Talle</span>
            <span className="detail-value">{prenda.talle}</span>
          </div>
        )}
        {prenda.color && (
          <div className="detail-item">
            <span className="detail-label">Color</span>
            <span className="detail-value">{prenda.color}</span>
          </div>
        )}
        {prenda.genero && (
          <div className="detail-item">
            <span className="detail-label">Género</span>
            <span className="detail-value">{prenda.genero}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Stock mínimo</span>
          <span className="detail-value">{prenda.stockMinimo}</span>
        </div>
        {prenda.ubicacion && (
          <div className="detail-item">
            <span className="detail-label">Ubicación</span>
            <span className="detail-value">{prenda.ubicacion}</span>
          </div>
        )}
        {prenda.proveedor && (
          <div className="detail-item">
            <span className="detail-label">Proveedor</span>
            <span className="detail-value">{prenda.proveedor.nombre}</span>
          </div>
        )}
      </div>

      {prenda.observaciones && (
        <div className="observaciones-section elemento-descripcion">
          <div className="observaciones-title">Observaciones</div>
          <div className="observaciones-content">{prenda.observaciones}</div>
        </div>
      )}

      <div className="unit-actions elemento-actions">
        <button className="btn-action btn-view" onClick={() => onVerMovimientos(prenda)}>
          Historial
        </button>
        <button
          className="btn-action btn-ingreso"
          onClick={() => onIngreso(prenda)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Registrar ingreso'}
        >
          Ingreso
        </button>
        <button
          className="btn-action btn-egreso"
          onClick={() => onEgreso(prenda)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Registrar entrega'}
        >
          Entrega
        </button>
        <button
          className="btn-action btn-edit"
          onClick={() => onEdit(prenda)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Editar'}
        >
          Editar
        </button>
        <button
          className="btn-action btn-delete"
          onClick={() => onDelete(prenda)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Solo admin' : 'Eliminar'}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};
