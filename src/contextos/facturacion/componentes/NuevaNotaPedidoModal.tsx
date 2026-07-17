// src/contextos/facturacion/componentes/NuevaNotaPedidoModal.tsx
import React, { useMemo, useState } from 'react';
import { Cliente, Elemento, StockComercialItem, CreateNotaPedidoData } from '../../../types';

interface Props {
  clientes: Cliente[];
  stockComercial: StockComercialItem[];
  elementos: Elemento[];
  loading: boolean;
  error: string;
  onConfirm: (data: CreateNotaPedidoData) => Promise<{ success: boolean }>;
  onClose: () => void;
}

const money = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Subtotal de una línea: precio × cantidad − descuento (nunca negativo).
const subtotalLinea = (precio: number, qty: number, desc: number) => Math.max(0, precio * qty - desc);

export const NuevaNotaPedidoModal: React.FC<Props> = ({
  clientes,
  stockComercial,
  elementos,
  loading,
  error,
  onConfirm,
  onClose,
}) => {
  const hoy = new Date().toISOString().slice(0, 10);
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [fecha, setFecha] = useState(hoy);
  const [observaciones, setObservaciones] = useState('');
  const [quesosQty, setQuesosQty] = useState<Record<number, number>>({});
  const [quesosDesc, setQuesosDesc] = useState<Record<number, number>>({});
  const [elementosQty, setElementosQty] = useState<Record<number, number>>({});
  const [elementosDesc, setElementosDesc] = useState<Record<number, number>>({});

  // Quesos vendibles: con stock comercial > 0 y precio cargado.
  const quesosDisponibles = useMemo(
    () => stockComercial.filter((s) => s.cantidadDisponible > 0 && s.precioUnitario != null),
    [stockComercial]
  );

  const elementosVendibles = useMemo(
    () => elementos.filter((e) => e.esVendible && (e.precioUnitario ?? 0) > 0),
    [elementos]
  );

  const total = useMemo(() => {
    let t = 0;
    quesosDisponibles.forEach((s) => {
      const qty = quesosQty[s.productoId] || 0;
      if (qty > 0) t += subtotalLinea(Number(s.precioUnitario ?? 0), qty, quesosDesc[s.productoId] || 0);
    });
    elementosVendibles.forEach((e) => {
      const qty = elementosQty[e.id] || 0;
      if (qty > 0) t += subtotalLinea(Number(e.precioUnitario ?? 0), qty, elementosDesc[e.id] || 0);
    });
    return t;
  }, [quesosDisponibles, quesosQty, quesosDesc, elementosVendibles, elementosQty, elementosDesc]);

  const totalDescuentos = useMemo(() => {
    let d = 0;
    quesosDisponibles.forEach((s) => {
      if ((quesosQty[s.productoId] || 0) > 0) d += quesosDesc[s.productoId] || 0;
    });
    elementosVendibles.forEach((e) => {
      if ((elementosQty[e.id] || 0) > 0) d += elementosDesc[e.id] || 0;
    });
    return d;
  }, [quesosDisponibles, quesosQty, quesosDesc, elementosVendibles, elementosQty, elementosDesc]);

  const cantidadItems =
    Object.values(quesosQty).filter((q) => q > 0).length +
    Object.values(elementosQty).filter((q) => q > 0).length;

  const handleConfirm = async () => {
    if (!clienteId || cantidadItems === 0) return;
    const items: CreateNotaPedidoData['items'] = [];
    quesosDisponibles.forEach((s) => {
      const qty = quesosQty[s.productoId] || 0;
      if (qty > 0) {
        items.push({ tipoItem: 'queso', productoId: s.productoId, cantidad: qty, descuento: quesosDesc[s.productoId] || 0 });
      }
    });
    elementosVendibles.forEach((e) => {
      const qty = elementosQty[e.id] || 0;
      if (qty > 0) {
        items.push({ tipoItem: 'elemento', elementoId: e.id, cantidad: qty, descuento: elementosDesc[e.id] || 0 });
      }
    });
    const result = await onConfirm({
      clienteId: Number(clienteId),
      fecha: fecha || null,
      observaciones: observaciones.trim() || null,
      items,
    });
    if (result.success) onClose();
  };

  const filaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 0.75rem',
    borderBottom: '1px solid #f0f0f0',
  };
  const inputMini: React.CSSProperties = { maxWidth: 72, padding: '0.4rem 0.5rem' };
  const subtotalStyle: React.CSSProperties = {
    minWidth: 92,
    textAlign: 'right',
    fontWeight: 600,
    color: '#1f2937',
    fontSize: '0.9rem',
  };

  // Fila reutilizable de un ítem (queso o elemento).
  const filaItem = (
    key: string | number,
    nombre: string,
    infoExtra: string,
    precio: number,
    disponible: number,
    qty: number,
    desc: number,
    maxQty: number | undefined,
    onQty: (v: number | undefined) => void,
    onDesc: (v: number) => void
  ) => {
    const sub = qty > 0 ? subtotalLinea(precio, qty, desc) : 0;
    return (
      <div key={key} style={filaStyle}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong>{nombre}</strong>{' '}
          <span style={{ color: '#888', fontSize: '0.82rem' }}>
            {infoExtra}
            {money(precio)} c/u · disp. {disponible}
          </span>
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Cant.</label>
          <input
            type="number"
            className="form-input"
            style={inputMini}
            min={0}
            max={maxQty}
            value={qty || ''}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') return onQty(undefined);
              const n = Math.max(0, Number(raw));
              onQty(maxQty !== undefined ? Math.min(maxQty, n) : n);
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Desc. $</label>
          <input
            type="number"
            className="form-input"
            style={inputMini}
            min={0}
            step="0.01"
            value={desc || ''}
            placeholder="0"
            disabled={qty <= 0}
            onChange={(e) => onDesc(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <span style={subtotalStyle}>{qty > 0 ? money(sub) : '—'}</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 760, maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3 className="modal-title">Nueva nota de pedido</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 320px' }}>
            <label className="form-label">Cliente *</label>
            <select
              className="form-select"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : '')}
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
          <div className="form-group" style={{ flex: '0 1 180px' }}>
            <label className="form-label">Fecha de la nota</label>
            <input
              type="date"
              className="form-input"
              value={fecha}
              max={hoy}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
          El descuento es en $ sobre el total de esa línea (precio × cantidad).
        </p>

        {/* Quesos: por cantidad desde el stock comercial */}
        <h4 style={{ margin: '0.75rem 0 0.5rem' }}>Quesos</h4>
        {quesosDisponibles.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            No hay quesos con stock de venta y precio. Cargá stock en la pestaña "Stock" y el precio en "Precios".
          </p>
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
            {quesosDisponibles.map((s) =>
              filaItem(
                s.productoId,
                s.producto,
                `PLU ${s.plu} · `,
                Number(s.precioUnitario ?? 0),
                s.cantidadDisponible,
                quesosQty[s.productoId] || 0,
                quesosDesc[s.productoId] || 0,
                s.cantidadDisponible,
                (v) =>
                  setQuesosQty((prev) => {
                    const next = { ...prev };
                    if (v === undefined || v === 0) delete next[s.productoId];
                    else next[s.productoId] = v;
                    return next;
                  }),
                (v) => setQuesosDesc((prev) => ({ ...prev, [s.productoId]: v }))
              )
            )}
          </div>
        )}

        {/* Elementos */}
        <h4 style={{ margin: '1.25rem 0 0.5rem' }}>Elementos</h4>
        {elementosVendibles.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>No hay elementos vendibles con precio.</p>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
            {elementosVendibles.map((e) =>
              filaItem(
                `e${e.id}`,
                e.nombre,
                '',
                Number(e.precioUnitario ?? 0),
                Number(e.cantidadDisponible),
                elementosQty[e.id] || 0,
                elementosDesc[e.id] || 0,
                Number(e.cantidadDisponible),
                (v) =>
                  setElementosQty((prev) => {
                    const next = { ...prev };
                    if (v === undefined || v === 0) delete next[e.id];
                    else next[e.id] = v;
                    return next;
                  }),
                (v) => setElementosDesc((prev) => ({ ...prev, [e.id]: v }))
              )
            )}
          </div>
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
          <span>
            Total ({cantidadItems} ítem{cantidadItems === 1 ? '' : 's'})
            {totalDescuentos > 0 && (
              <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 500, marginLeft: 8 }}>
                descuentos: {money(totalDescuentos)}
              </span>
            )}
          </span>
          <span>{money(total)}</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={loading || !clienteId || cantidadItems === 0}
          >
            {loading ? 'Generando...' : 'Crear y descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
