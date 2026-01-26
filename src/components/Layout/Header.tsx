// src/components/Layout/Header.tsx
import React from 'react';

interface HeaderProps {
  unidadesActivas: number;
  totalProductos: number;
  onNewIngreso: () => void;
  onOpenHistorial: () => void;
  showForm: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unidadesActivas,
  totalProductos,
  onNewIngreso,
  onOpenHistorial,
  showForm,
}) => {
  return (
    <div className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" y1="22" x2="12" y2="12" />
            </svg>
          </div>
          <div className="header-title">
            <h1>Stock de Quesos</h1>
            <p>Las Tres Estrellas</p>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <div className="stat-value">{unidadesActivas}</div>
            <div className="stat-label">Activas</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-value">{totalProductos}</div>
            <div className="stat-label">Productos</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={onOpenHistorial}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v5h5M3 8a9 9 0 1 0 18 0A9 9 0 0 0 3 8z" />
            </svg>
            Historial
          </button>
          <button className="btn-primary" onClick={onNewIngreso}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {showForm ? 'Cerrar' : 'Nuevo Ingreso'}
          </button>
        </div>
      </div>
    </div>
  );
};