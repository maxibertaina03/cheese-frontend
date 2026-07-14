// src/components/Facturacion/NuevaNotaCreditoModal.tsx
import React, { useMemo, useState } from 'react';
import { NotaPedido, NotaParaDevolver, CreateNotaCreditoData } from '../../../types';

interface Props {
  notas: NotaPedido[];
  loading: boolean;
  error: string;
  onFetchNota: (notaPedidoId: number) => Promise<NotaParaDevolver | null>;
  onConfirm: (data: CreateNotaCreditoData) => Promise<{ success: boolean }>;
  onClose: () => void;
}

const money = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const NuevaNotaCreditoModal: React.FC<Props> = ({ notas, loading, error, onFetchNota, onConfirm, onClose }) => {
  const [notaPedidoId, setNotaPedidoId] = useState<number | ''>('');
  const [notaData, setNotaData] = useState<NotaParaDevolver | null>(null);
  const [cargandoNota, setCargandoNota] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  // Notas de pedido que se pueden acreditar (no anuladas).
  const notasSeleccionables = useMemo(() => notas.filter((n) => n.estado !== 'anulada'), [notas]);

  const itemsDevolvibles = useMemo(
    () => (notaData?.items ?? []).filter((i) => i.disponible > 0),
    [notaData]
  );

  const total = useMemo(
    () => itemsDevolvibles.reduce((t, i) => t + (cantidades[i.notaPedidoItemId] || 0) * i.precioUnitario, 0),
    [itemsDevolvibles, cantidades]
  );

  const cantidadItems = Object.values(cantidades).filter((c) => c > 0).length;
  const hayExceso = itemsDevolvibles.some((i) => (cantidades[i.notaPedidoItemId] || 0) > i.disponible);

  const seleccionarNota = async (id: number | '') => {
    setNotaPedidoId(id);
    setCantidades({});
    setNotaData(null);
    if (!id) return;
    setCargandoNota(true);
    const data = await onFetchNota(Number(id));
    setNotaData(data);
    setCargandoNota(false);
  };

  const handleConfirm = async () => {
    if (!notaPedidoId || cantidadItems === 0 || hayExceso) return;
    const items = itemsDevolvibles
      .filter((i) => (cantidades[i.notaPedidoItemId] || 0) > 0)
      .map((i) => ({ notaPedidoItemId: i.notaPedidoItemId, cantidad: cantidades[i.notaPedidoItemId] }));
    const result = await onConfirm({
      notaPedidoId: Number(notaPedidoId),
      motivo: motivo.trim() || null,
      items,
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
          <h3 className="modal-title">Nueva nota de crédito (devolución)</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Nota de pedido *</label>
          <select
            className="form-select"
            value={notaPedidoId}
            onChange={(e) => seleccionarNota(e.target.value ? Number(e.target.value) : '')}
            required
          >
            <option value="">-- Seleccionar nota --</option>
            {notasSeleccionables.map((n) => (
              <option key={n.id} value={n.id}>
                Nota {n.serie}-{n.numero} · {n.cliente?.nombre ?? ''}
              </option>
            ))}
          </select>
        </div>

        {cargandoNota ? (
          <p style={{ color: '#888' }}>Cargando ítems...</p>
        ) : notaData ? (
          <>
            <h4 style={{ margin: '1rem 0 0.5rem' }}>Ítems a devolver</h4>
            {itemsDevolvibles.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Esta nota ya fue devuelta por completo.</p>
            ) : (
              <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
                {itemsDevolvibles.map((i) => (
                  <div
                    key={i.notaPedidoItemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.55rem 0.75rem',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <strong>{i.descripcion}</strong>{' '}
                      <span style={{ color: '#888', fontSize: '0.85rem' }}>
                        {money(i.precioUnitario)} c/u · vendido {i.cantidad}
                        {i.cantidadDevuelta > 0 ? ` · ya devuelto ${i.cantidadDevuelta}` : ''} · disp. {i.disponible}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="btn-export"
                      style={{ padding: '0.3rem 0.6rem' }}
                      onClick={() => setCantidades({ ...cantidades, [i.notaPedidoItemId]: i.disponible })}
                    >
                      Todo
                    </button>
                    <input
                      type="number"
                      className="form-input"
                      style={{ maxWidth: 90 }}
                      min={0}
                      max={i.disponible}
                      value={cantidades[i.notaPedidoItemId] ?? ''}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCantidades((prev) => {
                          const next = { ...prev };
                          if (raw === '') delete next[i.notaPedidoItemId];
                          else next[i.notaPedidoItemId] = Math.min(i.disponible, Math.max(0, Number(raw)));
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Motivo (opcional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: devolución por mercadería en mal estado"
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
              <span>Total a acreditar</span>
              <span>{money(total)}</span>
            </div>
          </>
        ) : null}

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={loading || !notaPedidoId || cantidadItems === 0 || hayExceso}
          >
            {loading ? 'Generando...' : 'Crear y descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
