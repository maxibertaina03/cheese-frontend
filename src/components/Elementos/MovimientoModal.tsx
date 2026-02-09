// src/components/Elementos/MovimientoModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Elemento, Motivo } from '../../types';

interface MovimientoModalProps {
  isOpen: boolean;
  tipo: 'ingreso' | 'egreso';
  elemento: Elemento | null;
  motivos: Motivo[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: { cantidad: number; motivoId?: number | null; observaciones?: string | null }) => void;
}

export const MovimientoModal: React.FC<MovimientoModalProps> = ({
  isOpen,
  tipo,
  elemento,
  motivos,
  loading,
  onClose,
  onSubmit,
}) => {
  const [cantidad, setCantidad] = useState(0);
  const [motivoId, setMotivoId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCantidad(0);
      setMotivoId(null);
      setObservaciones('');
    }
  }, [isOpen]);

  const canSubmit = useMemo(() => {
    if (!elemento) return false;
    if (cantidad <= 0) return false;
    if (tipo === 'egreso' && cantidad > elemento.cantidadDisponible) return false;
    return true;
  }, [cantidad, elemento, tipo]);

  if (!isOpen || !elemento) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
            </h3>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {elemento.nombre} (ID #{elemento.id})
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            ❌
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit({
              cantidad,
              motivoId: tipo === 'egreso' ? motivoId : null,
              observaciones: observaciones.trim() ? observaciones.trim() : null,
            });
          }}
        >
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-input"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                min={1}
                max={tipo === 'egreso' ? elemento.cantidadDisponible : undefined}
                placeholder="Ej: 2"
                required
              />
              {tipo === 'egreso' && (
                <div className="form-hint">
                  Disponible: {elemento.cantidadDisponible}
                </div>
              )}
            </div>

            {tipo === 'egreso' && (
              <div className="form-group">
                <label className="form-label">Motivo (opcional)</label>
                <select
                  className="form-select"
                  value={motivoId ?? ''}
                  onChange={(e) => setMotivoId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Sin motivo</option>
                  {motivos.map((motivo) => (
                    <option key={motivo.id} value={motivo.id}>
                      {motivo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Observaciones (opcional)</label>
              <textarea
                className="form-input"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Detalle del movimiento"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-confirm" disabled={!canSubmit || loading}>
              {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
