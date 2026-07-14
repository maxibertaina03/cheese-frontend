// src/contextos/facturacion/componentes/StockComercialManager.tsx
import React, { useState } from 'react';
import { StockComercialItem, Proveedor, CargaStockComercial } from '../../../types';
import { exportStockComercialPdfLocal } from '../../../utils/pdfExport';

interface Props {
  stock: StockComercialItem[];
  proveedores: Proveedor[];
  loading: boolean;
  error: string;
  success: string;
  onIngresar: (productoId: number, data: CargaStockComercial) => Promise<{ success: boolean }>;
}

const hoy = () => new Date().toISOString().slice(0, 10);

const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: '#6b7280',
};
const td: React.CSSProperties = { padding: '0.7rem 1rem' };

export const StockComercialManager: React.FC<Props> = ({ stock, proveedores, loading, error, success, onIngresar }) => {
  const [cargando, setCargando] = useState<StockComercialItem | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [prefijo, setPrefijo] = useState('');
  const [numero, setNumero] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [proveedorId, setProveedorId] = useState<number | ''>('');
  const [exportando, setExportando] = useState(false);

  const exportarPdf = () => {
    setExportando(true);
    try {
      exportStockComercialPdfLocal(stock, `stock_facturacion_${hoy()}.pdf`);
    } finally {
      setExportando(false);
    }
  };

  const abrirCarga = (item: StockComercialItem) => {
    setCargando(item);
    setCantidad('');
    setObservaciones('');
    setFecha(hoy());
    setPrefijo('');
    setNumero('');
    setPrecioCompra('');
    setProveedorId('');
  };

  const confirmar = async () => {
    if (!cargando) return;
    const n = Number(cantidad);
    if (!n || n <= 0) return;
    const result = await onIngresar(cargando.productoId, {
      cantidad: n,
      observaciones: observaciones.trim() || null,
      fechaComprobante: fecha || null,
      comprobantePrefijo: prefijo.trim() || null,
      comprobanteNumero: numero.trim() || null,
      precioCompra: precioCompra ? Number(precioCompra) : null,
      proveedorId: proveedorId ? Number(proveedorId) : null,
    });
    if (result.success) setCargando(null);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Stock de venta (por cantidad)</h2>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
            Es el stock que se descuenta al facturar. Es independiente de las hormas cargadas con pistola.
          </p>
        </div>
        <button className="btn-export" onClick={exportarPdf} disabled={exportando || stock.length === 0}>
          {exportando ? 'Exportando PDF...' : 'Exportar PDF'}
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
              <th style={th}>Producto</th>
              <th style={th}>Tipo</th>
              <th style={{ ...th, textAlign: 'right' }}>Disponible</th>
              <th style={{ ...th, textAlign: 'center' }}>Cargar</th>
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay productos cargados
                </td>
              </tr>
            ) : (
              stock.map((s) => (
                <tr key={s.productoId} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#1f2937' }}>
                    {s.producto}
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}> · PLU {s.plu}</span>
                  </td>
                  <td style={td}>{s.tipoQueso || '-'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontSize: '1.05rem' }}>
                    {s.cantidadDisponible}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button className="btn-primary" onClick={() => abrirCarga(s)}>
                      + Cargar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {cargando && (
        <div className="modal-overlay" onClick={() => setCargando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cargar stock — {cargando.producto}</h3>
              <button className="btn-close" onClick={() => setCargando(null)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Cantidad a cargar *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej: 10"
                  autoFocus
                />
                <div className="form-hint">Disponible actual: {cargando.cantidadDisponible}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de compra</label>
                <input type="date" className="form-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Comprobante de compra</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    className="form-input"
                    style={{ maxWidth: 90 }}
                    value={prefijo}
                    onChange={(e) => setPrefijo(e.target.value)}
                    placeholder="Prefijo"
                  />
                  <input
                    className="form-input"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="N°"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Precio de compra (por unidad)</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  min={0}
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <select
                  className="form-select"
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Sin especificar --</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones (opcional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setCargando(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmar} disabled={loading || !Number(cantidad)}>
                {loading ? 'Cargando...' : 'Cargar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
