// src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { User } from '../../types';
import './Dashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardProps {
  user: User;
  onVolver: () => void;
  unidades?: any[];
  historialUnidades?: any[];
  productos?: any[];
}

interface DashboardData {
  inventarioActual: any[];
  ventas: {
    hoy: any[];
    semana: any[];
    mes: any[];
  };
  topProductos: any[];
  inventarioValorizado: any[];
  alertas: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onVolver,
  unidades = [],
  historialUnidades = [],
  productos = []
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('semana');

  // Refs para capturar gráficos como imágenes
  const topProductosRef = useRef<HTMLDivElement>(null);
  const inventarioTipoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/reportes/dashboard`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);

      const dashboardData = await dashboardRes.json();

      console.log('Respuesta API dashboard:', dashboardData);
      console.log('Props unidades:', unidades.length);
      console.log('Props historial:', historialUnidades.length);

      setData(dashboardData);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

  // Usar datos de API si existen, sino calcular de props
  const unidadesActivas = data.inventarioActual?.length > 0 
    ? data.inventarioActual 
    : unidades.filter(u => u.activa).map(u => ({
        tipoQueso: u.producto?.nombre || 'Desconocido',
        cantidad: 1,
        pesoTotal: u.pesoActual
      }));

  const topProductos = data.topProductos?.length > 0 
    ? data.topProductos 
    : calcularTopProductos(historialUnidades);

  // Preparar datos para gráficos
  const inventarioPorTipo = unidadesActivas.reduce((acc: any[], inv) => {
    const tipo = inv.tipoQueso || inv.producto?.nombre || 'Otros';
    const existente = acc.find(item => item.name === tipo);
    const peso = parseFloat(inv.pesoTotal || inv.pesoActual || 0) / 1000;
    
    if (existente) {
      existente.value += peso;
    } else {
      acc.push({ name: tipo, value: peso });
    }
    return acc;
  }, []);

  // Calcular KPIs
  const totalUnidades = unidadesActivas.length;
  
  const totalPeso = unidadesActivas.reduce((sum, inv) => 
    sum + (parseFloat(inv.pesoTotal || inv.pesoActual || 0)), 0
  );
  
  const totalCortes = topProductos.reduce((sum, p) => 
    sum + (parseInt(p.cantidadCortes || 0)), 0
  );

  // Función auxiliar para top productos desde historial
  function calcularTopProductos(historial: any[]) {
    const productosMap: { [key: string]: any } = {};
    
    historial
      .filter(u => !u.activa)
      .forEach(u => {
        const nombre = u.producto?.nombre || 'Desconocido';
        if (!productosMap[nombre]) {
          productosMap[nombre] = {
            nombre,
            totalVendido: 0,
            cantidadCortes: 0
          };
        }
        productosMap[nombre].totalVendido += parseFloat(u.pesoInicial || 0);
        productosMap[nombre].cantidadCortes += 1;
      });

    return Object.values(productosMap)
      .map((p: any) => ({
        ...p,
        promedioCorte: p.cantidadCortes > 0 ? p.totalVendido / p.cantidadCortes : 0
      }))
      .sort((a: any, b: any) => b.totalVendido - a.totalVendido);
  }

  // 📊 EXPORTAR A EXCEL
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Hoja 1: Resumen KPIs
    const kpiData = [
      { Indicador: 'Unidades en Stock', Valor: totalUnidades },
      { Indicador: 'Peso Total (kg)', Valor: (totalPeso / 1000).toFixed(2) },
      { Indicador: 'Total Cortes', Valor: totalCortes },
    ];
    const wsKPI = XLSX.utils.json_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'Resumen');

    // Hoja 2: Inventario por Tipo
    const inventarioData = inventarioPorTipo.map(item => ({
      'Tipo de Queso': item.name,
      'Peso Total (kg)': item.value.toFixed(2)
    }));
    const wsInventario = XLSX.utils.json_to_sheet(inventarioData);
    XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario por Tipo');

    // Hoja 3: Top Productos
    const topProductosData = topProductos.map(prod => ({
      'Producto': prod.nombre,
      'Total Vendido (kg)': (parseFloat(prod.totalVendido || 0) / 1000).toFixed(2),
      'Cantidad Cortes': prod.cantidadCortes,
      'Promedio por Corte (g)': (parseFloat(prod.promedioCorte || 0)).toFixed(0)
    }));
    const wsTop = XLSX.utils.json_to_sheet(topProductosData);
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');

    // Descargar
    XLSX.writeFile(wb, `Dashboard_Quesos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 📄 EXPORTAR A PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString('es-AR');
    
    // Título
    doc.setFontSize(20);
    doc.text('Dashboard - Stock de Quesos', 14, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${fecha}`, 14, 30);

    // KPIs
    doc.setFontSize(14);
    doc.text('Resumen General', 14, 45);
    doc.setFontSize(11);
    doc.text(`• Unidades en Stock: ${totalUnidades}`, 14, 55);
    doc.text(`• Peso Total: ${(totalPeso / 1000).toFixed(1)} kg`, 14, 62);
    doc.text(`• Total Cortes: ${totalCortes}`, 14, 69);

    // Tabla Top Productos
    doc.setFontSize(14);
    doc.text('Top Productos Vendidos', 14, 85);
    
    const tableData = topProductos.map(prod => [
      prod.nombre,
      `${(parseFloat(prod.totalVendido || 0) / 1000).toFixed(2)} kg`,
      prod.cantidadCortes.toString(),
      `${(parseFloat(prod.promedioCorte || 0)).toFixed(0)} g`
    ]);

    (doc as any).autoTable({
      startY: 90,
      head: [['Producto', 'Total Vendido', 'Cortes', 'Promedio']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }
    });

    // Tabla Inventario por Tipo
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Inventario por Tipo de Queso', 14, finalY);
    
    const inventarioData = inventarioPorTipo.map(item => [
      item.name,
      `${item.value.toFixed(2)} kg`
    ]);

    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Tipo de Queso', 'Peso Total']],
      body: inventarioData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Dashboard_Quesos_${fecha.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>📊 Dashboard Analítico</h1>
          <button 
            className="btn-back" 
            onClick={onVolver}
            style={{ marginTop: '0.5rem' }}
          >
            ← Volver al Inventario
          </button>
        </div>
        <div className="periodo-selector">
          {['hoy', 'semana', 'mes'].map((p) => (
            <button 
              key={p}
              className={periodo === p ? 'active' : ''}
              onClick={() => setPeriodo(p as any)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <div className="kpi-value">{totalUnidades}</div>
            <div className="kpi-label">Unidades en Stock</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⚖️</div>
          <div className="kpi-content">
            <div className="kpi-value">{(totalPeso / 1000).toFixed(1)} kg</div>
            <div className="kpi-label">Peso Total</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">✂️</div>
          <div className="kpi-content">
            <div className="kpi-value">{totalCortes}</div>
            <div className="kpi-label">Cortes Totales</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Top productos */}
        <div className="chart-card" ref={topProductosRef}>
          <h3>Top 5 Productos Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductos.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalVendido" fill="#f59e0b" name="Peso Vendido (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventario por tipo */}
        <div className="chart-card" ref={inventarioTipoRef}>
          <h3>Inventario por Tipo de Queso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventarioPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value.toFixed(1)}kg` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {inventarioPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="productos-table-card">
        <h3>Detalle de Productos Más Vendidos</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Total Vendido</th>
              <th>Cantidad Cortes</th>
              <th>Promedio por Corte</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((prod, idx) => (
              <tr key={idx}>
                <td>{prod.nombre}</td>
                <td>{(parseFloat(prod.totalVendido || 0) / 1000).toFixed(2)} kg</td>
                <td>{prod.cantidadCortes}</td>
                <td>{(parseFloat(prod.promedioCorte || 0)).toFixed(0)} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de exportación */}
      <div className="export-buttons">
        <button 
          className="btn-export"
          onClick={exportarExcel}
        >
          📊 Exportar a Excel
        </button>
        <button 
          className="btn-export"
          onClick={exportarPDF}
          style={{ background: '#dc2626' }}
        >
          📄 Exportar a PDF
        </button>
      </div>
    </div>
  );
};