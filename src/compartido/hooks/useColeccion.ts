// src/compartido/hooks/useColeccion.ts
//
// Shared kernel: maneja una colección (lista) traída de la API con una
// función `refrescar` de identidad estable. Reemplaza el patrón repetido
// de `fetchX` (try/catch + setState([]) ante error) de los hooks de dominio.
import { useCallback, useRef, useState } from 'react';

export interface OpcionesColeccion {
  // Mensaje de error a reportar si falla la carga (algunos dominios lo muestran,
  // otros la cargan en silencio). Si se define, se invoca `onError` con él.
  mensajeError?: string;
  onError?: (mensaje: string) => void;
}

export const useColeccion = <T>(
  cargar: () => Promise<Response>,
  opciones?: OpcionesColeccion
) => {
  const [items, setItems] = useState<T[]>([]);

  // Guardamos las últimas referencias en refs para que `refrescar` sea estable
  // (útil en dependencias de useEffect) sin recrearse en cada render.
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  const opcionesRef = useRef(opciones);
  opcionesRef.current = opciones;

  const refrescar = useCallback(async () => {
    try {
      const respuesta = await cargarRef.current();
      const data = await respuesta.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setItems([]);
      const mensaje = opcionesRef.current?.mensajeError;
      if (mensaje) opcionesRef.current?.onError?.(mensaje);
    }
  }, []);

  return { items, setItems, refrescar };
};
