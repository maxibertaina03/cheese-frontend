import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiService } from '../../services/api';
import { User } from '../../types';
import './Dashboard.css';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

interface DashboardProps {
  user: User;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onVolver: () => void;
  unidades?: any[];
  historialUnidades?: any[];
  productos?: any[];
}

interface DashboardVenta {
  fecha: string;
  producto: string;
  totalPeso: number;
  cantidadCortes: number;
  motivo?: string | null;
}

interface DashboardInventario {
  tipoQueso?: string;
  producto?: string;
  cantidad: number;
  pesoTotal: number;
  precioKilo?: number;
  valorTotal?: number;
}

interface DashboardTopProducto {
  productoId?: number;
  nombre: string;
  totalVendido: number;
  cantidadCortes: number;
  promedioCorte: number;
}

interface DashboardData {
  inventarioActual: DashboardInventario[];
  ventas: {
    hoy: DashboardVenta[];
    semana: DashboardVenta[];
    mes: DashboardVenta[];
    personalizado?: DashboardVenta[];
  };
  topProductos: DashboardTopProducto[];
  inventarioValorizado: DashboardInventario[];
  alertas: any[];
  periodoActual?: {
    tipo: 'hoy' | 'semana' | 'mes' | 'personalizado';
    fechaInicio: string | null;
    fechaFin: string | null;
  };
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const PERIODO_LABELS: Record<Periodo, string> = {
  hoy: 'hoy',
  semana: 'ultimos 7 dias',
  mes: 'ultimos 30 dias',
  personalizado: 'rango personalizado',
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatKg = (grams: number) => (grams / 1000).toFixed(2);

const agruparTopProductos = (ventas: DashboardVenta[]) => {
  const productos = new Map<string, DashboardTopProducto>();

  ventas.forEach((venta) => {
    const existente = productos.get(venta.producto) ?? {
      nombre: venta.producto,
      totalVendido: 0,
      cantidadCortes: 0,
      promedioCorte: 0,
    };

    existente.totalVendido += toNumber(venta.totalPeso);
    existente.cantidadCortes += toNumber(venta.cantidadCortes);
    existente.promedioCorte =
      existente.cantidadCortes > 0 ? existente.totalVendido / existente.cantidadCortes : 0;

    productos.set(venta.producto, existente);
  });

  return Array.from(productos.values()).sort((a, b) => b.totalVendido - a.totalVendido);
};

const agruparVentasPorFecha = (ventas: DashboardVenta[]) => {
  const fechas = new Map<
    string,
    { fecha: string; label: string; totalPeso: number; pesoKg: number; cantidadCortes: number }
  >();

  ventas.forEach((venta) => {
    const fecha = venta.fecha;
    const label = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
    const existente = fechas.get(fecha) ?? {
      fecha,
      label,
      totalPeso: 0,
      pesoKg: 0,
      cantidadCortes: 0,
    };

    existente.totalPeso += toNumber(venta.totalPeso);
    existente.cantidadCortes += toNumber(venta.cantidadCortes);
    existente.pesoKg = Number((existente.totalPeso / 1000).toFixed(2));
    fechas.set(fecha, existente);
  });

  return Array.from(fechas.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const buildFallbackDashboard = (
  unidades: any[],
  historialUnidades: any[],
  params?: { fechaInicio?: string; fechaFin?: string }
): DashboardData => {
  const now = new Date();
  const ranges = {
    hoy: { start: startOfDay(now), end: endOfDay(now) },
    semana: { start: startOfDay(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), end: endOfDay(now) },
    mes: { start: startOfDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)), end: endOfDay(now) },
    personalizado: params?.fechaInicio && params?.fechaFin
      ? { start: startOfDay(new Date(params.fechaInicio)), end: endOfDay(new Date(params.fechaFin)) }
      : null,
  };

  const inventarioMap = new Map<string, DashboardInventario>();
  unidades
    .filter((unidad) => unidad?.activa)
    .forEach((unidad) => {
      const tipo = unidad.producto?.tipoQueso?.nombre || 'Sin tipo';
      const existente = inventarioMap.get(tipo) ?? { tipoQueso: tipo, cantidad: 0, pesoTotal: 0 };
      existente.cantidad += 1;
      existente.pesoTotal += toNumber(unidad.pesoActual);
      inventarioMap.set(tipo, existente);
    });

  const valorizadoMap = new Map<string, DashboardInventario>();
  unidades
    .filter((unidad) => unidad?.activa && unidad.producto?.precioPorKilo)
    .forEach((unidad) => {
      const producto = unidad.producto.nombre || 'Sin producto';
      const precioKilo = toNumber(unidad.producto.precioPorKilo);
      const existente = valorizadoMap.get(producto) ?? {
        producto,
        cantidad: 0,
        pesoTotal: 0,
        precioKilo,
        valorTotal: 0,
      };
      existente.cantidad += 1;
      existente.pesoTotal += toNumber(unidad.pesoActual);
      existente.valorTotal = (existente.valorTotal ?? 0) + (toNumber(unidad.pesoActual) * precioKilo) / 1000;
      valorizadoMap.set(producto, existente);
    });

  const allVentas = historialUnidades.flatMap((unidad) =>
    (unidad.particiones || []).map((particion: any) => ({
      fecha: String(particion.createdAt || '').slice(0, 10),
      producto: unidad.producto?.nombre || 'Sin producto',
      totalPeso: toNumber(particion.peso),
      cantidadCortes: 1,
      motivo: particion.motivo?.nombre ?? null,
    }))
  );

  const ventasForRange = (range: { start: Date; end: Date } | null) => {
    if (!range) {
      return [];
    }

    const grouped = new Map<string, DashboardVenta>();
    allVentas.forEach((venta) => {
      const fecha = new Date(`${venta.fecha}T00:00:00`);
      if (fecha < range.start || fecha > range.end) {
        return;
      }

      const key = `${venta.fecha}-${venta.producto}-${venta.motivo ?? ''}`;
      const existente = grouped.get(key) ?? {
        fecha: venta.fecha,
        producto: venta.producto,
        motivo: venta.motivo,
        totalPeso: 0,
        cantidadCortes: 0,
      };
      existente.totalPeso += venta.totalPeso;
      existente.cantidadCortes += venta.cantidadCortes;
      grouped.set(key, existente);
    });

    return Array.from(grouped.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  };

  const ventas = {
    hoy: ventasForRange(ranges.hoy),
    semana: ventasForRange(ranges.semana),
    mes: ventasForRange(ranges.mes),
    personalizado: ventasForRange(ranges.personalizado),
  };

  return {
    inventarioActual: Array.from(inventarioMap.values()),
    ventas,
    topProductos: agruparTopProductos(ventas.personalizado.length ? ventas.personalizado : ventas.semana),
    inventarioValorizado: Array.from(valorizadoMap.values()),
    alertas: [],
    periodoActual: params?.fechaInicio && params?.fechaFin
      ? { tipo: 'personalizado', fechaInicio: params.fechaInicio, fechaFin: params.fechaFin }
      : { tipo: 'semana', fechaInicio: null, fechaFin: null },
  };
};

export const Dashboard: React.FC<DashboardProps> = ({
  user: _user,
  apiFetch,
  onVolver,
  unidades = [],
  historialUnidades = [],
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customError, setCustomError] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const fetchDashboard = useCallback(
    async (params?: { fechaInicio?: string; fechaFin?: string }) => {
      try {
        const response = await apiService.getDashboard(apiFetch, params);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'No se pudo cargar el dashboard');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
        setDashboardError('');
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
        setData(buildFallbackDashboard(unidades, historialUnidades, params));
        setDashboardError('No se pudo cargar el dashboard desde el servidor. Se muestran datos locales.');
      } finally {
        setLoading(false);
        setCustomLoading(false);
      }
    },
    [apiFetch, historialUnidades, unidades]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handlePeriodoClick = async (nextPeriodo: Exclude<Periodo, 'personalizado'>) => {
    setPeriodo(nextPeriodo);
    setCustomError('');

    if (data?.periodoActual?.tipo === 'personalizado') {
      setLoading(true);
      await fetchDashboard();
    }
  };

  const aplicarRangoPersonalizado = async () => {
    if (!customStart || !customEnd) {
      setCustomError('Completá fecha desde y fecha hasta.');
      return;
    }

    if (customStart > customEnd) {
      setCustomError('La fecha desde no puede ser mayor a la fecha hasta.');
      return;
    }

    setCustomError('');
    setPeriodo('personalizado');
    setCustomLoading(true);
    await fetchDashboard({ fechaInicio: customStart, fechaFin: customEnd });
  };

  const exportarReporte = async (formato: 'excel' | 'pdf') => {
    try {
      setExporting(formato);

      const params =
        periodo === 'personalizado' && customStart && customEnd
          ? { fechaInicio: customStart, fechaFin: customEnd }
          : undefined;

      const response = await apiService.downloadReporte(apiFetch, formato, params);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `No se pudo exportar ${formato}`);
      }

      const blob = await response.blob();
      const suffix =
        periodo === 'personalizado' && customStart && customEnd
          ? `${customStart}_${customEnd}`
          : periodo;

      downloadBlob(blob, `reporte_${suffix}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
    } catch (error) {
      console.error(`Error al exportar ${formato}:`, error);
    } finally {
      setExporting(null);
    }
  };

  const periodoLabel = useMemo(() => {
    if (periodo === 'personalizado' && customStart && customEnd) {
      return `${customStart} a ${customEnd}`;
    }

    return PERIODO_LABELS[periodo];
  }, [customEnd, customStart, periodo]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="chart-empty">No hay datos disponibles para mostrar.</div>
        <button className="btn-back" onClick={onVolver}>
          Volver al inventario
        </button>
      </div>
    );
  }

  const ventasPeriodo =
    periodo === 'personalizado' ? data.ventas.personalizado ?? [] : data.ventas?.[periodo] ?? [];
  const topProductosPeriodo =
    periodo === 'personalizado'
      ? data.topProductos ?? []
      : agruparTopProductos(ventasPeriodo);
  const ventasPorFecha = agruparVentasPorFecha(ventasPeriodo);
  const inventarioActual =
    data.inventarioActual?.length > 0
      ? data.inventarioActual
      : unidades
          .filter((unidad) => unidad.activa)
          .map((unidad) => ({
            tipoQueso: unidad.producto?.nombre || 'Desconocido',
            cantidad: 1,
            pesoTotal: toNumber(unidad.pesoActual),
          }));

  const inventarioPorTipo = inventarioActual.reduce(
    (acumulado: Array<{ name: string; value: number }>, item) => {
      const tipo = item.tipoQueso || item.producto || 'Otros';
      const existente = acumulado.find((entry) => entry.name === tipo);
      const pesoKg = toNumber(item.pesoTotal) / 1000;

      if (existente) {
        existente.value += pesoKg;
      } else {
        acumulado.push({ name: tipo, value: pesoKg });
      }

      return acumulado;
    },
    []
  );

  const totalUnidades = inventarioActual.reduce(
    (total, item) => total + toNumber(item.cantidad || 1),
    0
  );
  const totalPesoStock = inventarioActual.reduce((total, item) => total + toNumber(item.pesoTotal), 0);
  const valorInventario = (data.inventarioValorizado || []).reduce(
    (total, item) => total + toNumber(item.valorTotal),
    0
  );
  const totalCortesPeriodo = ventasPeriodo.reduce(
    (total, venta) => total + toNumber(venta.cantidadCortes),
    0
  );
  const pesoVendidoPeriodo = ventasPeriodo.reduce(
    (total, venta) => total + toNumber(venta.totalPeso),
    0
  );
  const diasConMovimiento = ventasPorFecha.length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Analitico</h1>
          <p className="periodo-copy">Vista operativa para {periodoLabel}.</p>
          <button className="btn-back" onClick={onVolver} style={{ marginTop: '0.5rem' }}>
            Volver al inventario
          </button>
        </div>
        <div className="periodo-selector">
          {(['hoy', 'semana', 'mes'] as Array<Exclude<Periodo, 'personalizado'>>).map((item) => (
            <button
              key={item}
              className={periodo === item ? 'active' : ''}
              onClick={() => void handlePeriodoClick(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {dashboardError ? <div className="custom-range-error">{dashboardError}</div> : null}

      <div className="custom-range-card">
        <div className="custom-range-grid">
          <label>
            <span>Desde</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
            />
          </label>
          <label>
            <span>Hasta</span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
            />
          </label>
          <button
            className="btn-export custom-range-button"
            onClick={() => void aplicarRangoPersonalizado()}
            disabled={customLoading}
          >
            {customLoading ? 'Aplicando...' : 'Aplicar rango'}
          </button>
        </div>
        {customError ? <div className="custom-range-error">{customError}</div> : null}
      </div>

      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{totalUnidades}</div>
            <div className="kpi-label">Unidades en stock</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{formatKg(totalPesoStock)} kg</div>
            <div className="kpi-label">Peso total en stock</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">${valorInventario.toFixed(0)}</div>
            <div className="kpi-label">Valor del inventario</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{totalCortesPeriodo}</div>
            <div className="kpi-label">Cortes en {periodoLabel}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{formatKg(pesoVendidoPeriodo)} kg</div>
            <div className="kpi-label">Peso vendido en {periodoLabel}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{diasConMovimiento}</div>
            <div className="kpi-label">Dias con movimiento</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top 5 productos vendidos ({periodoLabel})</h3>
          {topProductosPeriodo.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductosPeriodo.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalVendido" fill="#f59e0b" name="Peso vendido (g)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No hubo ventas registradas en este periodo.</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Ventas por dia ({periodoLabel})</h3>
          {ventasPorFecha.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorFecha}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="peso" />
                <YAxis yAxisId="cortes" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="peso" dataKey="pesoKg" fill="#10b981" name="Peso vendido (kg)" />
                <Bar yAxisId="cortes" dataKey="cantidadCortes" fill="#3b82f6" name="Cortes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No hay movimientos para graficar en este periodo.</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Inventario por tipo de queso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventarioPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (value > 0 ? `${name}: ${value.toFixed(1)}kg` : '')}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inventarioPorTipo.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="productos-table-card">
        <h3>Detalle de productos mas vendidos ({periodoLabel})</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Total vendido</th>
              <th>Cantidad cortes</th>
              <th>Promedio por corte</th>
            </tr>
          </thead>
          <tbody>
            {topProductosPeriodo.length > 0 ? (
              topProductosPeriodo.map((producto) => (
                <tr key={producto.nombre}>
                  <td>{producto.nombre}</td>
                  <td>{formatKg(producto.totalVendido)} kg</td>
                  <td>{producto.cantidadCortes}</td>
                  <td>{producto.promedioCorte.toFixed(0)} g</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="table-empty">
                  No hubo ventas registradas en {periodoLabel}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="export-buttons">
        <button
          className="btn-export"
          onClick={() => void exportarReporte('excel')}
          disabled={exporting !== null}
        >
          {exporting === 'excel' ? 'Exportando Excel...' : 'Exportar a Excel'}
        </button>
        <button
          className="btn-export btn-export-danger"
          onClick={() => void exportarReporte('pdf')}
          disabled={exporting !== null}
        >
          {exporting === 'pdf' ? 'Exportando PDF...' : 'Exportar a PDF'}
        </button>
      </div>
    </div>
  );
};
