// src/components/Facturacion/EmpresaForm.tsx
import React, { useEffect, useState } from 'react';
import { Empresa } from '../../../types';

interface Props {
  empresa: Empresa | null;
  loading: boolean;
  error: string;
  success: string;
  onSave: (data: Partial<Empresa>) => Promise<{ success: boolean }>;
}

const emptyForm = {
  razonSocial: '',
  cuit: '',
  direccion: '',
  codigoPostal: '',
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
  condicionIva: '',
};

export const EmpresaForm: React.FC<Props> = ({ empresa, loading, error, success, onSave }) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (empresa) {
      setForm({
        razonSocial: empresa.razonSocial || '',
        cuit: empresa.cuit || '',
        direccion: empresa.direccion || '',
        codigoPostal: empresa.codigoPostal || '',
        localidad: empresa.localidad || '',
        provincia: empresa.provincia || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        condicionIva: empresa.condicionIva || '',
      });
    }
  }, [empresa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      razonSocial: form.razonSocial.trim(),
      cuit: form.cuit.trim() || null,
      direccion: form.direccion.trim() || null,
      codigoPostal: form.codigoPostal.trim() || null,
      localidad: form.localidad.trim() || null,
      provincia: form.provincia.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      condicionIva: form.condicionIva.trim() || null,
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Datos de la empresa</h2>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
          Estos datos aparecen como emisor en los comprobantes.
        </p>
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

      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-group">
          <label className="form-label">Razón social *</label>
          <input
            className="form-input"
            value={form.razonSocial}
            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
            placeholder="Nombre de la empresa"
            required
          />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">CUIT</label>
            <input
              className="form-input"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              placeholder="20-12345678-9"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Condición frente al IVA</label>
            <input
              className="form-input"
              value={form.condicionIva}
              onChange={(e) => setForm({ ...form, condicionIva: e.target.value })}
              placeholder="Ej: Responsable Inscripto"
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
              placeholder="empresa@email.com"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn-confirm" disabled={!form.razonSocial.trim() || loading}>
            {loading ? 'Guardando...' : 'Guardar datos'}
          </button>
        </div>
      </form>
    </div>
  );
};
