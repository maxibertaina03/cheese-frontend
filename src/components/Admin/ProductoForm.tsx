// src/components/Admin/ProductoForm.tsx
import React, { useState, useEffect } from 'react';
import { Producto, TipoQueso, CreateProductoData } from '../../types';

interface ProductoFormProps {
  producto?: Producto | null;  // Si existe, es modo edición
  tiposQueso: TipoQueso[];
  loading: boolean;
  onSubmit: (data: CreateProductoData) => Promise<void>;
  onClose: () => void;
}

export const ProductoForm: React.FC<ProductoFormProps> = ({
  producto,
  tiposQueso,
  loading,
  onSubmit,
  onClose,
}) => {
  const isEditing = !!producto;

  const [formData, setFormData] = useState<CreateProductoData>({
    nombre: '',
    plu: '',
    seVendePorUnidad: false,
    tipoQuesoId: tiposQueso[0]?.id || 0,
    precio: undefined,
  });

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        plu: producto.plu,
        seVendePorUnidad: producto.seVendePorUnidad,
        tipoQuesoId: producto.tipoQueso.id,
        precio: producto.precio,
      });
    }
  }, [producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className="form-input"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Queso Cremoso"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">PLU *</label>
            <input
              type="text"
              className="form-input"
              value={formData.plu}
              onChange={(e) => setFormData({ ...formData, plu: e.target.value })}
              placeholder="Ej: 2001"
              maxLength={5}
              required
            />
            <div className="form-hint">Código de 5 dígitos para el lector de barras</div>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Queso *</label>
            <select
              className="form-select"
              value={formData.tipoQuesoId}
              onChange={(e) => setFormData({ ...formData, tipoQuesoId: Number(e.target.value) })}
              required
            >
              {tiposQueso.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Precio (opcional)</label>
            <input
              type="number"
              className="form-input"
              value={formData.precio || ''}
              onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) || undefined })}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.seVendePorUnidad}
                onChange={(e) => setFormData({ ...formData, seVendePorUnidad: e.target.checked })}
              />
              Se vende por unidad (no por peso)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-confirm"
              disabled={loading || !formData.nombre || !formData.plu}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};