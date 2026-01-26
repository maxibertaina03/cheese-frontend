// src/components/Stats/HistorialStats.tsx
import React from 'react';

interface HistorialStatsProps {
  stats: {
    total: number;
    activos: number;
    agotados: number;
    pesoTotal: number;
    pesoVendido: number;
  };
}

export const HistorialStats: React.FC<HistorialStatsProps> = ({ stats }) => (
  <div className="historial-stats">
    <div className="stat-card">
      <div className="stat-card-value">{stats.total}</div>
      <div className="stat-card-label">Total Unidades</div>
    </div>
    {/* ... resto de cards */}
  </div>
);