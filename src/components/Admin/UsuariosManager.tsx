// src/components/Admin/UsuariosManager.tsx
import React, { useState } from 'react';
import { Usuario, Modulo } from '../../hooks/useUsuarios';
import { DeleteConfirmModal } from './DeleteConfirmModal';

// Secciones disponibles para asignar a un usuario (rol 'usuario').
const MODULOS: { value: Modulo; label: string }[] = [
  { value: 'quesos', label: 'Quesos' },
  { value: 'elementos', label: 'Elementos' },
  { value: 'indumentaria', label: 'Indumentaria' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'historial', label: 'Historial' },
];

interface UsuariosManagerProps {
  usuarios: Usuario[];
  loading: boolean;
  error: string;
  success: string;
  onCreate: (data: { username: string; password: string; rol: 'admin' | 'usuario'; permisos?: Modulo[] }) => Promise<{ success: boolean }>;
  onUpdate: (id: number, data: Partial<Usuario>) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
}

export const UsuariosManager: React.FC<UsuariosManagerProps> = ({
  usuarios,
  loading,
  error,
  success,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarioEliminando, setUsuarioEliminando] = useState<Usuario | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rol: 'usuario' as 'admin' | 'usuario',
    permisos: [] as Modulo[],
  });

  const togglePermiso = (modulo: Modulo) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(modulo)
        ? prev.permisos.filter((m) => m !== modulo)
        : [...prev.permisos, modulo],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Los admin acceden a todo, por lo que no se guardan secciones para ellos.
    const permisos = formData.rol === 'admin' ? [] : formData.permisos;

    if (usuarioEditando) {
      // Update: rol y permisos (no password por seguridad)
      const result = await onUpdate(usuarioEditando.id, { rol: formData.rol, permisos });
      if (result.success) {
        setShowForm(false);
        setUsuarioEditando(null);
      }
    } else {
      // Create: username, password, rol y permisos
      const result = await onCreate({ ...formData, permisos });
      if (result.success) {
        setShowForm(false);
        setFormData({ username: '', password: '', rol: 'usuario', permisos: [] });
      }
    }
  };

  const handleDelete = async () => {
    if (!usuarioEliminando) return;
    const result = await onDelete(usuarioEliminando.id);
    if (result.success) {
      setUsuarioEliminando(null);
    }
  };

  const openEdit = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      username: usuario.username,
      password: '', // No mostramos password
      rol: usuario.rol,
      permisos: usuario.permisos ?? [],
    });
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Gestión de Usuarios</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            setUsuarioEditando(null);
            setFormData({ username: '', password: '', rol: 'usuario', permisos: [] });
            setShowForm(true);
          }}
        >
          + Nuevo Usuario
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

      {/* Tabla de usuarios */}
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
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Usuario</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Rol</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Secciones</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Creado</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#6b7280' }}>#{usuario.id}</td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#1f2937' }}>{usuario.username}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${usuario.rol === 'admin' ? 'badge-duro' : 'badge-blando'}`}>
                    {usuario.rol.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {usuario.rol === 'admin'
                    ? 'Acceso total'
                    : (usuario.permisos && usuario.permisos.length > 0
                        ? usuario.permisos
                            .map((p) => MODULOS.find((m) => m.value === p)?.label ?? p)
                            .join(', ')
                        : 'Sin acceso')}
                </td>
                <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {new Date(usuario.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => openEdit(usuario)}
                      title="Editar rol"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => setUsuarioEliminando(usuario)}
                      title="Eliminar usuario"
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

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Usuario *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="nombre_usuario"
                  required
                  disabled={!!usuarioEditando} // No editable en update
                />
              </div>

              {!usuarioEditando && (
                <div className="form-group">
                  <label className="form-label">Contraseña *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 4 caracteres"
                    required={!usuarioEditando}
                    minLength={4}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select
                  className="form-select"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'admin' | 'usuario' })}
                  required
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.rol === 'admin' ? (
                <div className="form-group">
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Un administrador tiene acceso total a todas las secciones.
                  </p>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Secciones permitidas</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {MODULOS.map((modulo) => (
                      <label
                        key={modulo.value}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#374151' }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permisos.includes(modulo.value)}
                          onChange={() => togglePermiso(modulo.value)}
                        />
                        {modulo.label}
                      </label>
                    ))}
                  </div>
                  {formData.permisos.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '0.5rem' }}>
                      Si no seleccionás ninguna sección, el usuario no podrá ver nada.
                    </p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm"
                  disabled={loading || (!usuarioEditando && formData.password.length < 4)}
                >
                  {loading ? 'Guardando...' : (usuarioEditando ? 'Actualizar' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      <DeleteConfirmModal
        isOpen={!!usuarioEliminando}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario?"
        itemName={usuarioEliminando?.username}
        onClose={() => setUsuarioEliminando(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
};