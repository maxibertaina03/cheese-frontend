// src/components/Indumentaria/IndumentariaForm.tsx
import React, { useMemo, useState } from 'react';
import { Indumentaria, Proveedor } from '../../types';

const CATEGORIAS = [
  { value: 'blanca', label: 'Ropa blanca (producción)' },
  { value: 'azul', label: 'Ropa azul (mantenimiento)' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'otra', label: 'Otra' },
];

const GENEROS = [
  { value: 'unisex', label: 'Unisex' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
];

type CreateData = {
  nombre: string;
  stockInicial: number;
  stockMinimo: number;
  categoria?: string | null;
  talle?: string | null;
  color?: string | null;
  genero?: string | null;
  ubicacion?: string | null;
  proveedorId?: number | null;
  observaciones?: string | null;
};

type UpdateData = Omit<CreateData, 'nombre' | 'stockInicial'>;

type CommonProps = {
  proveedores: Proveedor[];
  loading?: boolean;
  onClose: () => void;
};

type CreateProps = CommonProps & {
  mode: 'create';
  initial?: undefined;
  onSubmit: (data: CreateData) => void;
};

type EditProps = CommonProps & {
  mode: 'edit';
  initial: Indumentaria;
  onSubmit: (data: UpdateData) => void;
};

type Props = CreateProps | EditProps;

export const IndumentariaForm: React.FC<Props> = (props) => {
  const { mode, proveedores, loading, onClose } = props;
  const initial = mode === 'edit' ? props.initial : undefined;

  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [stockInicial, setStockInicial] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(initial?.stockMinimo ?? 0);
  const [categoria, setCategoria] = useState(initial?.categoria || '');
  const [talle, setTalle] = useState(initial?.talle || '');
  const [color, setColor] = useState(initial?.color || '');
  const [genero, setGenero] = useState(initial?.genero || '');
  const [ubicacion, setUbicacion] = useState(initial?.ubicacion || '');
  const [proveedorId, setProveedorId] = useState<number | null>(initial?.proveedor?.id ?? null);
  const [observaciones, setObservaciones] = useState(initial?.observaciones || '');

  const canSubmit = useMemo(() => {
    if (mode === 'create') return nombre.trim().length > 0 && stockInicial >= 0 && proveedorId != null;
    return true;
  }, [mode, nombre, stockInicial, proveedorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const meta = {
      stockMinimo: Number(stockMinimo) || 0,
      categoria: categoria || null,
      talle: talle.trim() ? talle.trim() : null,
      color: color.trim() ? color.trim() : null,
      genero: genero || null,
      ubicacion: ubicacion.trim() ? ubicacion.trim() : null,
      proveedorId: proveedorId ?? null,
      observaciones: observaciones.trim() ? observaciones.trim() : null,
    };

    if (mode === 'create') {
      props.onSubmit({ nombre: nombre.trim(), stockInicial: Number(stockInicial) || 0, ...meta });
    } else {
      props.onSubmit(meta);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre de la prenda</label>
          <input
            className="form-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Camisa, Pantalón, Cofia"
            disabled={mode === 'edit'}
            required={mode === 'create'}
          />
          {mode === 'edit' && <div className="form-hint">El nombre no se puede modificar</div>}
        </div>

        {mode === 'create' && (
          <div className="form-group">
            <label className="form-label">Cantidad inicial</label>
            <input
              type="number"
              className="form-input"
              value={stockInicial}
              onChange={(e) => setStockInicial(Number(e.target.value))}
              min={0}
              placeholder="Ej: 10"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Stock mínimo (alerta)</label>
          <input
            type="number"
            className="form-input"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(Number(e.target.value))}
            min={0}
            placeholder="Ej: 3"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Talle</label>
          <input
            className="form-input"
            value={talle}
            onChange={(e) => setTalle(e.target.value)}
            placeholder="Ej: M, XL, 42"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            className="form-input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ej: Blanco, Azul"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Género</label>
          <select className="form-select" value={genero} onChange={(e) => setGenero(e.target.value)}>
            <option value="">Sin especificar</option>
            {GENEROS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input
            className="form-input"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ej: Depósito, Estante 3"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Proveedor</label>
          <select
            className="form-select"
            value={proveedorId ?? ''}
            onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
            required={mode === 'create'}
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Observaciones (opcional)</label>
        <textarea
          className="form-input"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={3}
          placeholder="Notas adicionales"
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn-confirm" disabled={!canSubmit || loading}>
          {mode === 'create' ? 'Crear prenda' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
