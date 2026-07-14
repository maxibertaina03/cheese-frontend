// src/contextos/facturacion/componentes/RecibosManager.tsx
import React, { useMemo, useState } from 'react';
import { Cliente, NotaPedido, Recibo, CreateReciboData } from '../../../types';
import { NuevoReciboModal } from './NuevoReciboModal';
import { FiltroComprobantes, useFiltroFechaTexto } from './FiltroComprobantes';

interface Props {
  recibos: Recibo[];
  clientes: Cliente[];
  notas: NotaPedido[];
  loading: boolean;
  error: string;
  success: string;
  onCrearRecibo: (data: CreateReciboData) => Promise<{ success: boolean }>;
  onImprimir: (id: number) => void;
}

const money = (n: number | string) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: '#6b7280',
};
const td: React.CSSProperties = { padding: '0.7rem 1rem' };

export const RecibosManager: React.FC<Props> = ({
  recibos,
  clientes,
  notas,
  loading,
  error,
  success,
  onCrearRecibo,
  onImprimir,
}) => {
  const [showNuevo, setShowNuevo] = useState(false);
  const filtro = useFiltroFechaTexto();
  const [medioFiltro, setMedioFiltro] = useState('todos');

  const recibosFiltrados = useMemo(
    () =>
      recibos.filter(
        (r) =>
          (medioFiltro === 'todos' || r.medioPago === medioFiltro) &&
          filtro.pasa(r.fecha, `${r.serie}-${r.numero}`, r.cliente?.nombre)
      ),
    [recibos, medioFiltro, filtro]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Recibos</h2>
        <button className="btn-primary" onClick={() => setShowNuevo(true)} disabled={clientes.length === 0}>
          + Nuevo recibo
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">{error}</div>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">✓</div>
          <div className="alert-content">{success}</div>
        </div>
      )}

      <FiltroComprobantes {...filtro}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Medio</label>
          <select className="form-select" value={medioFiltro} onChange={(e) => setMedioFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
      </FiltroComprobantes>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>N°</th>
              <th style={th}>Fecha</th>
              <th style={th}>Cliente</th>
              <th style={{ ...th, textAlign: 'right' }}>Monto</th>
              <th style={th}>Medio</th>
              <th style={{ ...th, textAlign: 'center' }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {recibosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay recibos para el filtro
                </td>
              </tr>
            ) : (
              recibosFiltrados.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1f2937' }}>{r.serie}-{r.numero}</td>
                  <td style={td}>{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={td}>{r.cliente?.nombre ?? '-'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(r.montoTotal)}</td>
                  <td style={{ ...td, textTransform: 'capitalize' }}>{r.medioPago}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button className="btn-export" onClick={() => onImprimir(r.id)}>
                      Imprimir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNuevo && (
        <NuevoReciboModal
          clientes={clientes}
          notas={notas}
          loading={loading}
          error={error}
          onConfirm={onCrearRecibo}
          onClose={() => setShowNuevo(false)}
        />
      )}
    </div>
  );
};
