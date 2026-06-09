// src/components/Indumentaria/SelectConAgregar.tsx
import React, { useState } from 'react';

export interface Opcion {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Opcion[];
  placeholder?: string;
  addLabel?: string;
  inputPlaceholder?: string;
  required?: boolean;
  maxLength?: number;
}

const ADD_VALUE = '__add__';

export const SelectConAgregar: React.FC<Props> = ({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  addLabel = '➕ Agregar nueva opción...',
  inputPlaceholder = 'Escribí la nueva opción',
  required,
  maxLength,
}) => {
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState('');

  // Si el valor actual no está entre las opciones (p. ej. un valor cargado
  // previamente), lo agregamos para que aparezca seleccionado igual.
  const valorEnOpciones = value !== '' && options.some((o) => o.value === value);
  const opcionesVisibles =
    value === '' || valorEnOpciones ? options : [...options, { value, label: value }];

  const confirmarAgregado = () => {
    const limpio = nuevo.trim();
    if (!limpio) return;
    onChange(limpio);
    setNuevo('');
    setAgregando(false);
  };

  if (agregando) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
        <input
          className="form-input"
          autoFocus
          value={nuevo}
          maxLength={maxLength}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder={inputPlaceholder}
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
          onClick={confirmarAgregado}
        >
          Agregar
        </button>
        <button
          type="button"
          className="btn-cancel"
          style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
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
      value={value}
      required={required}
      onChange={(e) => {
        if (e.target.value === ADD_VALUE) {
          setNuevo('');
          setAgregando(true);
          return;
        }
        onChange(e.target.value);
      }}
    >
      <option value="">{placeholder}</option>
      {opcionesVisibles.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value={ADD_VALUE}>{addLabel}</option>
    </select>
  );
};
