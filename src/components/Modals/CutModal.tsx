// src/components/Modals/CutModal.tsx
import React, { useState } from 'react';
import { Unidad, Motivo } from '../../types';
import { decodificarBarcode } from '../../utils/barcode';

interface CutModalProps {
  unidad: Unidad | null;
  productos: any[];
  motivos: Motivo[];
  loading: boolean;
  onClose: () => void;
  onCut: (peso: number, observaciones: string, motivoId: number | null) => Promise<void>;
  onEgresoTotal: (motivoId: number | null) => Promise<void>;
}

export const CutModal: React.FC<CutModalProps> = ({
  unidad,
  productos,
  motivos,
  loading,
  onClose,
  onCut,
  onEgresoTotal,
}) => {
  const [codigoBarrasCorte, setCodigoBarrasCorte] = useState('');
  const [pesoCorte, setPesoCorte] = useState('');
  const [observacionesCorte, setObservacionesCorte] = useState('');
  const [motivoCorteId, setMotivoCorteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  if (!unidad) return null;

  const handleBarcodeCorteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodigoBarrasCorte(value);
    setError('');

    if (value.length === 13) {
      const { result, error: decodeError } = decodificarBarcode(value, productos);
      
      if (decodeError || !result) {
        setError('Código de barras inválido');
        setPesoCorte('');
        return;
      }

      const nuevoPeso = result.peso;
      const pesoActual = unidad.pesoActual;

      if (nuevoPeso > pesoActual) {
        setError('El peso escaneado es mayor al disponible');
        setPesoCorte('');
        return;
      }

      const corte = pesoActual - nuevoPeso;
      setPesoCorte(corte.toString());
    }
  };

  const handleCut = async () => {
    const peso = parseFloat(pesoCorte);
    
    if (isNaN(peso) || peso < 0) {
      setError('El peso debe ser 0 o mayor');
      return;
    }

    if (peso > unidad.pesoActual) {
      setError(`Peso insuficiente. Disponible: ${unidad.pesoActual}g`);
      return;
    }

    await onCut(peso, observacionesCorte || 'Corte sin observaciones', motivoCorteId);
    handleClose();
  };

  const handleEgresoTotal = async () => {
    await onEgresoTotal(motivoCorteId);
    handleClose();
  };

  const handleClose = () => {
    setCodigoBarrasCorte('');
    setPesoCorte('');
    setObservacionesCorte('');
    setMotivoCorteId(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Realizar Corte</h3>
          <button className="btn-close" onClick={handleClose}>✕</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <div>{error}</div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Producto</label>
          <input type="text" className="form-input" value={unidad.producto.nombre} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Peso Disponible</label>
          <input type="text" className="form-input" value={`${unidad.pesoActual}g`} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Escanear código de barras del queso después del corte</label>
          <input
            type="text"
            className="form-input barcode-input"
            value={codigoBarrasCorte}
            onChange={handleBarcodeCorteChange}
            placeholder="0000000000000"
            maxLength={13}
          />
          <div className="form-hint">
            Escaneá el código del queso que quedó. Se calculará automáticamente cuánto se cortó.
          </div>
        </div>

        {pesoCorte && (
          <div className="form-group">
            <label className="form-label">Peso a cortar (calculado)</label>
            <input type="text" className="form-input" value={`${pesoCorte}g`} disabled />
          </div>
        )}

        {unidad.pesoActual > 0 && (
          <div className="form-group">
            <button
              className="btn-action btn-cut"
              onClick={handleEgresoTotal}
              disabled={loading}
            >
              🧀 Egresar todo ({unidad.pesoActual}g)
            </button>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Observaciones del corte (opcional)</label>
          <textarea
            className="form-input"
            value={observacionesCorte}
            onChange={(e) => setObservacionesCorte(e.target.value)}
            placeholder="Ej: Cliente: Juan Pérez, Pedido especial, etc."
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Motivo del corte *</label>
          <select
            className="form-select"
            value={motivoCorteId || ''}
            onChange={(e) => setMotivoCorteId(Number(e.target.value))}
            required
          >
            <option value="">-- Seleccionar motivo --</option>
            {motivos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={handleClose}>
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={handleCut}
            disabled={loading || !pesoCorte}
          >
            {loading ? 'Procesando...' : 'Confirmar Corte'}
          </button>
        </div>
      </div>
    </div>
  );
};