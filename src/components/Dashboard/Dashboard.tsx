import React, { useCallback, useEffect, useState } from 'react';
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { apiService } from '../../services/api';
import { User } from '../../types';
import './Dashboard.css';

type Periodo = 'hoy' | 'semana' | 'mes';

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
  ventas: Record<Periodo, DashboardVenta[]>;
  topProductos: DashboardTopProducto[];
  inventarioValorizado: DashboardInventario[];
  alertas: any[];
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const PERIODO_LABELS: Record<Periodo, string> = {
  hoy: 'hoy',
  semana: 'ultimos 7 dias',
  mes: 'ultimos 30 dias',
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

export const Dashboard: React.FC<DashboardProps> = ({
  user: _user,
  apiFetch,
  onVolver,
  unidades = [],
  historialUnidades: _historialUnidades = [],
  productos: _productos = [],
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('semana');

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await apiService.getDashboard(apiFetch);

      if (!response.ok) {
        throw new Error('No se pudo cargar el dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const periodoLabel = PERIODO_LABELS[periodo];
  const ventasPeriodo = data.ventas?.[periodo] ?? [];
  const topProductosPeriodo = agruparTopProductos(ventasPeriodo);
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

  const exportarExcel = () => {
    const workbook = XLSX.utils.book_new();
    const resumen = [
      { Indicador: 'Periodo analizado', Valor: periodoLabel },
      { Indicador: 'Unidades en stock', Valor: totalUnidades },
      { Indicador: 'Peso total en stock (kg)', Valor: formatKg(totalPesoStock) },
      { Indicador: 'Valor del inventario', Valor: valorInventario.toFixed(2) },
      { Indicador: 'Cortes del periodo', Valor: totalCortesPeriodo },
      { Indicador: 'Peso vendido en el periodo (kg)', Valor: formatKg(pesoVendidoPeriodo) },
      { Indicador: 'Dias con movimiento', Valor: diasConMovimiento },
    ];

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumen), 'Resumen');

    const ventasData = ventasPorFecha.map((venta) => ({
      Fecha: venta.label,
      'Peso vendido (kg)': venta.pesoKg.toFixed(2),
      Cortes: venta.cantidadCortes,
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(ventasData.length ? ventasData : [{ Fecha: 'Sin datos', 'Peso vendido (kg)': '0.00', Cortes: 0 }]),
      'Ventas periodo'
    );

    const topProductosData = topProductosPeriodo.map((producto) => ({
      Producto: producto.nombre,
      'Total vendido (kg)': formatKg(producto.totalVendido),
      'Cantidad de cortes': producto.cantidadCortes,
      'Promedio por corte (g)': producto.promedioCorte.toFixed(0),
    }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        topProductosData.length
          ? topProductosData
          : [{ Producto: 'Sin ventas', 'Total vendido (kg)': '0.00', 'Cantidad de cortes': 0, 'Promedio por corte (g)': '0' }]
      ),
      'Top productos'
    );

    const inventarioData = inventarioPorTipo.map((item) => ({
      'Tipo de queso': item.name,
      'Peso total (kg)': item.value.toFixed(2),
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(inventarioData), 'Inventario');

    XLSX.writeFile(workbook, `Dashboard_Quesos_${periodo}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString('es-AR');

    doc.setFontSize(20);
    doc.text('Dashboard - Stock de Quesos', 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 14, 29);
    doc.text(`Periodo: ${periodoLabel}`, 14, 36);

    doc.setFontSize(14);
    doc.text('Resumen general', 14, 50);
    doc.setFontSize(11);
    doc.text(`Unidades en stock: ${totalUnidades}`, 14, 60);
    doc.text(`Peso total en stock: ${formatKg(totalPesoStock)} kg`, 14, 67);
    doc.text(`Valor del inventario: $${valorInventario.toFixed(2)}`, 14, 74);
    doc.text(`Cortes del periodo: ${totalCortesPeriodo}`, 14, 81);
    doc.text(`Peso vendido: ${formatKg(pesoVendidoPeriodo)} kg`, 14, 88);

    const topProductosTable = topProductosPeriodo.length
      ? topProductosPeriodo.map((producto) => [
          producto.nombre,
          `${formatKg(producto.totalVendido)} kg`,
          producto.cantidadCortes.toString(),
          `${producto.promedioCorte.toFixed(0)} g`,
        ])
      : [['Sin ventas', '0.00 kg', '0', '0 g']];

    doc.setFontSize(14);
    doc.text('Top productos del periodo', 14, 104);
    (doc as any).autoTable({
      startY: 109,
      head: [['Producto', 'Total vendido', 'Cortes', 'Promedio']],
      body: topProductosTable,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
    });

    const inventarioTable = inventarioPorTipo.map((item) => [item.name, `${item.value.toFixed(2)} kg`]);
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Inventario por tipo', 14, finalY);
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Tipo de queso', 'Peso total']],
      body: inventarioTable,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Dashboard_Quesos_${periodo}_${fecha.replace(/\//g, '-')}.pdf`);
  };

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
          {(['hoy', 'semana', 'mes'] as Periodo[]).map((item) => (
            <button
              key={item}
              className={periodo === item ? 'active' : ''}
              onClick={() => setPeriodo(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
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
        <button className="btn-export" onClick={exportarExcel}>
          Exportar a Excel
        </button>
        <button className="btn-export btn-export-danger" onClick={exportarPDF}>
          Exportar a PDF
        </button>
      </div>
    </div>
  );
};
