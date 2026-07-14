// src/contextos/indumentaria/componentes/ProveedorSelect.tsx
// Selector de proveedor con opcion de crear uno nuevo en linea (como SelectConAgregar,
// pero crea el registro real via API y selecciona el id devuelto).
import React, { useState } from 'react';
import { Proveedor } from '../../../types';

interface Props {
  proveedores: Proveedor[];
  value: number | null;
  onChange: (id: number | null) => void;
  // Crea un proveedor por nombre y devuelve el creado (o null si fallo).
  onCreateProveedor?: (nombre: string) => Promise<Proveedor | null>;
  required?: boolean;
}

const ADD_VALUE = '__add__';

export const ProveedorSelect: React.FC<Props> = ({
  proveedores,
  value,
  onChange,
  onCreateProveedor,
  required,
}) => {
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState('');
  const [creando, setCreando] = useState(false);

  const confirmarAgregado = async () => {
    const limpio = nuevo.trim();
    if (!limpio || !onCreateProveedor) return;
    setCreando(true);
    const creado = await onCreateProveedor(limpio);
    setCreando(false);
    if (creado) {
      onChange(creado.id);
      setNuevo('');
      setAgregando(false);
    }
  };

  if (agregando) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
        <input
          className="form-input"
          autoFocus
          value={nuevo}
          maxLength={150}
          disabled={creando}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nombre del proveedor"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              confirmarAgregado();
            }
            if (e.key === 'Escape') {
              setAgregando(false);
              setNuevo('');
            }
          }}
        />
        <button
          type="button"
          className="btn-confirm"
          style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
          disabled={creando || !nuevo.trim()}
          onClick={confirmarAgregado}
        >
          {creando ? 'Creando...' : 'Agregar'}
        </button>
        <button
          type="button"
          className="btn-cancel"
          style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
          disabled={creando}
          onClick={() => {
            setAgregando(false);
            setNuevo('');
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <select
      className="form-select"
      value={value ?? ''}
      required={required}
      onChange={(e) => {
        if (e.target.value === ADD_VALUE) {
          setNuevo('');
          setAgregando(true);
          return;
        }
        onChange(e.target.value ? Number(e.target.value) : null);
      }}
    >
      <option value="">Seleccionar proveedor...</option>
      {proveedores.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
      {onCreateProveedor && <option value={ADD_VALUE}>➕ Agregar nuevo proveedor...</option>}
    </select>
  );
};
