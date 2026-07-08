// src/components/Facturacion/ReporteFacturacion.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ReporteFacturacion as Reporte } from '../../types';
import { apiService } from '../../services/api';

interface Props {
  apiFetch: any;
  onDownloadPdf: (desde: string, hasta: string) => void;
  downloading: boolean;
  esAdmin: boolean;
}

const money = (n: number | string) =>
  `$ ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const hoy = () => new Date().toISOString().slice(0, 10);
const primerDiaMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const th: React.CSSProperties = {
  padding: '0.6rem 1rem',
  textAlign: 'left',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  color: '#6b7280',
};
const td: React.CSSProperties = { padding: '0.55rem 1rem' };
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  background: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const Card: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div style={{ flex: '1 1 150px', background: '#f9fafb', border: '1px solid #eef0f2', borderRadius: 10, padding: '0.75rem 1rem' }}>
    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>{label}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: color || '#111827', marginTop: 2 }}>{value}</div>
  </div>
);

export const ReporteFacturacion: React.FC<Props> = ({ apiFetch, onDownloadPdf, downloading, esAdmin }) => {
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [data, setData] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(false);
  const [limpiando, setLimpiando] = useState(false);

  const limpiarTransacciones = async () => {
    const ok = window.confirm(
      'Esto BORRA todas las transacciones de facturación (notas de pedido, recibos, notas de crédito y stock comercial). ' +
        'Se conservan clientes, proveedores, empresa y productos. ¿Continuar?'
    );
    if (!ok) return;
    setLimpiando(true);
    try {
      const response = await apiService.limpiarFacturacion(apiFetch);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || `HTTP ${response.status}`);
      }
      window.alert('Transacciones de facturación eliminadas. Recargá la página para ver todo limpio.');
      await cargar();
    } catch (e: any) {
      window.alert('No se pudo limpiar: ' + (e?.message || 'error'));
    } finally {
      setLimpiando(false);
    }
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.getReporteFacturacion(apiFetch, desde, hasta);
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error('Error al cargar el reporte:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, desde, hasta]);

  useEffect(() => {
    cargar();
    // Solo al montar; los cambios de fecha se aplican con el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Resumen de ventas</h2>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
          Totales del período elegido. El saldo pendiente y la cuenta corriente son la deuda <strong>actual</strong>.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Desde</label>
          <input type="date" className="form-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Hasta</label>
          <input type="date" className="form-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={cargar} disabled={loading}>
          {loading ? 'Cargando...' : 'Aplicar'}
        </button>
        <button className="btn-export" onClick={() => onDownloadPdf(desde, hasta)} disabled={downloading || !data}>
          {downloading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
      </div>

      {!data ? (
        <p style={{ color: '#888' }}>Sin datos.</p>
      ) : (
        <>
          {/* Tarjetas */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Card label={`Facturado (${data.resumen.cantidadNotas} notas)`} value={money(data.resumen.totalFacturado)} />
            <Card label={`Cobrado (${data.resumen.cantidadRecibos} recibos)`} value={money(data.resumen.totalCobrado)} color="#059669" />
            <Card label={`Notas de crédito (${data.resumen.cantidadNotasCredito})`} value={money(data.resumen.totalCreditado)} color="#b45309" />
            <Card label="Saldo pendiente (hoy)" value={money(data.resumen.saldoPendienteTotal)} color="#dc2626" />
          </div>

          {/* Ventas por producto */}
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Ventas por producto</h3>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={th}>Producto / Ítem</th>
                  <th style={{ ...th, textAlign: 'right' }}>Cantidad</th>
                  <th style={{ ...th, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.ventasPorProducto.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>Sin ventas en el período</td></tr>
                ) : (
                  data.ventasPorProducto.map((v) => (
                    <tr key={v.descripcion} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ ...td, fontWeight: 600 }}>{v.descripcion}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{v.cantidad}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(v.monto)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cuenta corriente */}
          <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Cuenta corriente (saldo actual por cliente)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={th}>Cliente</th>
                  <th style={{ ...th, textAlign: 'right' }}>Facturado</th>
                  <th style={{ ...th, textAlign: 'right' }}>Cobrado</th>
                  <th style={{ ...th, textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data.cuentaCorriente.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#6b7280' }}>Sin clientes con movimientos</td></tr>
                ) : (
                  data.cuentaCorriente.map((c) => (
                    <tr key={c.clienteId} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ ...td, fontWeight: 600 }}>{c.cliente}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(c.facturado)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{money(c.cobrado)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: c.saldo > 0 ? '#dc2626' : '#059669' }}>
                        {money(c.saldo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {esAdmin && (
        <div
          style={{
            marginTop: '2.5rem',
            padding: '1rem',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '0.25rem' }}>Zona de peligro</div>
          <p style={{ color: '#7f1d1d', fontSize: '0.85rem', margin: '0 0 0.6rem' }}>
            Borra todas las transacciones de facturación (notas de pedido, recibos, notas de crédito y stock comercial).
            Conserva clientes, proveedores, empresa, productos e inventario físico. Útil para limpiar datos de prueba.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ background: '#dc2626' }}
            onClick={limpiarTransacciones}
            disabled={limpiando}
          >
            {limpiando ? 'Borrando...' : '🧹 Borrar transacciones de facturación'}
          </button>
        </div>
      )}
    </div>
  );
};
