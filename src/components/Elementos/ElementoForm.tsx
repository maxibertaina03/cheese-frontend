// src/components/Elementos/ElementoForm.tsx
import React, { useMemo, useState } from 'react';

type ElementoFormBaseValues = {
  nombre?: string;
  descripcion?: string | null;
  cantidadTotal?: number;
};

type ElementoFormCreateProps = {
  mode: 'create';
  initialValues?: ElementoFormBaseValues;
  loading?: boolean;
  onSubmit: (data: { nombre: string; descripcion?: string | null; cantidadTotal: number }) => void;
  onClose: () => void;
};

type ElementoFormEditProps = {
  mode: 'edit';
  initialValues?: ElementoFormBaseValues;
  loading?: boolean;
  onSubmit: (data: { nombre: string; descripcion?: string | null }) => void;
  onClose: () => void;
};

type ElementoFormProps = ElementoFormCreateProps | ElementoFormEditProps;

export const ElementoForm: React.FC<ElementoFormProps> = ({
  mode,
  initialValues,
  loading,
  onSubmit,
  onClose,
}) => {
  const [nombre, setNombre] = useState(initialValues?.nombre || '');
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion || '');
  const [cantidadTotal, setCantidadTotal] = useState<number>(initialValues?.cantidadTotal || 0);

  const canSubmit = useMemo(() => {
    if (!nombre.trim()) return false;
    if (mode === 'create') return cantidadTotal > 0;
    return true;
  }, [nombre, cantidadTotal, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payloadBase = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() ? descripcion.trim() : null,
    };
    if (mode === 'create') {
      onSubmit({ ...payloadBase, cantidadTotal });
      return;
    }
    onSubmit(payloadBase);
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre del elemento</label>
          <input
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: girolle, tornillo, caja"
            required
          />
        </div>

        {mode === 'create' && (
          <div className="form-group">
            <label className="form-label">Cantidad inicial</label>
            <input
              type="number"
              className="form-input"
              value={cantidadTotal}
              onChange={(e) => setCantidadTotal(Number(e.target.value))}
              min={1}
              placeholder="Ej: 10"
              required
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Descripción (opcional)</label>
        <textarea
          className="form-input"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Detalle o notas de uso"
          rows={3}
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn-confirm" disabled={!canSubmit || loading}>
          {mode === 'create' ? 'Crear elemento' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
