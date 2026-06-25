// src/components/Facturacion/NuevaNotaPedidoModal.tsx
import React, { useMemo, useState } from 'react';
import { Cliente, Elemento, Unidad, CreateNotaPedidoData } from '../../types';

interface Props {
  clientes: Cliente[];
  unidades: Unidad[];
  elementos: Elemento[];
  loading: boolean;
  error: string;
  onConfirm: (data: CreateNotaPedidoData) => Promise<{ success: boolean }>;
  onClose: () => void;
}

const money = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const NuevaNotaPedidoModal: React.FC<Props> = ({
  clientes,
  unidades,
  elementos,
  loading,
  error,
  onConfirm,
  onClose,
}) => {
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [quesosSel, setQuesosSel] = useState<Record<number, boolean>>({});
  const [elementosQty, setElementosQty] = useState<Record<number, number>>({});
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});

  // Quesos vendibles: enteros, activos y con precio por unidad cargado.
  const quesosDisponibles = useMemo(
    () =>
      unidades.filter(
        (u) =>
          u.activa &&
          Number(u.pesoActual) === Number(u.pesoInicial) &&
          u.producto?.precioUnitario != null
      ),
    [unidades]
  );

  // Agrupados por producto para mostrar la cantidad y desglosar al tocar.
  const gruposQuesos = useMemo(() => {
    const map = new Map<
      number,
      { productoId: number; nombre: string; precio: number; unidades: Unidad[] }
    >();
    quesosDisponibles.forEach((u) => {
      const pid = u.producto!.id;
      const grupo = map.get(pid) || {
        productoId: pid,
        nombre: u.producto!.nombre,
        precio: Number(u.producto!.precioUnitario ?? 0),
        unidades: [],
      };
      grupo.unidades.push(u);
      map.set(pid, grupo);
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [quesosDisponibles]);

  const elementosVendibles = useMemo(
    () => elementos.filter((e) => e.esVendible && (e.precioUnitario ?? 0) > 0),
    [elementos]
  );

  const total = useMemo(() => {
    let t = 0;
    quesosDisponibles.forEach((u) => {
      if (quesosSel[u.id]) t += Number(u.producto?.precioUnitario ?? 0);
    });
    elementosVendibles.forEach((e) => {
      const qty = elementosQty[e.id] || 0;
      if (qty > 0) t += Number(e.precioUnitario ?? 0) * qty;
    });
    return t;
  }, [quesosDisponibles, quesosSel, elementosVendibles, elementosQty]);

  const cantidadItems =
    Object.values(quesosSel).filter(Boolean).length +
    Object.values(elementosQty).filter((q) => q > 0).length;

  const handleConfirm = async () => {
    if (!clienteId || cantidadItems === 0) return;

    const items: CreateNotaPedidoData['items'] = [];
    quesosDisponibles.forEach((u) => {
      if (quesosSel[u.id]) items.push({ tipoItem: 'queso', unidadId: u.id });
    });
    elementosVendibles.forEach((e) => {
      const qty = elementosQty[e.id] || 0;
      if (qty > 0) items.push({ tipoItem: 'elemento', elementoId: e.id, cantidad: qty });
    });

    const result = await onConfirm({
      clienteId: Number(clienteId),
      observaciones: observaciones.trim() || null,
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
          <h3 className="modal-title">Nueva nota de pedido</h3>
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

        {/* Quesos: agrupados por producto, se desglosan al tocar */}
        <h4 style={{ margin: '1rem 0 0.5rem' }}>Quesos disponibles</h4>
        {gruposQuesos.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            No hay quesos enteros con precio cargado. Cargá el precio en la pestaña Precios.
          </p>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
            {gruposQuesos.map((g) => {
              const seleccionadosEnGrupo = g.unidades.filter((u) => quesosSel[u.id]).length;
              const abierto = !!expandido[g.productoId];
              return (
                <div key={g.productoId} style={{ borderBottom: '1px solid #eee' }}>
                  {/* Cabecera del producto (clic para desglosar) */}
                  <div
                    onClick={() => setExpandido({ ...expandido, [g.productoId]: !abierto })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.75rem',
                      cursor: 'pointer',
                      background: '#f9fafb',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ width: 14, color: '#6b7280' }}>{abierto ? '▾' : '▸'}</span>
                    <span style={{ flex: 1 }}>
                      <strong>{g.nombre}</strong>{' '}
                      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        ({g.unidades.length} disponible{g.unidades.length === 1 ? '' : 's'}
                        {seleccionadosEnGrupo > 0 ? ` · ${seleccionadosEnGrupo} elegido${seleccionadosEnGrupo === 1 ? '' : 's'}` : ''})
                      </span>
                    </span>
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{money(g.precio)} c/u</span>
                  </div>

                  {/* Desglose unidad por unidad */}
                  {abierto &&
                    g.unidades.map((u) => (
                      <label
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 0.75rem 0.45rem 2rem',
                          borderTop: '1px solid #f3f4f6',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!quesosSel[u.id]}
                          onChange={(e) => setQuesosSel({ ...quesosSel, [u.id]: e.target.checked })}
                        />
                        <span style={{ flex: 1, fontSize: '0.9rem' }}>
                          #{u.id} · {u.pesoInicial}g
                          {u.fechaElaboracion ? ` · elab ${u.fechaElaboracion}` : ''}
                          {u.numeroLote ? ` · lote ${u.numeroLote}` : ''}
                        </span>
                      </label>
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Elementos */}
        <h4 style={{ margin: '1.25rem 0 0.5rem' }}>Elementos vendibles</h4>
        {elementosVendibles.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            No hay elementos marcados como vendibles con precio.
          </p>
        ) : (
          <div style={{ border: '1px solid #eee', borderRadius: 8 }}>
            {elementosVendibles.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <span style={{ flex: 1 }}>
                  <strong>{e.nombre}</strong>{' '}
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    {money(Number(e.precioUnitario ?? 0))} c/u · disp. {e.cantidadDisponible}
                  </span>
                </span>
                <input
                  type="number"
                  className="form-input"
                  style={{ maxWidth: 90 }}
                  min={0}
                  max={Number(e.cantidadDisponible)}
                  value={elementosQty[e.id] ?? ''}
                  placeholder="0"
                  onChange={(ev) =>
                    setElementosQty({
                      ...elementosQty,
                      [e.id]: ev.target.value ? Math.max(0, Number(ev.target.value)) : 0,
                    })
                  }
                />
              </div>
            ))}
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
          <span>Total ({cantidadItems} ítem{cantidadItems === 1 ? '' : 's'})</span>
          <span>{money(total)}</span>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
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
