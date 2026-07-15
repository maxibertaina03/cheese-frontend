// src/contextos/elementos/ElementosContexto.tsx
//
// Provider del bounded context de elementos: dueño del stock de elementos y sus
// movimientos, con su propia carga inicial. Hay provider (y no solo contenedor)
// porque el estado lo leen también las stats del Header y —vía el shell, que
// actúa de composition root— facturación, que vende elementos.
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useElementos } from './hooks/useElementos';

export type ValorElementosContexto = ReturnType<typeof useElementos>;

const ElementosContexto = createContext<ValorElementosContexto | null>(null);

export const useElementosContexto = (): ValorElementosContexto => {
  const valor = useContext(ElementosContexto);
  if (!valor) {
    throw new Error('useElementosContexto debe usarse dentro de <ElementosProvider>');
  }
  return valor;
};

interface Props {
  apiFetch: any;
  children: React.ReactNode;
}

export const ElementosProvider: React.FC<Props> = ({ apiFetch, children }) => {
  const elementos = useElementos(apiFetch);
  const { fetchElementos } = elementos;

  const cargado = useRef(false);
  useEffect(() => {
    if (cargado.current) return;
    cargado.current = true;
    fetchElementos();
  }, [fetchElementos]);

  return <ElementosContexto.Provider value={elementos}>{children}</ElementosContexto.Provider>;
};
