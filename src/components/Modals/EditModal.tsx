// src/components/Modals/EditModal.tsx
import React, { useState } from 'react';
import { Unidad } from '../../types';

interface EditModalProps {
  unidad: Unidad | null;
  onClose: () => void;
  onSave: (observaciones: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ unidad, onClose, onSave }) => {
  const [observaciones, setObservaciones] = useState(unidad?.observacionesIngreso || '');

  if (!unidad) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Editar Unidad</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Producto</label>
          <input type="text" className="form-input" value={unidad.producto.nombre} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Observaciones de Ingreso</label>
          <textarea
            className="form-input"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
            placeholder="Ej: Lote #123, Vencimiento: 15/03, etc."
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm" onClick={() => onSave(observaciones)}>Guardar</button>
        </div>
      </div>
    </div>
  );
};