// src/components/Elementos/ElementosView.tsx
import React, { useMemo, useState } from 'react';
import { Elemento, MovimientoElemento, Motivo, User } from '../../types';
import { ElementoForm } from './ElementoForm';
import { ElementoList } from './ElementoList';
import { MovimientoModal } from './MovimientoModal';
import { MovimientosModal } from './MovimientosModal';
import { usePermissions } from '../../utils/permissions';
import { exportElementosPdfLocal } from '../../utils/pdfExport';

interface ElementosViewProps {
  user: User | null;
  elementos: Elemento[];
  motivos: Motivo[];
  loading?: boolean;
  onCreateElemento: (data: { nombre: string; cantidadTotal: number; descripcion?: string | null }) => Promise<{ success: boolean }>;
  onUpdateElemento: (id: number, data: { nombre: string; descripcion?: string | null }) => Promise<{ success: boolean }>;
  onDeleteElemento: (elementoId: number) => Promise<{ success: boolean }>;
  onRegistrarIngreso: (elementoId: number, data: { cantidad: number; observaciones?: string | null }) => Promise<{ success: boolean }>;
  onRegistrarEgreso: (
    elementoId: number,
    data: { cantidad: number; motivoId?: number | null; observaciones?: string | null }
  ) => Promise<{ success: boolean }>;
  onFetchMovimientos: (elementoId: number) => Promise<MovimientoElemento[]>;
  onVolver?: () => void;
}

export const ElementosView: React.FC<ElementosViewProps> = ({
  user,
  elementos,
  motivos,
  loading,
  onCreateElemento,
  onUpdateElemento,
  onDeleteElemento,
  onRegistrarIngreso,
  onRegistrarEgreso,
  onFetchMovimientos,
  onVolver,
}) => {
  const { canEdit: isAdmin } = usePermissions(user, 'elementos');
  const [filtro, setFiltro] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [vistaMode, setVistaMode] = useState<'lista' | 'grid'>('lista');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [elementoEditando, setElementoEditando] = useState<Elemento | null>(null);
  const [movimientoTipo, setMovimientoTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [elementoMovimiento, setElementoMovimiento] = useState<Elemento | null>(null);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showMovimientosModal, setShowMovimientosModal] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoElemento[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // 🔧 FIX: Validar que elementos sea un array
  const elementosValidos = useMemo(() => {
    return Array.isArray(elementos) ? elementos : [];
  }, [elementos]);

  const elementosFiltrados = useMemo(() => {
    const search = filtro.toLowerCase();
    return elementosValidos.filter((elemento) => {
      if (soloActivos && !elemento.activo) return false;
      if (!search) return true;
      const matchNombre = elemento.nombre.toLowerCase().includes(search);
      const matchId = elemento.id.toString().includes(search);
      const matchDesc = elemento.descripcion?.toLowerCase().includes(search);
      return matchNombre || matchId || !!matchDesc;
    });
  }, [elementosValidos, filtro, soloActivos]);

  const stats = useMemo(() => {
    const totalDisponible = elementosValidos.reduce((sum, e) => sum + Number(e.cantidadDisponible || 0), 0);
    const totalHistorico = elementosValidos.reduce((sum, e) => sum + Number(e.cantidadTotal || 0), 0);
    const activos = elementosValidos.filter((e) => e.activo).length;
    const bajos = elementosValidos.filter((e) => e.cantidadDisponible <= 5).length;
    return { totalDisponible, totalHistorico, activos, bajos };
  }, [elementosValidos]);

  const handleOpenMovimientos = async (elemento: Elemento) => {
    setElementoMovimiento(elemento);
    setShowMovimientosModal(true);
    setLoadingMovimientos(true);
    const data = await onFetchMovimientos(elemento.id);
    setMovimientos(data);
    setLoadingMovimientos(false);
  };

  const handleOpenMovimiento = (tipo: 'ingreso' | 'egreso', elemento: Elemento) => {
    setMovimientoTipo(tipo);
    setElementoMovimiento(elemento);
    setShowMovimientoModal(true);
  };

  const handleSubmitMovimiento = async (data: {
    cantidad: number;
    motivoId?: number | null;
    observaciones?: string | null;
  }) => {
    if (!elementoMovimiento) return;
    const result =
      movimientoTipo === 'ingreso'
        ? await onRegistrarIngreso(elementoMovimiento.id, data)
        : await onRegistrarEgreso(elementoMovimiento.id, data);
    if (result.success) {
      setShowMovimientoModal(false);
      setElementoMovimiento(null);
    }
  };

  const handleDelete = async (elemento: Elemento) => {
    const confirmacion = window.confirm(`¿Eliminar el elemento "${elemento.nombre}"?`);
    if (!confirmacion) return;
    await onDeleteElemento(elemento.id);
  };

  const handleCreate = async (data: { nombre: string; cantidadTotal: number; descripcion?: string | null }) => {
    const result = await onCreateElemento(data);
    if (result.success) setShowForm(false);
  };

  const handleUpdate = async (data: { nombre: string; descripcion?: string | null }) => {
    if (!elementoEditando) return;
    const result = await onUpdateElemento(elementoEditando.id, data);
    if (result.success) setElementoEditando(null);
  };

  const handleExportPdf = () => {
    setExportingPdf(true);
    try {
      const filename = `elementos_${new Date().toISOString().slice(0, 10)}.pdf`;
      exportElementosPdfLocal(elementosFiltrados, filename);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="elementos-page">
      <div className="card elementos-panel">
        <div className="elementos-header">
          <div>
            <h2>Elementos</h2>
            <p className="page-subtitle">Controla ingresos, egresos y disponibilidad</p>
          </div>
          <div className="elementos-actions">
            {!isAdmin && <span className="badge-readonly">🔒 Solo lectura</span>}
            {onVolver && (
              <button className="btn-back" onClick={onVolver}>
                Volver a Quesos
              </button>
            )}
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Nuevo Elemento
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
            <div className="stat-card-value">{stats.totalHistorico}</div>
            <div className="stat-card-label">Total Histórico</div>
          </div>
          <div className="stat-card stat-card-warning">
            <div className="stat-card-value">{stats.activos}</div>
            <div className="stat-card-label">Activos</div>
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
                  placeholder="Nombre, ID o Descripción"
                />
                {filtro && (
                  <button className="clear-search-btn" onClick={() => setFiltro('')}>
                    ✖
                  </button>
                )}
              </div>
            </div>
            <div className="filter-item">
              <label className="filter-label">Estado</label>
              <button
                className={`quick-filter-btn ${soloActivos ? 'active' : ''}`}
                onClick={() => setSoloActivos(!soloActivos)}
              >
                <span className="quick-filter-text">{soloActivos ? 'Solo activos' : 'Todos'}</span>
                <span className="quick-filter-count">{soloActivos ? 'ON' : 'OFF'}</span>
              </button>
            </div>
            <div className="filter-item">
              <label className="filter-label">Resultados</label>
              <div className="form-hint">{elementosFiltrados.length} elementos</div>
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
          <button className="btn-export" onClick={handleExportPdf} disabled={exportingPdf || elementosFiltrados.length === 0}>
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

        <ElementoList
          elementos={elementosFiltrados}
          user={user}
          vistaMode={vistaMode}
          onIngreso={(elemento) => handleOpenMovimiento('ingreso', elemento)}
          onEgreso={(elemento) => handleOpenMovimiento('egreso', elemento)}
          onEdit={(elemento) => setElementoEditando(elemento)}
          onDelete={handleDelete}
          onVerMovimientos={handleOpenMovimientos}
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Elemento</h3>
              <button className="btn-close" onClick={() => setShowForm(false)}>
                ✖
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <ElementoForm
                mode="create"
                loading={loading}
                onSubmit={handleCreate}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {elementoEditando && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Editar Elemento</h3>
              <button className="btn-close" onClick={() => setElementoEditando(null)}>
                ✖
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <ElementoForm
                mode="edit"
                loading={loading}
                initialValues={{
                  nombre: elementoEditando.nombre,
                  descripcion: elementoEditando.descripcion || '',
                }}
                onSubmit={handleUpdate}
                onClose={() => setElementoEditando(null)}
              />
            </div>
          </div>
        </div>
      )}

      <MovimientoModal
        isOpen={showMovimientoModal}
        tipo={movimientoTipo}
        elemento={elementoMovimiento}
        motivos={motivos}
        loading={loading}
        onClose={() => setShowMovimientoModal(false)}
        onSubmit={handleSubmitMovimiento}
      />

      <MovimientosModal
        isOpen={showMovimientosModal}
        elemento={elementoMovimiento}
        movimientos={movimientos}
        loading={loadingMovimientos}
        onClose={() => setShowMovimientosModal(false)}
      />
    </div>
  );
};