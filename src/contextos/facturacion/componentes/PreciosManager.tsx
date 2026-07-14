// src/contextos/facturacion/componentes/PreciosManager.tsx
import React, { useState } from 'react';
import { Producto, Elemento } from '../../../types';

interface Props {
  productos: Producto[];
  elementos: Elemento[];
  loading: boolean;
  error: string;
  success: string;
  onSaveProductoPrecio: (id: number, precioUnitario: number | null) => Promise<{ success: boolean }>;
  onSaveElemento: (
    id: number,
    data: { precioUnitario: number; esVendible: boolean }
  ) => Promise<{ success: boolean }>;
}

const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: '#6b7280',
};

const td: React.CSSProperties = { padding: '0.6rem 1rem' };

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

export const PreciosManager: React.FC<Props> = ({
  productos,
  elementos,
  loading,
  error,
  success,
  onSaveProductoPrecio,
  onSaveElemento,
}) => {
  // Valores en edición (string para permitir vacío). Clave: prefijo + id.
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [vendibles, setVendibles] = useState<Record<number, boolean>>({});

  const getPrecioProducto = (p: Producto) =>
    precios[`p${p.id}`] ?? (p.precioUnitario != null ? String(p.precioUnitario) : '');

  const getPrecioElemento = (e: Elemento) =>
    precios[`e${e.id}`] ?? (e.precioUnitario != null ? String(e.precioUnitario) : '');

  const getVendible = (e: Elemento) => vendibles[e.id] ?? !!e.esVendible;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Precios de venta por unidad</h2>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
          La venta es por unidad: este es el precio de cada queso/elemento.
        </p>
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

      {/* Quesos */}
      <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Quesos</h3>
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>Producto</th>
              <th style={th}>Tipo</th>
              <th style={{ ...th, width: 180 }}>Precio por unidad</th>
              <th style={{ ...th, textAlign: 'center', width: 110 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay productos cargados
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#1f2937' }}>{p.nombre}</td>
                  <td style={td}>{p.tipoQueso?.nombre || '-'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#6b7280' }}>$</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ maxWidth: 130 }}
                        step="0.01"
                        min="0"
                        value={getPrecioProducto(p)}
                        onChange={(e) => setPrecios({ ...precios, [`p${p.id}`]: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button
                      className="btn-confirm"
                      disabled={loading}
                      onClick={() => {
                        const raw = getPrecioProducto(p);
                        onSaveProductoPrecio(p.id, raw === '' ? null : Number(raw));
                      }}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Elementos */}
      <h3 style={{ color: '#1f2937', marginBottom: '0.75rem' }}>Elementos</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={th}>Elemento</th>
              <th style={{ ...th, textAlign: 'center', width: 110 }}>¿Se vende?</th>
              <th style={{ ...th, width: 180 }}>Precio por unidad</th>
              <th style={{ ...th, textAlign: 'center', width: 110 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {elementos.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>
                  No hay elementos cargados
                </td>
              </tr>
            ) : (
              elementos.map((el) => (
                <tr key={el.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#1f2937' }}>{el.nombre}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={getVendible(el)}
                      onChange={(e) => setVendibles({ ...vendibles, [el.id]: e.target.checked })}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#6b7280' }}>$</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ maxWidth: 130 }}
                        step="0.01"
                        min="0"
                        value={getPrecioElemento(el)}
                        onChange={(e) => setPrecios({ ...precios, [`e${el.id}`]: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button
                      className="btn-confirm"
                      disabled={loading}
                      onClick={() => {
                        const raw = getPrecioElemento(el);
                        onSaveElemento(el.id, {
                          precioUnitario: raw === '' ? 0 : Number(raw),
                          esVendible: getVendible(el),
                        });
                      }}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
