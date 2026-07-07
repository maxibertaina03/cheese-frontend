// src/components/Facturacion/NuevoReciboModal.tsx
import React, { useMemo, useState } from 'react';
import { Cliente, NotaPedido, MedioPago, CreateReciboData } from '../../types';

interface Props {
  clientes: Cliente[];
  notas: NotaPedido[];
  loading: boolean;
  error: string;
  onConfirm: (data: CreateReciboData) => Promise<{ success: boolean }>;
  onClose: () => void;
}

const money = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const NuevoReciboModal: React.FC<Props> = ({ clientes, notas, loading, error, onConfirm, onClose }) => {
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [montos, setMontos] = useState<Record<number, number>>({});

  // Notas del cliente elegido con saldo pendiente.
  const notasConSaldo = useMemo(
    () =>
      clienteId
        ? notas.filter((n) => n.cliente?.id === clienteId && Number(n.saldoPendiente) > 0.001)
        : [],
    [notas, clienteId]
  );

  const total = useMemo(
    () => notasConSaldo.reduce((t, n) => t + (montos[n.id] || 0), 0),
    [notasConSaldo, montos]
  );

  const hayExceso = notasConSaldo.some((n) => (montos[n.id] || 0) > Number(n.saldoPendiente) + 0.001);
  const cantidadAplicaciones = Object.values(montos).filter((m) => m > 0).length;

  const handleCliente = (id: number | '') => {
    setClienteId(id);
    setMontos({});
  };

  const handleConfirm = async () => {
    if (!clienteId || cantidadAplicaciones === 0 || hayExceso) return;
    const aplicaciones = notasConSaldo
      .filter((n) => (montos[n.id] || 0) > 0)
      .map((n) => ({ notaPedidoId: n.id, monto: montos[n.id] }));
    const result = await onConfirm({
      clienteId: Number(clienteId),
      medioPago,
      observaciones: observaciones.trim() || null,
      aplicaciones,
    });
    if (result.success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Nuevo recibo</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select
              className="form-select"
              value={clienteId}
              onChange={(e) => handleCliente(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">-- Seleccionar cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.numeroDocumento ? ` (${c.tipoDocumento} ${c.numeroDocumento})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Medio de pago *</label>
            <select
              className="form-select"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value as MedioPago)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        <h4 style={{ margin: '1rem 0 0.5rem' }}>Notas a cancelar</h4>
        {!clienteId ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Elegí un cliente para ver sus notas con saldo.</p>
        ) : notasConSaldo.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Este cliente no tiene notas con saldo pendiente.</p>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
            {notasConSaldo.map((n) => {
              const saldo = Number(n.saldoPendiente);
              const monto = montos[n.id];
              const excede = (monto || 0) > saldo + 0.001;
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <span style={{ flex: 1 }}>
                    <strong>Nota {n.serie}-{n.numero}</strong>{' '}
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                      total {money(Number(n.total))} · saldo {money(saldo)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn-export"
                    style={{ padding: '0.3rem 0.6rem' }}
                    onClick={() => setMontos({ ...montos, [n.id]: saldo })}
                  >
                    Todo
                  </button>
                  <input
                    type="number"
                    className="form-input"
                    style={{ maxWidth: 110, borderColor: excede ? '#dc2626' : undefined }}
                    min={0}
                    step="0.01"
                    max={saldo}
                    value={monto ?? ''}
                    placeholder="0.00"
                    onChange={(e) => {
                      const raw = e.target.value;
                      setMontos((prev) => {
                        const next = { ...prev };
                        if (raw === '') delete next[n.id];
                        else next[n.id] = Math.max(0, Number(raw));
                        return next;
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {hayExceso && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0.5rem 0.25rem' }}>
            Algún monto supera el saldo de la nota.
          </p>
        )}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">Observaciones (opcional)</label>
          <textarea
            className="form-input"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 0',
            borderTop: '2px solid #ddd',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
          <span>Total del recibo</span>
          <span>{money(total)}</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={loading || !clienteId || cantidadAplicaciones === 0 || hayExceso}
          >
            {loading ? 'Generando...' : 'Crear y descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
