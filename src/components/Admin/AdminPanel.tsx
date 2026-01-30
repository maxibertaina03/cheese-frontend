// src/components/Admin/AdminPanel.tsx
import React, { useState } from 'react';
import { ProductosManager } from './ProductosManager';
import { UsuariosManager } from './UsuariosManager';
import { Producto, TipoQueso, CreateProductoData } from '../../types';
import { Usuario } from '../../hooks/useUsuarios';

interface AdminPanelProps {
  // Productos
  productos: Producto[];
  tiposQueso: TipoQueso[];
  loadingProductos: boolean;
  errorProductos: string;
  successProductos: string;
  onCreateProducto: (data: CreateProductoData) => Promise<{ success: boolean }>;
  onUpdateProducto: (id: number, data: Partial<CreateProductoData>) => Promise<{ success: boolean }>;
  onDeleteProducto: (id: number) => Promise<{ success: boolean }>;
  
  // Usuarios
  usuarios: Usuario[];
  loadingUsuarios: boolean;
  errorUsuarios: string;
  successUsuarios: string;
  onCreateUsuario: (data: { username: string; password: string; rol: 'admin' | 'usuario' }) => Promise<{ success: boolean }>;
  onUpdateUsuario: (id: number, data: Partial<Usuario>) => Promise<{ success: boolean }>;
  onDeleteUsuario: (id: number) => Promise<{ success: boolean }>;
  
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  // Productos
  productos,
  tiposQueso,
  loadingProductos,
  errorProductos,
  successProductos,
  onCreateProducto,
  onUpdateProducto,
  onDeleteProducto,
  
  // Usuarios
  usuarios,
  loadingUsuarios,
  errorUsuarios,
  successUsuarios,
  onCreateUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'productos' | 'usuarios'>('productos');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal historial-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">⚙️ Panel de Administración</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0.5rem'
        }}>
          <button
            className={`filter-btn ${activeTab === 'productos' ? 'active' : ''}`}
            onClick={() => setActiveTab('productos')}
            style={{ flex: 1 }}
          >
            📦 Productos
          </button>
          <button
            className={`filter-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('usuarios')}
            style={{ flex: 1 }}
          >
            👥 Usuarios
          </button>
        </div>

        {/* Contenido */}
        {activeTab === 'productos' ? (
          <ProductosManager
            productos={productos}
            tiposQueso={tiposQueso}
            loading={loadingProductos}
            error={errorProductos}
            success={successProductos}
            onCreate={onCreateProducto}
            onUpdate={onUpdateProducto}
            onDelete={onDeleteProducto}
          />
        ) : (
          <UsuariosManager
            usuarios={usuarios}
            loading={loadingUsuarios}
            error={errorUsuarios}
            success={successUsuarios}
            onCreate={onCreateUsuario}
            onUpdate={onUpdateUsuario}
            onDelete={onDeleteUsuario}
          />
        )}
      </div>
    </div>
  );
};