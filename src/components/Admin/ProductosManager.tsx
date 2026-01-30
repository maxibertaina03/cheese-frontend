// src/components/Admin/ProductosManager.tsx
import React, { useState } from 'react';
import { Producto, TipoQueso, CreateProductoData } from '../../types';
import { ProductoForm } from './ProductoForm';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProductosManagerProps {
  productos: Producto[];
  tiposQueso: TipoQueso[];
  loading: boolean;
  error: string;
  success: string;
  onCreate: (data: CreateProductoData) => Promise<{ success: boolean }>;
  onUpdate: (id: number, data: Partial<CreateProductoData>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

export const ProductosManager: React.FC<ProductosManagerProps> = ({
  productos,
  tiposQueso,
  loading,
  error,
  success,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoEliminando, setProductoEliminando] = useState<Producto | null>(null);

  const handleSubmit = async (data: CreateProductoData) => {
    let result;
    if (productoEditando) {
      result = await onUpdate(productoEditando.id, data);
    } else {
      result = await onCreate(data);
    }
    
    if (result.success) {
      setShowForm(false);
      setProductoEditando(null);
    }
  };

  const handleDelete = async () => {
    if (!productoEliminando) return;
    const result = await onDelete(productoEliminando.id);
    if (result.success) {
      setProductoEliminando(null);
    }
  };

  return (
    <div>
      {/* Header con botón nuevo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Gestión de Productos</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            setProductoEditando(null);
            setShowForm(true);
          }}
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">{error}</div>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">✓</div>
          <div className="alert-content">{success}</div>
        </div>
      )}

      {/* Tabla de productos */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Nombre</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>PLU</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Tipo</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Venta</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Precio</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#6b7280' }}>#{producto.id}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>{producto.nombre}</td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge badge-plu">{producto.plu}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge badge-${producto.tipoQueso.nombre.toLowerCase().replace(' ', '-')}`}>
                    {producto.tipoQueso.nombre}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {producto.seVendePorUnidad ? 'Por unidad' : 'Por peso'}
                </td>
                <td style={{ padding: '1rem' }}>
                  {producto.precio ? `$${producto.precio.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => {
                        setProductoEditando(producto);
                        setShowForm(true);
                      }}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => setProductoEliminando(producto)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {showForm && (
        <ProductoForm
          producto={productoEditando}
          tiposQueso={tiposQueso}
          loading={loading}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setProductoEditando(null);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!productoEliminando}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto?"
        itemName={productoEliminando?.nombre}
        onClose={() => setProductoEliminando(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
};