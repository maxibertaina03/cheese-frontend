// src/compartido/hooks/useEstadoOperacion.ts
//
// Shared kernel (código transversal a todos los bounded contexts).
// Encapsula el estado y el manejo de una operación contra la API
// (crear / actualizar / eliminar / cargar stock, etc.): cargando, error,
// éxito con autolimpieza, y el patrón ok/else/catch que antes estaba
// duplicado en los ~14 hooks de dominio.
import { useCallback, useState } from 'react';

// Opciones para ejecutar una mutación (llamada que modifica datos).
export interface OpcionesMutacion<R> {
  // Mensaje de éxito. Puede ser fijo o derivarse del cuerpo de la respuesta
  // (ej.: `Nota ${nota.serie}-${nota.numero} creada`).
  mensajeExito?: string | ((data: R) => string);
  // Mensaje a mostrar si la API no devuelve uno propio.
  mensajeErrorDefault?: string;
  // Acción posterior al éxito, típicamente refrescar la colección.
  alTerminar?: () => Promise<void> | void;
  // Si es false, no se intenta parsear el cuerpo como JSON (ej.: respuestas 204).
  parsearRespuesta?: boolean;
}

export interface ResultadoMutacion<R> {
  success: boolean;
  data?: R;
}

const MS_LIMPIAR_EXITO = 3000;

export const useEstadoOperacion = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const ejecutar = useCallback(
    async <R = unknown>(
      accion: () => Promise<Response>,
      opciones: OpcionesMutacion<R> = {}
    ): Promise<ResultadoMutacion<R>> => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await accion();

        if (respuesta.ok) {
          let data: R | undefined;
          if (opciones.parsearRespuesta !== false) {
            data = (await respuesta.json().catch(() => undefined)) as R | undefined;
          }

          const mensaje =
            typeof opciones.mensajeExito === 'function'
              ? opciones.mensajeExito(data as R)
              : opciones.mensajeExito;
          if (mensaje) {
            setExito(mensaje);
            setTimeout(() => setExito(''), MS_LIMPIAR_EXITO);
          }

          if (opciones.alTerminar) await opciones.alTerminar();
          return { success: true, data };
        }

        const errorData = await respuesta.json().catch(() => null);
        setError(errorData?.error || opciones.mensajeErrorDefault || 'Ocurrió un error');
        return { success: false };
      } catch (err) {
        setError('Error de conexión con el servidor');
        return { success: false };
      } finally {
        setCargando(false);
      }
    },
    []
  );

  return { cargando, error, exito, setError, setExito, ejecutar };
};
