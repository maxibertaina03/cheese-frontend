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

type PeriodoIndumentaria = 'todo' | 'semana' | 'mes';

interface IndumentariaMetricsProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface IndumentariaDashboard {
  resumen: {
    totalPrendas: number;
    totalUnidades: number;
    totalIngresado: number;
    totalEntregado: number;
    prendasStockBajo: number;
  };
  porCategoria: { categoria: string; prendas: number; unidades: number }[];
  porProveedor: { proveedor: string; prendas: number; unidades: number }[];
  topEntregas: { destino: string; cantidad: number; entregas: number }[];
  topPrendasEntregadas: { nombre: string; cantidad: number }[];
  movimientosPorDia: { fecha: string; ingresos: number; egresos: number }[];
  stockBajo: {
    id: number;
    nombre: string;
    talle: string | null;
    cantidadDisponible: number;
    stockMinimo: number;
  }[];
  periodo: { fechaInicio: string | null; fechaFin: string | null; label: string };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899'];

const PERIODO_LABELS: Record<PeriodoIndumentaria, string> = {
  todo: 'Historico',
  semana: 'Ultimos 7 dias',
  mes: 'Ultimos 30 dias',
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const rangoParaPeriodo = (
  periodo: PeriodoIndumentaria
): { fechaInicio?: string; fechaFin?: string } | undefined => {
  if (periodo === 'todo') {
    return undefined;
  }

  const dias = periodo === 'semana' ? 6 : 29;
  return {
    fechaInicio: toISODate(new Date(Date.now() - dias * 24 * 60 * 60 * 1000)),
    fechaFin: toISODate(new Date()),
  };
};

const formatShortDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });
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

export const IndumentariaMetrics: React.FC<IndumentariaMetricsProps> = ({ apiFetch }) => {
  const [data, setData] = useState<IndumentariaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState<PeriodoIndumentaria>('todo');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const fetchData = useCallback(
    async (periodoActual: PeriodoIndumentaria) => {
      setLoading(true);
      try {
        const params = rangoParaPeriodo(periodoActual);
        const response = await apiService.getIndumentariaDashboard(apiFetch, params);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'No se pudieron cargar las metricas de indumentaria');
        }

        setData(await response.json());
        setError('');
      } catch (err) {
        console.error('Error al cargar metricas de indumentaria:', err);
        setError('No se pudieron cargar las metricas de indumentaria.');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    void fetchData(periodo);
  }, [fetchData, periodo]);

  const exportar = async (formato: 'excel' | 'pdf') => {
    try {
      setExporting(formato);
      const params = rangoParaPeriodo(periodo);
      const response = await apiService.downloadIndumentariaReporte(apiFetch, formato, params);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `No se pudo exportar ${formato}`);
      }

      const blob = await response.blob();
      const suffix = periodo === 'todo' ? 'historico' : periodo;
      downloadBlob(blob, `reporte_indumentaria_${suffix}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
    } catch (err) {
      console.error(`Error al exportar ${formato}:`, err);
    } finally {
      setExporting(null);
    }
  };

  const categoriaChart = useMemo(
    () => (data?.porCategoria ?? []).map((item) => ({ name: item.categoria, value: item.unidades })),
    [data]
  );

  if (loading && !data) {
    return (
      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Indumentaria (prendas)</h3>
        <div className="chart-empty">Cargando metricas de indumentaria...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="chart-card" style={{ marginTop: '1.5rem' }}>
        <h3>Indumentaria (prendas)</h3>
        <div className="chart-empty">{error || 'No hay datos de indumentaria para mostrar.'}</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div className="dashboard-header">
        <div>
          <h1>Indumentaria (prendas)</h1>
          <p className="periodo-copy">
            Metricas de stock y entregas - {PERIODO_LABELS[periodo]}.
          </p>
        </div>
        <div className="periodo-selector">
          {(['todo', 'semana', 'mes'] as PeriodoIndumentaria[]).map((item) => (
            <button
              key={item}
              className={periodo === item ? 'active' : ''}
              onClick={() => setPeriodo(item)}
            >
              {item === 'todo' ? 'Historico' : item === 'semana' ? '7 dias' : '30 dias'}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="custom-range-error">{error}</div> : null}

      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{data.resumen.totalPrendas}</div>
            <div className="kpi-label">Prendas activas</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{data.resumen.totalUnidades}</div>
            <div className="kpi-label">Unidades en stock</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{data.resumen.totalIngresado}</div>
            <div className="kpi-label">Total ingresado (historico)</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{data.resumen.totalEntregado}</div>
            <div className="kpi-label">Entregado ({PERIODO_LABELS[periodo].toLowerCase()})</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-content">
            <div className="kpi-value">{data.resumen.prendasStockBajo}</div>
            <div className="kpi-label">Prendas con stock bajo</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>A quien se entrego (top destinos)</h3>
          {data.topEntregas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topEntregas.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="destino" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#6366f1" name="Unidades entregadas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No hubo entregas en este periodo.</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Stock por categoria</h3>
          {categoriaChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriaChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                  outerRadius={80}
                  dataKey="value"
                >
                  {categoriaChart.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No hay prendas en stock.</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Ingresos vs egresos por dia</h3>
          {data.movimientosPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.movimientosPorDia.map((item) => ({
                  ...item,
                  label: formatShortDate(item.fecha),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No hay movimientos para graficar.</div>
          )}
        </div>
      </div>

      <div className="productos-table-card">
        <h3>Prendas mas entregadas</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Unidades entregadas</th>
            </tr>
          </thead>
          <tbody>
            {data.topPrendasEntregadas.length > 0 ? (
              data.topPrendasEntregadas.map((prenda) => (
                <tr key={prenda.nombre}>
                  <td>{prenda.nombre}</td>
                  <td>{prenda.cantidad}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="table-empty">
                  No hubo entregas en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="productos-table-card">
        <h3>Prendas con stock bajo</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Prenda</th>
              <th>Talle</th>
              <th>Disponible</th>
              <th>Stock minimo</th>
            </tr>
          </thead>
          <tbody>
            {data.stockBajo.length > 0 ? (
              data.stockBajo.map((prenda) => (
                <tr key={prenda.id}>
                  <td>{prenda.nombre}</td>
                  <td>{prenda.talle ?? '-'}</td>
                  <td>{prenda.cantidadDisponible}</td>
                  <td>{prenda.stockMinimo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="table-empty">
                  No hay prendas por debajo del stock minimo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="export-buttons">
        <button
          className="btn-export"
          onClick={() => void exportar('excel')}
          disabled={exporting !== null}
        >
          {exporting === 'excel' ? 'Exportando Excel...' : 'Exportar indumentaria a Excel'}
        </button>
        <button
          className="btn-export btn-export-danger"
          onClick={() => void exportar('pdf')}
          disabled={exporting !== null}
        >
          {exporting === 'pdf' ? 'Exportando PDF...' : 'Exportar indumentaria a PDF'}
        </button>
      </div>
    </div>
  );
};
