// src/components/Indumentaria/MovimientoModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Indumentaria, Proveedor } from '../../types';

type IngresoData = {
  cantidad: number;
  proveedorId?: number | null;
  documentoReferencia?: string | null;
  observaciones?: string | null;
};

type EgresoData = {
  cantidad: number;
  destino: string;
  observaciones?: string | null;
};

interface Props {
  isOpen: boolean;
  tipo: 'ingreso' | 'egreso';
  prenda: Indumentaria | null;
  proveedores: Proveedor[];
  loading?: boolean;
  onClose: () => void;
  onSubmitIngreso: (data: IngresoData) => void;
  onSubmitEgreso: (data: EgresoData) => void;
}

export const MovimientoModal: React.FC<Props> = ({
  isOpen,
  tipo,
  prenda,
  proveedores,
  loading,
  onClose,
  onSubmitIngreso,
  onSubmitEgreso,
}) => {
  const [cantidad, setCantidad] = useState(0);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [documentoReferencia, setDocumentoReferencia] = useState('');
  const [destino, setDestino] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCantidad(0);
      setProveedorId(prenda?.proveedor?.id ?? null);
      setDocumentoReferencia('');
      setDestino('');
      setObservaciones('');
    }
  }, [isOpen, prenda]);

  const canSubmit = useMemo(() => {
    if (!prenda) return false;
    if (cantidad <= 0) return false;
    if (tipo === 'egreso') {
      if (cantidad > prenda.cantidadDisponible) return false;
      if (!destino.trim()) return false;
    }
    return true;
  }, [cantidad, prenda, tipo, destino]);

  if (!isOpen || !prenda) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const obs = observaciones.trim() ? observaciones.trim() : null;
    if (tipo === 'ingreso') {
      onSubmitIngreso({
        cantidad,
        proveedorId: proveedorId ?? null,
        documentoReferencia: documentoReferencia.trim() ? documentoReferencia.trim() : null,
        observaciones: obs,
      });
    } else {
      onSubmitEgreso({ cantidad, destino: destino.trim(), observaciones: obs });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar entrega'}
            </h3>
            <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              {prenda.nombre}
              {prenda.talle ? ` · Talle ${prenda.talle}` : ''} (ID #{prenda.id})
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            ❌
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-input"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                min={1}
                max={tipo === 'egreso' ? prenda.cantidadDisponible : undefined}
                placeholder="Ej: 2"
                required
              />
              {tipo === 'egreso' && (
                <div className="form-hint">Disponible: {prenda.cantidadDisponible}</div>
              )}
            </div>

            {tipo === 'ingreso' && (
              <>
                <div className="form-group">
                  <label className="form-label">Proveedor (opcional)</label>
                  <select
                    className="form-select"
                    value={proveedorId ?? ''}
                    onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">N° remito / factura (opcional)</label>
                  <input
                    className="form-input"
                    value={documentoReferencia}
                    onChange={(e) => setDocumentoReferencia(e.target.value)}
                    placeholder="Ej: R-0001234"
                  />
                </div>
              </>
            )}

            {tipo === 'egreso' && (
              <div className="form-group">
                <label className="form-label">Destino de la entrega *</label>
                <input
                  className="form-input"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ej: Juan Pérez - Sector Producción"
                  required
                />
                <div className="form-hint">A dónde / a quién se entregó la prenda</div>
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
              {tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
