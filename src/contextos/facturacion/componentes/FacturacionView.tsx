// src/contextos/facturacion/componentes/FacturacionView.tsx
import React, { useState } from 'react';
import {
  Cliente,
  Elemento,
  Empresa,
  NotaPedido,
  NotaCredito,
  NotaParaDevolver,
  Producto,
  Proveedor,
  Recibo,
  StockComercialItem,
  MovimientoStockComercial,
  CargaStockComercial,
  CreateNotaPedidoData,
  CreateNotaCreditoData,
  CreateReciboData,
} from '../../../types';
import { ClientesManager } from './ClientesManager';
import { EmpresaForm } from './EmpresaForm';
import { PreciosManager } from './PreciosManager';
import { NotasPedidoManager } from './NotasPedidoManager';
import { StockComercialManager } from './StockComercialManager';
import { MovimientosStockManager } from './MovimientosStockManager';
import { RecibosManager } from './RecibosManager';
import { NotasCreditoManager } from './NotasCreditoManager';
import { ReporteFacturacion } from './ReporteFacturacion';

interface Props {
  // Clientes
  clientes: Cliente[];
  loadingClientes: boolean;
  errorClientes: string;
  successClientes: string;
  onClearErrorClientes?: () => void;
  onCreateCliente: (data: Partial<Cliente>) => Promise<{ success: boolean }>;
  onUpdateCliente: (id: number, data: Partial<Cliente>) => Promise<{ success: boolean }>;
  onDeleteCliente: (id: number) => Promise<{ success: boolean }>;

  // Empresa
  empresa: Empresa | null;
  loadingEmpresa: boolean;
  errorEmpresa: string;
  successEmpresa: string;
  onSaveEmpresa: (data: Partial<Empresa>) => Promise<{ success: boolean }>;

  // Precios
  productos: Producto[];
  elementos: Elemento[];
  loadingPrecios: boolean;
  errorPrecios: string;
  successPrecios: string;
  onSaveProductoPrecio: (id: number, precioUnitario: number | null) => Promise<{ success: boolean }>;
  onSaveElemento: (
    id: number,
    data: { precioUnitario: number; esVendible: boolean }
  ) => Promise<{ success: boolean }>;

  // Notas de pedido
  notas: NotaPedido[];
  loadingNotas: boolean;
  errorNotas: string;
  successNotas: string;
  onCrearNota: (data: CreateNotaPedidoData) => Promise<{ success: boolean }>;
  onImprimirNota: (id: number) => void;

  // Stock comercial
  stockComercial: StockComercialItem[];
  movimientosStock: MovimientoStockComercial[];
  proveedores: Proveedor[];
  loadingStock: boolean;
  errorStock: string;
  successStock: string;
  onIngresarStock: (productoId: number, data: CargaStockComercial) => Promise<{ success: boolean }>;
  onEliminarMovimientoStock: (id: number) => Promise<{ success: boolean }>;

  // Recibos
  recibos: Recibo[];
  loadingRecibos: boolean;
  errorRecibos: string;
  successRecibos: string;
  onCrearRecibo: (data: CreateReciboData) => Promise<{ success: boolean }>;
  onImprimirRecibo: (id: number) => void;

  // Notas de crédito
  notasCredito: NotaCredito[];
  loadingNotasCredito: boolean;
  errorNotasCredito: string;
  successNotasCredito: string;
  onFetchNotaParaDevolver: (notaPedidoId: number) => Promise<NotaParaDevolver | null>;
  onCrearNotaCredito: (data: CreateNotaCreditoData) => Promise<{ success: boolean }>;
  onImprimirNotaCredito: (id: number) => void;

  // Reporte
  apiFetch: any;
  onDownloadReportePdf: (desde: string, hasta: string) => void;
  downloadingReporte: boolean;
  esAdmin: boolean;
}

type Tab = 'resumen' | 'notas' | 'recibos' | 'creditos' | 'stock' | 'compras' | 'clientes' | 'precios' | 'empresa';

export const FacturacionView: React.FC<Props> = (props) => {
  const [tab, setTab] = useState<Tab>('notas');

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Facturación</h2>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>
          Base del módulo: clientes, datos de la empresa y precios de venta.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          className={`filter-btn ${tab === 'resumen' ? 'active' : ''}`}
          onClick={() => setTab('resumen')}
        >
          📊 Resumen
        </button>
        <button
          className={`filter-btn ${tab === 'notas' ? 'active' : ''}`}
          onClick={() => setTab('notas')}
        >
          🧾 Notas de pedido
        </button>
        <button
          className={`filter-btn ${tab === 'recibos' ? 'active' : ''}`}
          onClick={() => setTab('recibos')}
        >
          💵 Recibos
        </button>
        <button
          className={`filter-btn ${tab === 'creditos' ? 'active' : ''}`}
          onClick={() => setTab('creditos')}
        >
          ↩️ Notas de crédito
        </button>
        <button
          className={`filter-btn ${tab === 'stock' ? 'active' : ''}`}
          onClick={() => setTab('stock')}
        >
          📦 Stock
        </button>
        <button
          className={`filter-btn ${tab === 'compras' ? 'active' : ''}`}
          onClick={() => setTab('compras')}
        >
          🛒 Compras
        </button>
        <button
          className={`filter-btn ${tab === 'clientes' ? 'active' : ''}`}
          onClick={() => setTab('clientes')}
        >
          👤 Clientes
        </button>
        <button
          className={`filter-btn ${tab === 'precios' ? 'active' : ''}`}
          onClick={() => setTab('precios')}
        >
          💲 Precios
        </button>
        <button
          className={`filter-btn ${tab === 'empresa' ? 'active' : ''}`}
          onClick={() => setTab('empresa')}
        >
          🏢 Mi empresa
        </button>
      </div>

      {tab === 'resumen' ? (
        <ReporteFacturacion
          apiFetch={props.apiFetch}
          onDownloadPdf={props.onDownloadReportePdf}
          downloading={props.downloadingReporte}
          esAdmin={props.esAdmin}
        />
      ) : tab === 'notas' ? (
        <NotasPedidoManager
          notas={props.notas}
          clientes={props.clientes}
          stockComercial={props.stockComercial}
          elementos={props.elementos}
          loading={props.loadingNotas}
          error={props.errorNotas}
          success={props.successNotas}
          onCrearNota={props.onCrearNota}
          onImprimir={props.onImprimirNota}
        />
      ) : tab === 'recibos' ? (
        <RecibosManager
          recibos={props.recibos}
          clientes={props.clientes}
          notas={props.notas}
          loading={props.loadingRecibos}
          error={props.errorRecibos}
          success={props.successRecibos}
          onCrearRecibo={props.onCrearRecibo}
          onImprimir={props.onImprimirRecibo}
        />
      ) : tab === 'creditos' ? (
        <NotasCreditoManager
          notasCredito={props.notasCredito}
          notas={props.notas}
          loading={props.loadingNotasCredito}
          error={props.errorNotasCredito}
          success={props.successNotasCredito}
          onFetchNota={props.onFetchNotaParaDevolver}
          onCrear={props.onCrearNotaCredito}
          onImprimir={props.onImprimirNotaCredito}
        />
      ) : tab === 'stock' ? (
        <StockComercialManager
          stock={props.stockComercial}
          proveedores={props.proveedores}
          loading={props.loadingStock}
          error={props.errorStock}
          success={props.successStock}
          onIngresar={props.onIngresarStock}
        />
      ) : tab === 'compras' ? (
        <MovimientosStockManager
          movimientos={props.movimientosStock}
          loading={props.loadingStock}
          error={props.errorStock}
          success={props.successStock}
          onEliminar={props.onEliminarMovimientoStock}
        />
      ) : tab === 'clientes' ? (
        <ClientesManager
          clientes={props.clientes}
          loading={props.loadingClientes}
          error={props.errorClientes}
          success={props.successClientes}
          onClearError={props.onClearErrorClientes}
          onCreate={props.onCreateCliente}
          onUpdate={props.onUpdateCliente}
          onDelete={props.onDeleteCliente}
        />
      ) : tab === 'precios' ? (
        <PreciosManager
          productos={props.productos}
          elementos={props.elementos}
          loading={props.loadingPrecios}
          error={props.errorPrecios}
          success={props.successPrecios}
          onSaveProductoPrecio={props.onSaveProductoPrecio}
          onSaveElemento={props.onSaveElemento}
        />
      ) : (
        <EmpresaForm
          empresa={props.empresa}
          loading={props.loadingEmpresa}
          error={props.errorEmpresa}
          success={props.successEmpresa}
          onSave={props.onSaveEmpresa}
        />
      )}
    </div>
  );
};
