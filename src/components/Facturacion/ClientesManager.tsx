// src/components/Facturacion/ClientesManager.tsx
import React, { useEffect, useState } from 'react';
import { Cliente } from '../../types';
import { DeleteConfirmModal } from '../Admin/DeleteConfirmModal';

interface Props {
  clientes: Cliente[];
  loading: boolean;
  error: string;
  success: string;
  onClearError?: () => void;
  onCreate: (data: Partial<Cliente>) => Promise<{ success: boolean }>;
  onUpdate: (id: number, data: Partial<Cliente>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

const emptyForm = {
  nombre: '',
  tipoDocumento: 'DNI' as 'DNI' | 'CUIT',
  numeroDocumento: '',
  direccion: '',
  codigoPostal: '',
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
};

export const ClientesManager: React.FC<Props> = ({
  clientes,
  loading,
  error,
  success,
  onClearError,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editando) {
      setForm({
        nombre: editando.nombre || '',
        tipoDocumento: editando.tipoDocumento || 'DNI',
        numeroDocumento: editando.numeroDocumento || '',
        direccion: editando.direccion || '',
        codigoPostal: editando.codigoPostal || '',
        localidad: editando.localidad || '',
        provincia: editando.provincia || '',
        telefono: editando.telefono || '',
        email: editando.email || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editando]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const payload: Partial<Cliente> = {
      nombre: form.nombre.trim(),
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento.trim() || null,
      direccion: form.direccion.trim() || null,
      codigoPostal: form.codigoPostal.trim() || null,
      localidad: form.localidad.trim() || null,
      provincia: form.provincia.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
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
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Clientes</h2>
        <button
          className="btn-primary"
          onClick={() => {
            onClearError?.();
            setEditando(null);
            setShowForm(true);
          }}
        >
          + Nuevo Cliente
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
              <th style={th}>Documento</th>
              <th style={th}>Localidad</th>
              <th style={th}>Teléfono</th>
              <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                  No hay clientes cargados
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#6b7280' }}>#{c.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>{c.nombre}</td>
                  <td style={{ padding: '1rem' }}>
                    {c.numeroDocumento ? `${c.tipoDocumento} ${c.numeroDocumento}` : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>{c.localidad || '-'}</td>
                  <td style={{ padding: '1rem' }}>{c.telefono || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => {
                          onClearError?.();
                          setEditando(c);
                          setShowForm(true);
                        }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => setEliminando(c)}
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
              <h3 className="modal-title">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
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
                  placeholder="Nombre o razón social"
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tipo de documento</label>
                  <select
                    className="form-select"
                    value={form.tipoDocumento}
                    onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value as 'DNI' | 'CUIT' })}
                  >
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">N° de documento</label>
                  <input
                    className="form-input"
                    value={form.numeroDocumento}
                    onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
                    placeholder="Ej: 20-12345678-9"
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
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    className="form-input"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Calle y número"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Código postal</label>
                  <input
                    className="form-input"
                    value={form.codigoPostal}
                    onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
                    placeholder="Ej: 1842"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Localidad</label>
                  <input
                    className="form-input"
                    value={form.localidad}
                    onChange={(e) => setForm({ ...form, localidad: e.target.value })}
                    placeholder="Localidad"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Provincia</label>
                  <input
                    className="form-input"
                    value={form.provincia}
                    onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                    placeholder="Provincia"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { onClearError?.(); setShowForm(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={!form.nombre.trim() || loading}>
                  {editando ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!eliminando}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente?"
        itemName={eliminando?.nombre}
        onClose={() => setEliminando(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
};
