// src/contextos/facturacion/componentes/MovimientosStockManager.tsx
import React, { useMemo, useState } from 'react';
import { MovimientoStockComercial } from '../../../types';
import { exportMovimientosStockPdfLocal } from '../../../utils/pdfExport';

interface Props {
  movimientos: MovimientoStockComercial[];
  loading: boolean;
  error: string;
  success: string;
  onEliminar: (id: number) => Promise<{ success: boolean }>;
}

const th: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  textAlign: 'left',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  color: '#6b7280',
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: '0.55rem 0.75rem', fontSize: '0.85rem', verticalAlign: 'top' };

const toNumber = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (v: unknown) =>
  `$ ${toNumber(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('es-AR') : '-');
const fechaRef = (m: MovimientoStockComercial) => (m.fechaComprobante || m.createdAt || '').slice(0, 10);

const TIPO_LABEL: Record<string, string> = { ingreso: 'Compra', egreso: 'Venta', ajuste: 'Ajuste' };
const TIPO_COLOR: Record<string, string> = { ingreso: '#059669', egreso: '#dc2626', ajuste: '#d97706' };

export const MovimientosStockManager: React.FC<Props> = ({ movimientos, loading, error, success, onEliminar }) => {
  const [producto, setProducto] = useState('todos');
  const [proveedor, setProveedor] = useState('todos');
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const eliminar = async (m: MovimientoStockComercial) => {
    const detalle = `${toNumber(m.cantidad)} unid. de ${m.producto ?? 'este producto'}`;
    if (!window.confirm(`¿Eliminar esta compra? Se va a revertir el stock (${detalle}).`)) return;
    setEliminandoId(m.id);
    try {
      await onEliminar(m.id);
    } finally {
      setEliminandoId(null);
    }
  };
  // Por defecto mostramos solo Compras (ingresos): las ventas/ajustes se generan
  // al facturar y no tienen comprobante/precio/proveedor de compra, así que se ven
  // vacías en esas columnas. Con el filtro "Tipo" se pueden ver igual.
  const [tipo, setTipo] = useState('ingreso');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [texto, setTexto] = useState('');
  const [exportando, setExportando] = useState(false);

  const productos = useMemo(
    () => Array.from(new Set(movimientos.map((m) => m.producto).filter((p): p is string => !!p))).sort(),
    [movimientos]
  );
  const proveedores = useMemo(
    () => Array.from(new Set(movimientos.map((m) => m.proveedor).filter((p): p is string => !!p))).sort(),
    [movimientos]
  );

  const filtrados = useMemo(() => {
    const search = texto.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (producto !== 'todos' && m.producto !== producto) return false;
      if (proveedor !== 'todos' && m.proveedor !== proveedor) return false;
      if (tipo !== 'todos' && m.tipo !== tipo) return false;
      const f = fechaRef(m);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      if (search) {
        const comprobante = [m.comprobantePrefijo, m.comprobanteNumero].filter(Boolean).join('-').toLowerCase();
        const hay =
          (m.producto ?? '').toLowerCase().includes(search) ||
          (m.plu ?? '').toLowerCase().includes(search) ||
          (m.proveedor ?? '').toLowerCase().includes(search) ||
          (m.referencia ?? '').toLowerCase().includes(search) ||
          (m.observaciones ?? '').toLowerCase().includes(search) ||
          comprobante.includes(search);
        if (!hay) return false;
      }
      return true;
    });
  }, [movimientos, producto, proveedor, tipo, desde, hasta, texto]);

  const stats = useMemo(() => {
    const ingresos = filtrados.filter((m) => m.tipo === 'ingreso');
    return {
      total: filtrados.length,
      unidadesCompradas: ingresos.reduce((s, m) => s + toNumber(m.cantidad), 0),
      totalInvertido: ingresos.reduce((s, m) => s + toNumber(m.precioCompra) * toNumber(m.cantidad), 0),
      unidadesVendidas: filtrados
        .filter((m) => m.tipo === 'egreso')
        .reduce((s, m) => s + toNumber(m.cantidad), 0),
    };
  }, [filtrados]);

  const limpiarFiltros = () => {
    setProducto('todos');
    setProveedor('todos');
    setTipo('todos');
    setDesde('');
    setHasta('');
    setTexto('');
  };

  const exportar = () => {
    setExportando(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      exportMovimientosStockPdfLocal(filtrados, `compras_stock_${hoy}.pdf`);
    } finally {
      setExportando(false);
    }
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
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Compras y movimientos de stock</h2>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
            Historial de cargas (compras), ventas y ajustes. Guarda comprobante, precio, proveedor y quién lo cargó.
          </p>
        </div>
        <button className="btn-export" onClick={exportar} disabled={exportando || filtrados.length === 0}>
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

      {/* Resumen */}
      <div className="historial-stats" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card stat-card-primary">
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Movimientos</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-card-value">{stats.unidadesCompradas}</div>
          <div className="stat-card-label">Unidades compradas</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>{money(stats.totalInvertido)}</div>
          <div className="stat-card-label">Total invertido</div>
        </div>
        <div className="stat-card stat-card-inactive">
          <div className="stat-card-value">{stats.unidadesVendidas}</div>
          <div className="stat-card-label">Unidades vendidas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-panel" style={{ marginBottom: '1.25rem' }}>
        <div className="filters-header">
          <div className="filters-title">Filtros</div>
          <button className="clear-search-btn" style={{ position: 'static' }} onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-item">
            <label className="filter-label">Buscar</label>
            <input
              className="form-input"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Producto, PLU, comprobante, proveedor..."
            />
          </div>
          <div className="filter-item">
            <label className="filter-label">Producto</label>
            <select className="form-select" value={producto} onChange={(e) => setProducto(e.target.value)}>
              <option value="todos">Todos</option>
              {productos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">Proveedor</label>
            <select className="form-select" value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
              <option value="todos">Todos</option>
              {proveedores.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">Tipo</label>
            <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="ingreso">Compras</option>
              <option value="egreso">Ventas</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>
          <div className="filter-item">
            <label className="filter-label">Desde</label>
            <input type="date" className="form-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="filter-item">
            <label className="filter-label">Hasta</label>
            <input type="date" className="form-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabla */}
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
              <th style={th}>Fecha</th>
              <th style={th}>Producto</th>
              <th style={th}>Tipo</th>
              <th style={{ ...th, textAlign: 'right' }}>Cant.</th>
              <th style={th}>Comprobante</th>
              <th style={{ ...th, textAlign: 'right' }}>Precio u.</th>
              <th style={{ ...th, textAlign: 'right' }}>Total</th>
              <th style={th}>Proveedor</th>
              <th style={th}>Usuario</th>
              <th style={{ ...th, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>Cargando...</td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay movimientos para el filtro
                </td>
              </tr>
            ) : (
              filtrados.map((m) => {
                const comprobante = [m.comprobantePrefijo, m.comprobanteNumero].filter(Boolean).join('-');
                const esCompra = m.tipo === 'ingreso';
                const total = esCompra ? toNumber(m.precioCompra) * toNumber(m.cantidad) : 0;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{fecha(m.fechaComprobante || m.createdAt)}</td>
                    <td style={{ ...td, fontWeight: 600, color: '#1f2937' }}>
                      {m.producto ?? '-'}
                      {m.plu && <span style={{ color: '#9ca3af', fontWeight: 400 }}> · {m.plu}</span>}
                    </td>
                    <td style={td}>
                      <span style={{ color: TIPO_COLOR[m.tipo] ?? '#374151', fontWeight: 600 }}>
                        {TIPO_LABEL[m.tipo] ?? m.tipo}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{toNumber(m.cantidad)}</td>
                    <td style={td}>{comprobante || '-'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {esCompra && m.precioCompra != null ? money(m.precioCompra) : '-'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>
                      {esCompra && m.precioCompra != null ? money(total) : '-'}
                    </td>
                    <td style={td}>{m.proveedor ?? '-'}</td>
                    <td style={{ ...td, color: '#6b7280' }}>{m.usuario?.username ?? '-'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {esCompra ? (
                        <button
                          className="btn-cancel"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          disabled={eliminandoId === m.id}
                          title="Eliminar esta compra y revertir el stock"
                          onClick={() => eliminar(m)}
                        >
                          {eliminandoId === m.id ? '...' : '🗑 Eliminar'}
                        </button>
                      ) : (
                        <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
