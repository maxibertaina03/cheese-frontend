// src/components/Modals/StockAlLunesModal.tsx
import React from 'react';
import { StockAlCorteResponse } from '../../types';

interface StockAlLunesModalProps {
  data: StockAlCorteResponse | null;
  loading: boolean;
  onClose: () => void;
}

const formatearFecha = (iso: string): string => {
  const fecha = new Date(iso);
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const StockAlLunesModal: React.FC<StockAlLunesModalProps> = ({ data, loading, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Stock al último lunes</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Calculando stock...</p>
          </div>
        ) : !data ? (
          <div className="empty-state">
            <p>No se pudo obtener el listado.</p>
          </div>
        ) : (
          <>
            <p style={{ marginTop: 0, color: 'var(--text-secondary, #666)' }}>
              Cantidad de quesos en stock al <strong>{formatearFecha(data.fechaCorte)}</strong>
            </p>

            {data.items.length === 0 ? (
              <div className="empty-state">
                <p>No había quesos en stock en esa fecha.</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
                {data.items.map((item) => (
                  <li
                    key={item.tipoQuesoId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.25rem',
                      borderBottom: '1px solid var(--border-color, #eee)',
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{item.tipoQueso}</span>
                    <strong style={{ fontSize: '1.05rem' }}>{item.cantidad}</strong>
                  </li>
                ))}
              </ul>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                marginTop: '0.25rem',
                borderTop: '2px solid var(--border-color, #ddd)',
                fontWeight: 600,
              }}
            >
              <span>Total de quesos</span>
              <span>{data.totalUnidades}</span>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn-confirm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
