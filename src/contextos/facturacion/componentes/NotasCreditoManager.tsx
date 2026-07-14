// src/components/Facturacion/NotasCreditoManager.tsx
import React, { useMemo, useState } from 'react';
import { NotaPedido, NotaCredito, NotaParaDevolver, CreateNotaCreditoData } from '../../../types';
import { NuevaNotaCreditoModal } from './NuevaNotaCreditoModal';
import { FiltroComprobantes, useFiltroFechaTexto } from './FiltroComprobantes';

interface Props {
  notasCredito: NotaCredito[];
  notas: NotaPedido[];
  loading: boolean;
  error: string;
  success: string;
  onFetchNota: (notaPedidoId: number) => Promise<NotaParaDevolver | null>;
  onCrear: (data: CreateNotaCreditoData) => Promise<{ success: boolean }>;
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

export const NotasCreditoManager: React.FC<Props> = ({
  notasCredito,
  notas,
  loading,
  error,
  success,
  onFetchNota,
  onCrear,
  onImprimir,
}) => {
  const [showNueva, setShowNueva] = useState(false);
  const filtro = useFiltroFechaTexto();

  const notasCreditoFiltradas = useMemo(
    () =>
      notasCredito.filter((nc) =>
        filtro.pasa(
          nc.fecha,
          `${nc.serie}-${nc.numero}`,
          nc.cliente?.nombre,
          nc.notaPedido ? `${nc.notaPedido.serie}-${nc.notaPedido.numero}` : ''
        )
      ),
    [notasCredito, filtro]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Notas de crédito</h2>
        <button className="btn-primary" onClick={() => setShowNueva(true)} disabled={notas.length === 0}>
          + Nueva nota de crédito
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

      <FiltroComprobantes {...filtro} placeholder="N°, cliente o nota" />

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
              <th style={th}>Nota pedido</th>
              <th style={th}>Cliente</th>
              <th style={{ ...th, textAlign: 'right' }}>Monto</th>
              <th style={{ ...th, textAlign: 'center' }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {notasCreditoFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay notas de crédito para el filtro
                </td>
              </tr>
            ) : (
              notasCreditoFiltradas.map((nc) => (
                <tr key={nc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1f2937' }}>{nc.serie}-{nc.numero}</td>
                  <td style={td}>{new Date(nc.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={td}>
                    {nc.notaPedido ? `${nc.notaPedido.serie}-${nc.notaPedido.numero}` : '-'}
                  </td>
                  <td style={td}>{nc.cliente?.nombre ?? '-'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(nc.montoTotal)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button className="btn-export" onClick={() => onImprimir(nc.id)}>
                      Imprimir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showNueva && (
        <NuevaNotaCreditoModal
          notas={notas}
          loading={loading}
          error={error}
          onFetchNota={onFetchNota}
          onConfirm={onCrear}
          onClose={() => setShowNueva(false)}
        />
      )}
    </div>
  );
};
