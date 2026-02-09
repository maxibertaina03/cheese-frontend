// src/components/Inventory/InventoryForm.tsx
import React, { useState } from 'react';  // ← Remover useEffect
import { Producto, Motivo } from '../../types';
import { decodificarBarcode } from '../../utils/barcode';

interface InventoryFormProps {
  productos: Producto[];
  motivos: Motivo[];
  loading: boolean;
  onSubmit: (data: {
    productoId: number;
    pesoInicial: number;
    observacionesIngreso: string | null;
    motivoId: number | null;
  }) => Promise<{ success: boolean }>;
  onClose: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  productos,
  motivos,
  loading,
  onSubmit,
  onClose,
}) => {
  const [codigoBarras, setCodigoBarras] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [observacionesIngreso, setObservacionesIngreso] = useState('');
  const [motivoIngresoId, setMotivoIngresoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pesoDetectado, setPesoDetectado] = useState(0);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCodigoBarras(value);
    setError('');
    setProductoSeleccionado(null);
    setPesoDetectado(0);

    if (value.length === 13) {
      const { result, error: decodeError } = decodificarBarcode(value, productos);
      if (decodeError) {
        setError(decodeError);
      } else if (result) {
        setProductoSeleccionado(result.producto);
        setPesoDetectado(result.peso);
      }
    }
  };

  const handleSubmit = async () => {
    if (!motivoIngresoId) {
      setError('Debe seleccionar un motivo de ingreso');
      return;
    }

    if (!codigoBarras || codigoBarras.length !== 13) {
      setError('Ingrese un código de barras válido de 13 dígitos');
      return;
    }

    const { result, error: decodeError } = decodificarBarcode(codigoBarras, productos);
    if (decodeError || !result) {
      setError(decodeError || 'Error al decodificar código de barras');
      return;
    }

    const { success } = await onSubmit({
      productoId: result.producto.id,
      pesoInicial: result.peso,
      observacionesIngreso: observacionesIngreso || null,
      motivoId: motivoIngresoId,
    });

    if (success) {
      setCodigoBarras('');
      setProductoSeleccionado(null);
      setObservacionesIngreso('');
      setMotivoIngresoId(null);
      setPesoDetectado(0);
      onClose();
    }
  };

  return (
    <div className="card form-section">
      <h2>Registrar Nueva Unidad</h2>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div>{error}</div>
          </div>
        </div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Código de Barras</label>
          <input
            type="text"
            className="form-input barcode-input"
            value={codigoBarras}
            onChange={handleBarcodeChange}
            placeholder="0000000000000"
            maxLength={13}
            autoFocus
          />
          <div className="form-hint">
            Formato: 00 + PLU (5 dígitos) + Peso (5 dígitos) + 1 dígito
          </div>
        </div>

        {productoSeleccionado && (
          <>
            <div className="form-group">
              <label className="form-label">Producto Detectado</label>
              <input
                type="text"
                className="form-input"
                value={productoSeleccionado.nombre}
                disabled
              />
              <div className="form-hint">
                Peso: {pesoDetectado}g
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones de Ingreso (opcional)</label>
              <textarea
                className="form-input"
                value={observacionesIngreso}
                onChange={(e) => setObservacionesIngreso(e.target.value)}
                placeholder="Ej: Lote #123, Vencimiento: 15/03, etc."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo de Ingreso *</label>
              <select
                className="form-select"
                value={motivoIngresoId || ''}
                onChange={(e) => setMotivoIngresoId(Number(e.target.value))}
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
          </>
        )}
      </div>

      <button
        className="btn-submit"
        onClick={handleSubmit}
        disabled={loading || !productoSeleccionado}
      >
        {loading ? 'Procesando...' : 'Registrar Unidad'}
      </button>
    </div>
  );
};