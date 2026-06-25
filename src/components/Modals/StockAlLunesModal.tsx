// src/components/Modals/StockAlLunesModal.tsx
import React from 'react';
import { StockAlCorteResponse } from '../../types';

interface StockAlLunesModalProps {
  data: StockAlCorteResponse | null;
  loading: boolean;
  onClose: () => void;
  onImprimir: () => void;
  imprimiendo: boolean;
}

const formatearFecha = (iso: string): string => {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatearFechaHora = (iso: string): string => {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatearPeso = (gramos: number): string => {
  // Los pesos se guardan en gramos. Mostramos en kg si es grande, si no en gramos.
  if (gramos >= 1000) {
    return `${(gramos / 1000).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }
  return `${gramos.toLocaleString('es-AR')} g`;
};

export const StockAlLunesModal: React.FC<StockAlLunesModalProps> = ({
  data,
  loading,
  onClose,
  onImprimir,
  imprimiendo,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
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
              Lo que había en stock el <strong>{formatearFecha(data.fechaCorte)}</strong>
            </p>

            {/* Sección 1: stock al lunes, por producto */}
            {data.productos.length === 0 ? (
              <div className="empty-state">
                <p>No había quesos en stock en esa fecha.</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
                {data.productos.map((item) => (
                  <li
                    key={item.productoId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.25rem',
                      borderBottom: '1px solid var(--border-color, #eee)',
                    }}
                  >
                    <span>
                      {item.producto}
                      {item.tipoQueso && (
                        <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>
                          {'  '}· {item.tipoQueso}
                        </span>
                      )}
                    </span>
                    <strong style={{ fontSize: '1.05rem', whiteSpace: 'nowrap' }}>{item.cantidad}</strong>
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
              <span>Total de quesos ese lunes</span>
              <span>{data.totalUnidades}</span>
            </div>

            {/* Sección 2: lo que salió o se cortó desde el lunes */}
            <h4 style={{ margin: '1.5rem 0 0.5rem' }}>Lo que salió o se cortó desde entonces</h4>

            {data.movimientos.length === 0 ? (
              <p style={{ color: 'var(--text-secondary, #888)', margin: '0.25rem 0' }}>
                No salió ni se cortó ningún queso desde el lunes.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
                {data.movimientos.map((mov, idx) => (
                  <li
                    key={`${mov.unidadId}-${idx}`}
                    style={{
                      padding: '0.55rem 0.25rem',
                      borderBottom: '1px solid var(--border-color, #f0f0f0)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span>
                        <strong>{mov.producto}</strong>
                        <span style={{ color: 'var(--text-secondary, #888)' }}> (#{mov.unidadId})</span>
                      </span>
                      <span style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>
                        {formatearFechaHora(mov.fecha)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #555)' }}>
                      {mov.tipo === 'baja' ? (
                        <span>Dado de baja</span>
                      ) : mov.tipo === 'venta' ? (
                        <span>
                          Vendido (nota de pedido)
                          {mov.peso != null ? ` · ${formatearPeso(mov.peso)}` : ''}
                        </span>
                      ) : (
                        <span>
                          Se cortó {mov.peso != null ? formatearPeso(mov.peso) : ''}
                          {mov.motivo ? ` · ${mov.motivo}` : ''}
                        </span>
                      )}
                      {mov.agotoUnidad && mov.tipo === 'corte' && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            color: '#c0392b',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          · quedó agotado
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="modal-actions">
          <button
            className="btn-export"
            onClick={onImprimir}
            disabled={loading || !data || imprimiendo}
          >
            {imprimiendo ? 'Generando PDF...' : 'Imprimir PDF'}
          </button>
          <button className="btn-confirm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
