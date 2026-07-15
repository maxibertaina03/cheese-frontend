// src/contextos/elementos/componentes/ElementosContenedor.tsx
//
// Contenedor del bounded context de elementos. Lee su estado del
// ElementosProvider; los motivos los recibe del shell (son de otro contexto).
import React from 'react';
import { Motivo, User } from '../../../types';
import { useElementosContexto } from '../ElementosContexto';
import { ElementosView } from './ElementosView';

interface Props {
  visible: boolean;
  user: User;
  motivos: Motivo[];
  onVolver: () => void;
}

export const ElementosContenedor: React.FC<Props> = ({ visible, user, motivos, onVolver }) => {
  const {
    elementos,
    loading,
    error,
    fetchMovimientos,
    createElemento,
    updateElemento,
    deleteElemento,
    registrarIngreso,
    registrarEgreso,
    setError,
  } = useElementosContexto();

  if (!visible) return null;

  return (
    <ElementosView
      user={user}
      elementos={elementos}
      motivos={motivos}
      loading={loading}
      error={error}
      onClearError={() => setError('')}
      onCreateElemento={createElemento}
      onUpdateElemento={updateElemento}
      onDeleteElemento={deleteElemento}
      onRegistrarIngreso={registrarIngreso}
      onRegistrarEgreso={registrarEgreso}
      onFetchMovimientos={fetchMovimientos}
      onVolver={onVolver}
    />
  );
};
