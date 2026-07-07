// src/components/Facturacion/NotasPedidoManager.tsx
import React, { useState } from 'react';
import { Cliente, Elemento, NotaPedido, StockComercialItem, CreateNotaPedidoData } from '../../types';
import { NuevaNotaPedidoModal } from './NuevaNotaPedidoModal';

interface Props {
  notas: NotaPedido[];
  clientes: Cliente[];
  stockComercial: StockComercialItem[];
  elementos: Elemento[];
  loading: boolean;
  error: string;
  success: string;
  onCrearNota: (data: CreateNotaPedidoData) => Promise<{ success: boolean }>;
  onImprimir: (id: number) => void;
}

const money = (n: number | string) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const estadoLabel: Record<string, string> = {
  confirmada: 'Confirmada',
  pagada_parcial: 'Pago parcial',
  pagada_total: 'Pagada',
  anulada: 'Anulada',
};

const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: '#6b7280',
};
const td: React.CSSProperties = { padding: '0.7rem 1rem' };

export const NotasPedidoManager: React.FC<Props> = ({
  notas,
  clientes,
  stockComercial,
  elementos,
  loading,
  error,
  success,
  onCrearNota,
  onImprimir,
}) => {
  const [showNueva, setShowNueva] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Notas de pedido</h2>
        <button className="btn-primary" onClick={() => setShowNueva(true)} disabled={clientes.length === 0}>
          + Nueva nota
        </button>
      </div>

      {clientes.length === 0 && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">Cargá al menos un cliente antes de emitir notas de pedido.</div>
        </div>
      )}
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
              <th style={{ ...th, textAlign: 'right' }}>Total</th>
              <th style={{ ...th, textAlign: 'right' }}>Saldo</th>
              <th style={th}>Estado</th>
              <th style={{ ...th, textAlign: 'center' }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {notas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  Todavía no hay notas de pedido
                </td>
              </tr>
            ) : (
              notas.map((n) => (
                <tr key={n.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1f2937' }}>
                    {n.serie}-{n.numero}
                  </td>
                  <td style={td}>{new Date(n.fecha).toLocaleDateString('es-AR')}</td>
                  <td style={td}>{n.cliente?.nombre ?? '-'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(n.total)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{money(n.saldoPendiente)}</td>
                  <td style={td}>{estadoLabel[n.estado] ?? n.estado}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button className="btn-export" onClick={() => onImprimir(n.id)}>
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
        <NuevaNotaPedidoModal
          clientes={clientes}
          stockComercial={stockComercial}
          elementos={elementos}
          loading={loading}
          error={error}
          onConfirm={onCrearNota}
          onClose={() => setShowNueva(false)}
        />
      )}
    </div>
  );
};
