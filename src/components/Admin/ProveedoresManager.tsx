// src/components/Admin/ProveedoresManager.tsx
import React, { useEffect, useState } from 'react';
import { Proveedor } from '../../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface Props {
  proveedores: Proveedor[];
  loading: boolean;
  error: string;
  success: string;
  onClearError?: () => void;
  onCreate: (data: Partial<Proveedor>) => Promise<{ success: boolean }>;
  onUpdate: (id: number, data: Partial<Proveedor>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

const emptyForm = {
  nombre: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  observaciones: '',
};

export const ProveedoresManager: React.FC<Props> = ({
  proveedores,
  loading,
  error,
  success,
  onClearError,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [eliminando, setEliminando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editando) {
      setForm({
        nombre: editando.nombre || '',
        contacto: editando.contacto || '',
        telefono: editando.telefono || '',
        email: editando.email || '',
        direccion: editando.direccion || '',
        observaciones: editando.observaciones || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editando]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const payload: Partial<Proveedor> = {
      nombre: form.nombre.trim(),
      contacto: form.contacto.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      observaciones: form.observaciones.trim() || null,
    };
    const result = editando ? await onUpdate(editando.id, payload) : await onCreate(payload);
    if (result.success) {
      setShowForm(false);
      setEditando(null);
    }
  };

  const handleDelete = async () => {
    if (!eliminando) return;
    const result = await onDelete(eliminando.id);
    if (result.success) setEliminando(null);
  };

  const th: React.CSSProperties = {
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: '#6b7280',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Gestión de Proveedores</h2>
        <button
          className="btn-primary"
          onClick={() => {
            onClearError?.();
            setEditando(null);
            setShowForm(true);
          }}
        >
          + Nuevo Proveedor
        </button>
      </div>

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

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>ID</th>
              <th style={th}>Nombre</th>
              <th style={th}>Contacto</th>
              <th style={th}>Teléfono</th>
              <th style={th}>Email</th>
              <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proveedores.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                  No hay proveedores cargados
                </td>
              </tr>
            ) : (
              proveedores.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#6b7280' }}>#{p.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>{p.nombre}</td>
                  <td style={{ padding: '1rem' }}>{p.contacto || '-'}</td>
                  <td style={{ padding: '1rem' }}>{p.telefono || '-'}</td>
                  <td style={{ padding: '1rem' }}>{p.email || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => {
                          onClearError?.();
                          setEditando(p);
                          setShowForm(true);
                        }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => setEliminando(p)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { onClearError?.(); setShowForm(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button className="btn-close" onClick={() => { onClearError?.(); setShowForm(false); }}>
                ✖
              </button>
            </div>
            {error && (
              <div className="alert alert-error" style={{ margin: '0 1.5rem' }}>
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">No se pudo guardar</div>
                  <div>{error}</div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="form-section" style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  className="form-input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Razón social o nombre"
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contacto</label>
                  <input
                    className="form-input"
                    value={form.contacto}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                    placeholder="Persona de contacto"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-input"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Ej: 11 5555-5555"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contacto@proveedor.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    className="form-input"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Dirección"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-input"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { onClearError?.(); setShowForm(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={!form.nombre.trim() || loading}>
                  {editando ? 'Guardar cambios' : 'Crear proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!eliminando}
        title="Eliminar Proveedor"
        message="¿Estás seguro de que deseas eliminar este proveedor?"
        itemName={eliminando?.nombre}
        onClose={() => setEliminando(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
};
