// src/components/Admin/DeleteConfirmModal.tsx
import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: '#dc2626' }}>{title}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: '#374151', marginBottom: '0.5rem' }}>{message}</p>
          {itemName && (
            <p style={{ 
              fontWeight: 'bold', 
              color: '#dc2626',
              padding: '0.75rem',
              background: '#fef2f2',
              borderRadius: '8px',
              borderLeft: '4px solid #dc2626'
            }}>
              {itemName}
            </p>
          )}
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
            ⚠️ Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={loading}
            style={{ 
              background: '#dc2626',
              color: 'white'
            }}
          >
            {loading ? 'Eliminando...' : 'Eliminar Permanentemente'}
          </button>
        </div>
      </div>
    </div>
  );
};