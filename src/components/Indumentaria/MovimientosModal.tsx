// src/components/Indumentaria/MovimientosModal.tsx
import React from 'react';
import { Indumentaria, MovimientoIndumentaria } from '../../types';
import { formatDate } from '../../utils/dates';

interface Props {
  isOpen: boolean;
  prenda: Indumentaria | null;
  movimientos: MovimientoIndumentaria[];
  loading?: boolean;
  onClose: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Entrega',
  AJUSTE: 'Ajuste',
};

export const MovimientosModal: React.FC<Props> = ({
  isOpen,
  prenda,
  movimientos,
  loading,
  onClose,
}) => {
  if (!isOpen || !prenda) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Historial de movimientos</h3>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {prenda.nombre} (ID #{prenda.id})
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
              <p>Esta prenda todavía no tiene ingresos o entregas</p>
            </div>
          ) : (
            <div className="movement-list">
              {movimientos.map((mov) => (
                <div key={mov.id} className="movement-item">
                  <div
                    className={`movement-type ${mov.tipo === 'INGRESO' ? 'ingreso' : 'egreso'}`}
                  >
                    {TIPO_LABEL[mov.tipo] || mov.tipo}
                  </div>
                  <div className="movement-content">
                    <div className="movement-qty">{mov.cantidad} unidades</div>
                    {mov.destino && (
                      <div className="movement-motivo">Destino: {mov.destino}</div>
                    )}
                    {mov.proveedor?.nombre && (
                      <div className="movement-motivo">Proveedor: {mov.proveedor.nombre}</div>
                    )}
                    {mov.documentoReferencia && (
                      <div className="movement-obs">Ref: {mov.documentoReferencia}</div>
                    )}
                    {mov.observaciones && <div className="movement-obs">{mov.observaciones}</div>}
                  </div>
                  <div className="movement-meta">
                    <div>{formatDate(mov.fechaMovimiento || mov.createdAt)}</div>
                    {mov.usuario?.email && (
                      <div className="movement-user">{mov.usuario.email}</div>
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
