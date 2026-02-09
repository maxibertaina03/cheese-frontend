// src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { User } from '../../types';
import './Dashboard.css';

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashboardRes, alertasRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/reportes/dashboard`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/api/alertas`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);

      const dashboardData = await dashboardRes.json();
      const alertasData = await alertasRes.json();

      console.log('Respuesta API dashboard:', dashboardData);
      console.log('Props unidades:', unidades.length);
      console.log('Props historial:', historialUnidades.length);

      setData({
        ...dashboardData,
        alertas: alertasData
      });
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

  const ventasDesdeApi = data.ventas?.[periodo] || [];
  
  // Si no hay ventas en la API, calcular desde historial
  const ventasPeriodo = ventasDesdeApi.length > 0 
    ? ventasDesdeApi 
    : calcularVentasDesdeHistorial(historialUnidades, periodo);

  const topProductos = data.topProductos?.length > 0 
    ? data.topProductos 
    : calcularTopProductos(historialUnidades);

  const inventarioValorizado = data.inventarioValorizado || [];
  const alertas = data.alertas || [];

  // Preparar datos para gráficos
  const ventasData = ventasPeriodo.map(v => ({
    fecha: v.fecha ? new Date(v.fecha).toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: 'short' 
    }) : 'Sin fecha',
    peso: (parseFloat(v.totalPeso || v.peso || 0) / 1000).toFixed(2),
    cortes: parseInt(v.cantidadCortes || v.cortes || 0)
  }));

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
  
  const valorTotal = inventarioValorizado.reduce((sum, inv) => 
    sum + (parseFloat(inv.valorTotal || 0)), 0 
  );
  
  const totalCortes = ventasPeriodo.reduce((sum, v) => 
    sum + (parseInt(v.cantidadCortes || v.cortes || 0)), 0
  );

  // Función auxiliar para calcular ventas desde historial
  function calcularVentasDesdeHistorial(historial: any[], periodo: string) {
    const ahora = new Date();
    const inicioPeriodo = new Date();
    
    if (periodo === 'hoy') {
      inicioPeriodo.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      inicioPeriodo.setDate(ahora.getDate() - 7);
    } else if (periodo === 'mes') {
      inicioPeriodo.setDate(ahora.getDate() - 30);
    }

    const unidadesFiltradas = historial.filter(u => {
      if (u.activa) return false;
      const fecha = new Date(u.updatedAt || u.fechaEgreso);
      return fecha >= inicioPeriodo;
    });

    // Agrupar por día
    const porDia: { [key: string]: { fecha: string, totalPeso: number, cantidadCortes: number } } = {};
    
    unidadesFiltradas.forEach(u => {
      const fecha = new Date(u.updatedAt || u.fechaEgreso).toLocaleDateString('es-AR');
      if (!porDia[fecha]) {
        porDia[fecha] = { fecha, totalPeso: 0, cantidadCortes: 0 };
      }
      porDia[fecha].totalPeso += parseFloat(u.pesoInicial || 0);
      porDia[fecha].cantidadCortes += 1;
    });

    return Object.values(porDia);
  }

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
        promedioCorte: p.totalVendido / p.cantidadCortes
      }))
      .sort((a: any, b: any) => b.totalVendido - a.totalVendido);
  }

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

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="alertas-section">
          <h3>⚠️ Alertas Activas ({alertas.length})</h3>
          <div className="alertas-grid">
            {alertas.slice(0, 3).map((alerta, idx) => (
              <div 
                key={idx} 
                className={`alerta-card ${alerta.prioridad || 'baja'}`}
              >
                <div className="alerta-header">
                  <span className="alerta-tipo">{alerta.tipo || 'Info'}</span>
                  <span className="alerta-prioridad">{alerta.prioridad || 'baja'}</span>
                </div>
                <p>{alerta.mensaje}</p>
                {alerta.detalles && (
                  <div className="alerta-detalles">
                    {Object.entries(alerta.detalles).map(([key, value]) => (
                      <span key={key}>
                        {key}: <strong>{String(value)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <div className="kpi-value">${valorTotal.toFixed(2)}</div>
            <div className="kpi-label">Valor Inventario</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">✂️</div>
          <div className="kpi-content">
            <div className="kpi-value">{totalCortes}</div>
            <div className="kpi-label">Cortes ({periodo})</div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Ventas por día */}
        <div className="chart-card">
          <h3>Ventas en el Período</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="peso" 
                stroke="#f59e0b" 
                name="Peso (kg)"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="cortes" 
                stroke="#10b981" 
                name="Cortes"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="chart-card">
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
        <div className="chart-card">
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

        {/* Inventario valorizado */}
        <div className="chart-card">
          <h3>Valor del Inventario por Producto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventarioValorizado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="producto" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="valorTotal" fill="#10b981" name="Valor ($)" />
            </BarChart>
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

{/* Botones de exportación - COMENTADOS TEMPORALMENTE
<div className="export-buttons">
  <button 
    className="btn-export"
    onClick={() => window.open(
      `${process.env.REACT_APP_API_URL}/api/export/inventario/excel`,
      '_blank'
    )}
  >
    📊 Exportar Inventario (Excel)
  </button>
  <button 
    className="btn-export"
    onClick={() => window.open(
      `${process.env.REACT_APP_API_URL}/api/export/inventario/pdf`,
      '_blank'
    )}
  >
    📄 Exportar Inventario (PDF)
  </button>
</div>
*/}
    </div>
  );
};