// src/contextos/facturacion/componentes/FiltroComprobantes.tsx
import React, { useState } from 'react';

// Hook de filtro por texto + rango de fechas, compartido por los listados de comprobantes.
export const useFiltroFechaTexto = () => {
  const [texto, setTexto] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const pasa = (fechaISO: string, ...textos: (string | null | undefined)[]) => {
    const t = texto.trim().toLowerCase();
    if (t && !textos.some((x) => (x ?? '').toLowerCase().includes(t))) return false;
    const fecha = (fechaISO || '').slice(0, 10);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    return true;
  };

  return { texto, setTexto, desde, setDesde, hasta, setHasta, pasa };
};

interface Props {
  texto: string;
  setTexto: (v: string) => void;
  desde: string;
  setDesde: (v: string) => void;
  hasta: string;
  setHasta: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode; // filtros extra (estado, medio de pago, etc.)
}

export const FiltroComprobantes: React.FC<Props> = ({
  texto,
  setTexto,
  desde,
  setDesde,
  hasta,
  setHasta,
  placeholder,
  children,
}) => (
  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
      <label className="form-label">Buscar</label>
      <input
        className="form-input"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder || 'N° o cliente'}
      />
    </div>
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">Desde</label>
      <input type="date" className="form-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
    </div>
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">Hasta</label>
      <input type="date" className="form-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
    </div>
    {children}
  </div>
);
