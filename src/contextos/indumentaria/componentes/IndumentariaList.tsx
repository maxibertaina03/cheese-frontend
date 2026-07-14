// src/contextos/indumentaria/componentes/IndumentariaList.tsx
import React from 'react';
import { Indumentaria, User } from '../../../types';
import { IndumentariaCard } from './IndumentariaCard';

interface Props {
  prendas: Indumentaria[];
  user: User | null;
  vistaMode?: 'lista' | 'grid';
  onIngreso: (prenda: Indumentaria) => void;
  onEgreso: (prenda: Indumentaria) => void;
  onEdit: (prenda: Indumentaria) => void;
  onDelete: (prenda: Indumentaria) => void;
  onVerMovimientos: (prenda: Indumentaria) => void;
}

export const IndumentariaList: React.FC<Props> = ({ prendas, vistaMode = 'lista', ...handlers }) => {
  if (prendas.length === 0) {
    return (
      <div className="empty-state">
        <h3>No hay indumentaria para mostrar</h3>
        <p>Intenta ajustar los filtros o crear una nueva prenda</p>
      </div>
    );
  }

  return (
    <div className={`inventory-container ${vistaMode}`}>
      {prendas.map((prenda) => (
        <IndumentariaCard key={prenda.id} prenda={prenda} {...handlers} />
      ))}
    </div>
  );
};
