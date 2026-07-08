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
const r2 = (n: number) => Math.round(n * 100) / 100;

export const NuevoReciboModal: React.FC<Props> = ({ clientes, notas, loading, error, onConfirm, onClose }) => {
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [montos, setMontos] = useState<Record<number, number>>({});
  const [pagos, setPagos] = useState<{ medio: MedioPago; monto: string }[]>([{ medio: 'efectivo', monto: '' }]);

  // Notas del cliente elegido con saldo pendiente.
  const notasConSaldo = useMemo(
    () => (clienteId ? notas.filter((n) => n.cliente?.id === clienteId && Number(n.saldoPendiente) > 0.001) : []),
    [notas, clienteId]
  );

  const total = useMemo(() => notasConSaldo.reduce((t, n) => t + (montos[n.id] || 0), 0), [notasConSaldo, montos]);
  const totalPagos = useMemo(() => pagos.reduce((t, p) => t + (Number(p.monto) || 0), 0), [pagos]);

  const hayExceso = notasConSaldo.some((n) => (montos[n.id] || 0) > Number(n.saldoPendiente) + 0.001);
  const cantidadAplicaciones = Object.values(montos).filter((m) => m > 0).length;
  const pagosCoinciden = total > 0 && Math.abs(r2(totalPagos) - r2(total)) < 0.01;
  const restante = r2(total - totalPagos);

  const handleCliente = (id: number | '') => {
    setClienteId(id);
    setMontos({});
    setPagos([{ medio: 'efectivo', monto: '' }]);
  };

  const setPago = (idx: number, patch: Partial<{ medio: MedioPago; monto: string }>) =>
    setPagos((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const completarRestante = () => {
    if (restante <= 0) return;
    // Suma el restante a la primera fila vacía; si no hay, agrega una fila en efectivo.
    const idxVacia = pagos.findIndex((p) => !Number(p.monto));
    if (idxVacia >= 0) setPago(idxVacia, { monto: String(restante) });
    else setPagos([...pagos, { medio: 'efectivo', monto: String(restante) }]);
  };

  const handleConfirm = async () => {
    if (!clienteId || cantidadAplicaciones === 0 || hayExceso || !pagosCoinciden) return;
    const aplicaciones = notasConSaldo
      .filter((n) => (montos[n.id] || 0) > 0)
      .map((n) => ({ notaPedidoId: n.id, monto: montos[n.id] }));
    const pagosData = pagos.filter((p) => Number(p.monto) > 0).map((p) => ({ medio: p.medio, monto: Number(p.monto) }));
    const result = await onConfirm({
      clienteId: Number(clienteId),
      observaciones: observaciones.trim() || null,
      aplicaciones,
      pagos: pagosData,
    });
    if (result.success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '88vh', overflowY: 'auto' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', borderBottom: '1px solid #f0f0f0' }}
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

        {/* Formas de pago (permite pago mixto) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0 0.5rem' }}>
          <h4 style={{ margin: 0 }}>Formas de pago</h4>
          <button type="button" className="btn-export" style={{ padding: '0.3rem 0.6rem' }} onClick={completarRestante} disabled={restante <= 0}>
            Completar restante
          </button>
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
          {pagos.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f0f0f0' }}>
              <select
                className="form-select"
                style={{ maxWidth: 180 }}
                value={p.medio}
                onChange={(e) => setPago(idx, { medio: e.target.value as MedioPago })}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <input
                type="number"
                className="form-input"
                style={{ maxWidth: 130, flex: 1 }}
                min={0}
                step="0.01"
                value={p.monto}
                placeholder="0.00"
                onChange={(e) => setPago(idx, { monto: e.target.value })}
              />
              {pagos.length > 1 && (
                <button
                  type="button"
                  className="btn-action btn-delete"
                  title="Quitar"
                  onClick={() => setPagos(pagos.filter((_, i) => i !== idx))}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
          <div style={{ padding: '0.5rem 0.75rem' }}>
            <button type="button" className="btn-export" onClick={() => setPagos([...pagos, { medio: 'transferencia', monto: '' }])}>
              + Agregar forma de pago
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">Observaciones (opcional)</label>
          <textarea className="form-input" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </div>

        {/* Totales */}
        <div style={{ borderTop: '2px solid #ddd', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total a cobrar</span>
            <span>{money(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: pagosCoinciden ? '#059669' : '#dc2626' }}>
            <span>Total formas de pago</span>
            <span>{money(totalPagos)}</span>
          </div>
          {total > 0 && !pagosCoinciden && (
            <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0.35rem 0 0', textAlign: 'right' }}>
              {restante > 0 ? `Faltan ${money(restante)}` : `Sobran ${money(-restante)}`} en formas de pago.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={loading || !clienteId || cantidadAplicaciones === 0 || hayExceso || !pagosCoinciden}
          >
            {loading ? 'Generando...' : 'Crear y descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
