// src/components/Layout/Alerts.tsx
import React from 'react';

interface AlertsProps {
  error: string;
  success: string;
}

export const Alerts: React.FC<AlertsProps> = ({ error, success }) => {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="alert alert-error">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div className="alert-title">Valida</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <div className="alert-icon">✓</div>
          <div className="alert-content">
            <div className="alert-title">Éxito</div>
            <div>{success}</div>
          </div>
        </div>
      )}
    </>
  );
};