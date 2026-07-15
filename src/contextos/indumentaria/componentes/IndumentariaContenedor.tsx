// src/contextos/indumentaria/componentes/IndumentariaContenedor.tsx
//
// Contenedor del bounded context de indumentaria: agrupa su hook, la carga
// inicial y las alertas. App solo aporta lo compartido (usuario y proveedores).
// Se monta siempre (visible o no) para conservar los datos entre navegaciones.
import React, { useEffect, useRef } from 'react';
import { Proveedor, User } from '../../../types';
import { Alerts } from '../../../components/Layout/Alerts';
import { useIndumentaria } from '../hooks/useIndumentaria';
import { IndumentariaView } from './IndumentariaView';

interface Props {
  visible: boolean;
  user: User;
  apiFetch: any;
  proveedores: Proveedor[];
  onCreateProveedor: (nombre: string) => Promise<Proveedor | null>;
  onVolver: () => void;
}

export const IndumentariaContenedor: React.FC<Props> = ({
  visible,
  user,
  apiFetch,
  proveedores,
  onCreateProveedor,
  onVolver,
}) => {
  const {
    indumentaria,
    loading,
    error,
    success,
    fetchIndumentaria,
    fetchMovimientos,
    createIndumentaria,
    updateIndumentaria,
    deleteIndumentaria,
    registrarIngreso,
    registrarEgreso,
    setError,
  } = useIndumentaria(apiFetch);

  // Carga inicial (una sola vez por sesión)
  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    fetchIndumentaria();
  }, [fetchIndumentaria]);

  if (!visible) return null;

  return (
    <>
      <Alerts error={error} success={success} />
      <IndumentariaView
        user={user}
        prendas={indumentaria}
        proveedores={proveedores}
        loading={loading}
        error={error}
        onClearError={() => setError('')}
        onCreate={createIndumentaria}
        onUpdate={updateIndumentaria}
        onDelete={deleteIndumentaria}
        onRegistrarIngreso={registrarIngreso}
        onRegistrarEgreso={registrarEgreso}
        onFetchMovimientos={fetchMovimientos}
        onCreateProveedor={onCreateProveedor}
        onVolver={onVolver}
      />
    </>
  );
};
