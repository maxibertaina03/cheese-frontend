// src/components/Elementos/MovimientosModal.tsx
import React from 'react';
import { Elemento, MovimientoElemento } from '../../types';
import { formatDate } from '../../utils/dates';

interface MovimientosModalProps {
  isOpen: boolean;
  elemento: Elemento | null;
  movimientos: MovimientoElemento[];
  loading?: boolean;
  onClose: () => void;
}

export const MovimientosModal: React.FC<MovimientosModalProps> = ({
  isOpen,
  elemento,
  movimientos,
  loading,
  onClose,
}) => {
  if (!isOpen || !elemento) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Historial de movimientos</h3>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {elemento.nombre} (ID #{elemento.id})
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            ❌
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div className="empty-state">
              <h3>Cargando movimientos...</h3>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="empty-state">
              <h3>Sin movimientos</h3>
              <p>Este elemento todavía no tiene ingresos o egresos</p>
            </div>
          ) : (
            <div className="movement-list">
              {movimientos.map((mov) => (
                <div key={mov.id} className="movement-item">
                  <div className={`movement-type ${mov.tipo === 'ingreso' ? 'ingreso' : 'egreso'}`}>
                    {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </div>
                  <div className="movement-content">
                    <div className="movement-qty">{mov.cantidad} unidades</div>
                    {mov.motivo?.nombre && (
                      <div className="movement-motivo">Motivo: {mov.motivo.nombre}</div>
                    )}
                    {mov.observaciones && (
                      <div className="movement-obs">{mov.observaciones}</div>
                    )}
                  </div>
                  <div className="movement-meta">
                    <div>{formatDate(mov.createdAt)}</div>
                    {mov.creadoPor?.email && (
                      <div className="movement-user">{mov.creadoPor.email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
