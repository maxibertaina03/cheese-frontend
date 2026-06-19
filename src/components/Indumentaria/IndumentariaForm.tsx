// src/components/Indumentaria/IndumentariaForm.tsx
import React, { useMemo, useState } from 'react';
import { Indumentaria, Proveedor } from '../../types';
import { Opcion, SelectConAgregar } from './SelectConAgregar';
import { ProveedorSelect } from './ProveedorSelect';

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

// Opciones base sugeridas; se combinan con las ya cargadas en la base.
const TALLES_DEFAULT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COLORES_DEFAULT = ['Blanco', 'Negro', 'Azul', 'Gris', 'Celeste', 'Verde', 'Rojo', 'Beige'];

export type OpcionesIndumentaria = {
  nombres: string[];
  talles: string[];
  colores: string[];
  categorias: string[];
};

// Une opciones por defecto + valores existentes, sin duplicar (case-insensitive).
const mergeStringOptions = (defaults: string[], existentes: string[]): Opcion[] => {
  const vistos = new Map<string, string>();
  [...defaults, ...existentes]
    .map((v) => (v ?? '').trim())
    .filter((v) => v.length > 0)
    .forEach((v) => {
      const clave = v.toLowerCase();
      if (!vistos.has(clave)) {
        vistos.set(clave, v);
      }
    });
  return Array.from(vistos.values())
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    .map((v) => ({ value: v, label: v }));
};

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
  opciones?: OpcionesIndumentaria;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onCreateProveedor?: (nombre: string) => Promise<Proveedor | null>;
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
  const { mode, proveedores, opciones, loading, error, onClose, onCreateProveedor } = props;
  const initial = mode === 'edit' ? props.initial : undefined;

  const nombreOptions = useMemo(
    () => mergeStringOptions([], opciones?.nombres ?? []),
    [opciones]
  );
  const talleOptions = useMemo(
    () => mergeStringOptions(TALLES_DEFAULT, opciones?.talles ?? []),
    [opciones]
  );
  const colorOptions = useMemo(
    () => mergeStringOptions(COLORES_DEFAULT, opciones?.colores ?? []),
    [opciones]
  );
  const categoriaOptions = useMemo<Opcion[]>(() => {
    const predefinidas = CATEGORIAS.map((c) => c.value.toLowerCase());
    const extra = (opciones?.categorias ?? [])
      .map((v) => (v ?? '').trim())
      .filter((v) => v.length > 0 && !predefinidas.includes(v.toLowerCase()))
      .map((v) => ({ value: v, label: v }));
    return [...CATEGORIAS, ...extra];
  }, [opciones]);

  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [stockInicial, setStockInicial] = useState<string>('');
  const [stockMinimo, setStockMinimo] = useState<string>(
    initial?.stockMinimo ? String(initial.stockMinimo) : ''
  );

  const stockInicialNum = Number(stockInicial) || 0;
  const stockMinimoNum = Number(stockMinimo) || 0;
  const [categoria, setCategoria] = useState(initial?.categoria || '');
  const [talle, setTalle] = useState(initial?.talle || '');
  const [color, setColor] = useState(initial?.color || '');
  const [genero, setGenero] = useState(initial?.genero || '');
  const [ubicacion, setUbicacion] = useState(initial?.ubicacion || '');
  const [proveedorId, setProveedorId] = useState<number | null>(initial?.proveedor?.id ?? null);
  const [observaciones, setObservaciones] = useState(initial?.observaciones || '');

  const canSubmit = useMemo(() => {
    if (mode === 'create') return nombre.trim().length > 0 && stockInicialNum >= 0 && proveedorId != null;
    return true;
  }, [mode, nombre, stockInicialNum, proveedorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const meta = {
      stockMinimo: stockMinimoNum,
      categoria: categoria || null,
      talle: talle.trim() ? talle.trim() : null,
      color: color.trim() ? color.trim() : null,
      genero: genero || null,
      ubicacion: ubicacion.trim() ? ubicacion.trim() : null,
      proveedorId: proveedorId ?? null,
      observaciones: observaciones.trim() ? observaciones.trim() : null,
    };

    if (mode === 'create') {
      props.onSubmit({ nombre: nombre.trim(), stockInicial: stockInicialNum, ...meta });
    } else {
      props.onSubmit(meta);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-section">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div className="alert-title">No se pudo guardar</div>
            <div>{error}</div>
          </div>
        </div>
      )}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre de la prenda</label>
          {mode === 'edit' ? (
            <input className="form-input" value={nombre} disabled />
          ) : (
            <SelectConAgregar
              value={nombre}
              onChange={setNombre}
              options={nombreOptions}
              placeholder="Seleccionar prenda..."
              addLabel="➕ Agregar nueva prenda..."
              inputPlaceholder="Ej: Camisa, Pantalón, Cofia"
              maxLength={200}
              required
            />
          )}
          {mode === 'edit' && <div className="form-hint">El nombre no se puede modificar</div>}
        </div>

        {mode === 'create' && (
          <div className="form-group">
            <label className="form-label">Cantidad inicial</label>
            <input
              type="number"
              className="form-input"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value)}
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
            onChange={(e) => setStockMinimo(e.target.value)}
            min={0}
            placeholder="Ej: 3"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Categoría</label>
          <SelectConAgregar
            value={categoria}
            onChange={setCategoria}
            options={categoriaOptions}
            placeholder="Sin categoría"
            addLabel="➕ Agregar nueva categoría..."
            inputPlaceholder="Ej: Calzado, Abrigo"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Talle</label>
          <SelectConAgregar
            value={talle}
            onChange={setTalle}
            options={talleOptions}
            placeholder="Seleccionar talle..."
            addLabel="➕ Agregar nuevo talle..."
            inputPlaceholder="Ej: 42, Único"
            maxLength={20}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <SelectConAgregar
            value={color}
            onChange={setColor}
            options={colorOptions}
            placeholder="Seleccionar color..."
            addLabel="➕ Agregar nuevo color..."
            inputPlaceholder="Ej: Bordó, Naranja"
            maxLength={50}
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
          <ProveedorSelect
            proveedores={proveedores}
            value={proveedorId}
            onChange={setProveedorId}
            onCreateProveedor={onCreateProveedor}
            required={mode === 'create'}
          />
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
