// src/components/Elementos/ElementoList.tsx
import React from 'react';
import { Elemento, User } from '../../types';
import { ElementoCard } from './ElementoCard';

interface ElementoListProps {
  elementos: Elemento[];
  user: User | null;
  onIngreso: (elemento: Elemento) => void;
  onEgreso: (elemento: Elemento) => void;
  onEdit: (elemento: Elemento) => void;
  onDelete: (elemento: Elemento) => void;
  onVerMovimientos: (elemento: Elemento) => void;
}

export const ElementoList: React.FC<ElementoListProps> = ({
  elementos,
  user,
  onIngreso,
  onEgreso,
  onEdit,
  onDelete,
  onVerMovimientos,
}) => {
  if (elementos.length === 0) {
    return (
      <div className="empty-state">
        <h3>No hay elementos para mostrar</h3>
        <p>Intenta ajustar los filtros o crear un nuevo elemento</p>
      </div>
    );
  }

  return (
    <div className="inventory-container lista">
      {elementos.map((elemento) => (
        <ElementoCard
          key={elemento.id}
          elemento={elemento}
          user={user}
          onIngreso={onIngreso}
          onEgreso={onEgreso}
          onEdit={onEdit}
          onDelete={onDelete}
          onVerMovimientos={onVerMovimientos}
        />
      ))}
    </div>
  );
};
