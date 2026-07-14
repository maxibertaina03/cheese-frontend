// src/contextos/indumentaria/componentes/IndumentariaView.tsx
import React, { useMemo, useState } from 'react';
import { Indumentaria, MovimientoIndumentaria, Proveedor, User } from '../../../types';
import { IndumentariaForm } from './IndumentariaForm';
import { IndumentariaList } from './IndumentariaList';
import { MovimientoModal } from './MovimientoModal';
import { MovimientosModal } from './MovimientosModal';
import { usePermissions } from '../../../utils/permissions';
import { exportIndumentariaPdfLocal } from '../../../utils/pdfExport';

interface Props {
  user: User | null;
  prendas: Indumentaria[];
  proveedores: Proveedor[];
  loading?: boolean;
  error?: string;
  onClearError?: () => void;
  onCreate: (data: any) => Promise<{ success: boolean }>;
  onUpdate: (id: number, data: any) => Promise<{ success: boolean }>;
  onDelete: (id: number) => Promise<{ success: boolean }>;
  onRegistrarIngreso: (
    id: number,
    data: { cantidad: number; proveedorId?: number | null; documentoReferencia?: string | null; observaciones?: string | null }
  ) => Promise<{ success: boolean }>;
  onRegistrarEgreso: (
    id: number,
    data: { cantidad: number; destino: string; observaciones?: string | null }
  ) => Promise<{ success: boolean }>;
  onFetchMovimientos: (id: number) => Promise<MovimientoIndumentaria[]>;
  onCreateProveedor?: (nombre: string) => Promise<Proveedor | null>;
  onVolver?: () => void;
}

const CATEGORIAS = [
  { value: 'todas', label: 'Todas' },
  { value: 'blanca', label: 'Blanca' },
  { value: 'azul', label: 'Azul' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'otra', label: 'Otra' },
];

export const IndumentariaView: React.FC<Props> = ({
  user,
  prendas,
  proveedores,
  loading,
  error,
  onClearError,
  onCreate,
  onUpdate,
  onDelete,
  onRegistrarIngreso,
  onRegistrarEgreso,
  onFetchMovimientos,
  onCreateProveedor,
  onVolver,
}) => {
  const { canEdit: isAdmin } = usePermissions(user, 'indumentaria');
  const [filtro, setFiltro] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [vistaMode, setVistaMode] = useState<'lista' | 'grid'>('lista');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Indumentaria | null>(null);
  const [movimientoTipo, setMovimientoTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [prendaMovimiento, setPrendaMovimiento] = useState<Indumentaria | null>(null);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showMovimientosModal, setShowMovimientosModal] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoIndumentaria[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  const prendasValidas = useMemo(() => (Array.isArray(prendas) ? prendas : []), [prendas]);

  const prendasFiltradas = useMemo(() => {
    const search = filtro.toLowerCase();
    return prendasValidas.filter((p) => {
      if (categoria !== 'todas' && p.categoria !== categoria) return false;
      if (!search) return true;
      return (
        p.nombre.toLowerCase().includes(search) ||
        p.id.toString().includes(search) ||
        (p.talle ? p.talle.toLowerCase().includes(search) : false) ||
        (p.color ? p.color.toLowerCase().includes(search) : false) ||
        (p.proveedor?.nombre.toLowerCase().includes(search) ?? false)
      );
    });
  }, [prendasValidas, filtro, categoria]);

  const stats = useMemo(() => {
    const totalDisponible = prendasValidas.reduce((s, p) => s + Number(p.cantidadDisponible || 0), 0);
    const totalPrendas = prendasValidas.length;
    const bajos = prendasValidas.filter(
      (p) => p.stockMinimo > 0 && p.cantidadDisponible <= p.stockMinimo
    ).length;
    return { totalDisponible, totalPrendas, bajos };
  }, [prendasValidas]);

  const opciones = useMemo(() => {
    const distinct = (valores: (string | null | undefined)[]) =>
      Array.from(
        new Set(valores.map((v) => (v ?? '').trim()).filter((v) => v.length > 0))
      );
    return {
      nombres: distinct(prendasValidas.map((p) => p.nombre)),
      talles: distinct(prendasValidas.map((p) => p.talle)),
      colores: distinct(prendasValidas.map((p) => p.color)),
      categorias: distinct(prendasValidas.map((p) => p.categoria)),
    };
  }, [prendasValidas]);

  const handleOpenMovimientos = async (prenda: Indumentaria) => {
    setPrendaMovimiento(prenda);
    setShowMovimientosModal(true);
    setLoadingMovimientos(true);
    const data = await onFetchMovimientos(prenda.id);
    setMovimientos(data);
    setLoadingMovimientos(false);
  };

  const handleOpenMovimiento = (tipo: 'ingreso' | 'egreso', prenda: Indumentaria) => {
    setMovimientoTipo(tipo);
    setPrendaMovimiento(prenda);
    setShowMovimientoModal(true);
  };

  const handleDelete = async (prenda: Indumentaria) => {
    if (!window.confirm(`¿Eliminar la prenda "${prenda.nombre}"?`)) return;
    await onDelete(prenda.id);
  };

  const handleCreate = async (data: any) => {
    const result = await onCreate(data);
    if (result.success) setShowForm(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editando) return;
    const result = await onUpdate(editando.id, data);
    if (result.success) setEditando(null);
  };

  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const filename = `indumentaria_${new Date().toISOString().slice(0, 10)}.pdf`;
      exportIndumentariaPdfLocal(prendasFiltradas, filename);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="elementos-page">
      <div className="card elementos-panel">
        <div className="elementos-header">
          <div>
            <h2>Indumentaria</h2>
            <p className="page-subtitle">Stock de ropa de trabajo, entregas y proveedores</p>
          </div>
          <div className="elementos-actions">
            {!isAdmin && <span className="badge-readonly">🔒 Solo lectura</span>}
            {onVolver && (
              <button className="btn-back" onClick={onVolver}>
                Volver a Quesos
              </button>
            )}
            {isAdmin && (
              <button
                className="btn-primary"
                onClick={() => {
                  onClearError?.();
                  setShowForm(true);
                }}
              >
                Nueva Prenda
              </button>
            )}
          </div>
        </div>

        <div className="historial-stats">
          <div className="stat-card stat-card-success">
            <div className="stat-card-value">{stats.totalDisponible}</div>
            <div className="stat-card-label">Disponible</div>
          </div>
          <div className="stat-card stat-card-primary">
            <div className="stat-card-value">{stats.totalPrendas}</div>
            <div className="stat-card-label">Prendas</div>
          </div>
          <div className="stat-card stat-card-inactive">
            <div className="stat-card-value">{stats.bajos}</div>
            <div className="stat-card-label">Bajo Stock</div>
          </div>
        </div>

        <div className="filters-panel">
          <div className="filters-header">
            <div className="filters-title">Filtros</div>
          </div>
          <div className="filters-grid">
            <div className="filter-item">
              <label className="filter-label">Buscar</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔎</span>
                <input
                  className="form-input search-input"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Nombre, talle, color o proveedor"
                />
                {filtro && (
                  <button className="clear-search-btn" onClick={() => setFiltro('')}>
                    ✖
                  </button>
                )}
              </div>
            </div>
            <div className="filter-item">
              <label className="filter-label">Categoría</label>
              <select
                className="form-select"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label className="filter-label">Resultados</label>
              <div className="form-hint">{prendasFiltradas.length} prendas</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <button className="btn-export" onClick={handleExportPdf} disabled={exportingPdf || prendasFiltradas.length === 0}>
            {exportingPdf ? 'Exportando PDF...' : 'Exportar PDF'}
          </button>

          <div className="view-toggle">
            <button
              className={`view-btn ${vistaMode === 'lista' ? 'active' : ''}`}
              onClick={() => setVistaMode('lista')}
              title="Vista lista"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Lista
            </button>
            <button
              className={`view-btn ${vistaMode === 'grid' ? 'active' : ''}`}
              onClick={() => setVistaMode('grid')}
              title="Vista grid"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Grid
            </button>
          </div>
        </div>

        <IndumentariaList
          prendas={prendasFiltradas}
          user={user}
          vistaMode={vistaMode}
          onIngreso={(p) => handleOpenMovimiento('ingreso', p)}
          onEgreso={(p) => handleOpenMovimiento('egreso', p)}
          onEdit={(p) => {
            onClearError?.();
            setEditando(p);
          }}
          onDelete={handleDelete}
          onVerMovimientos={handleOpenMovimientos}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Nueva Prenda</h3>
              <button
                className="btn-close"
                onClick={() => {
                  onClearError?.();
                  setShowForm(false);
                }}
              >
                ✖
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <IndumentariaForm
                mode="create"
                proveedores={proveedores}
                opciones={opciones}
                loading={loading}
                error={error}
                onSubmit={handleCreate}
                onClose={() => {
                  onClearError?.();
                  setShowForm(false);
                }}
                onCreateProveedor={onCreateProveedor}
              />
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Editar Prenda</h3>
              <button
                className="btn-close"
                onClick={() => {
                  onClearError?.();
                  setEditando(null);
                }}
              >
                ✖
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <IndumentariaForm
                mode="edit"
                initial={editando}
                proveedores={proveedores}
                opciones={opciones}
                loading={loading}
                error={error}
                onSubmit={handleUpdate}
                onClose={() => {
                  onClearError?.();
                  setEditando(null);
                }}
                onCreateProveedor={onCreateProveedor}
              />
            </div>
          </div>
        </div>
      )}

      <MovimientoModal
        isOpen={showMovimientoModal}
        tipo={movimientoTipo}
        prenda={prendaMovimiento}
        proveedores={proveedores}
        loading={loading}
        onClose={() => setShowMovimientoModal(false)}
        onSubmitIngreso={async (data) => {
          if (!prendaMovimiento) return;
          const result = await onRegistrarIngreso(prendaMovimiento.id, data);
          if (result.success) setShowMovimientoModal(false);
        }}
        onSubmitEgreso={async (data) => {
          if (!prendaMovimiento) return;
          const result = await onRegistrarEgreso(prendaMovimiento.id, data);
          if (result.success) setShowMovimientoModal(false);
        }}
        onCreateProveedor={onCreateProveedor}
      />

      <MovimientosModal
        isOpen={showMovimientosModal}
        prenda={prendaMovimiento}
        movimientos={movimientos}
        loading={loadingMovimientos}
        onClose={() => setShowMovimientosModal(false)}
      />
    </div>
  );
};
