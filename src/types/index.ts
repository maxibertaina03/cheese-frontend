// src/types/index.ts
export interface TipoQueso {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  plu: string;
  seVendePorUnidad: boolean;
  tipoQueso: TipoQueso;
  precioPorKilo?: number | null;
  precioUnitario?: number | null;   // ← Precio de venta por unidad (facturación)
  activo?: boolean;          // ← Para soft delete
}

export interface Particion {
  id: number;
  peso: number;
  createdAt: string;
  observacionesCorte: string | null;
  motivo?: Motivo;
}

export interface Motivo {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Unidad {
  id: number;
  producto: Producto;
  pesoInicial: number;
  pesoActual: number;
  activa: boolean;
  particiones: Particion[];
  createdAt: string;
  deletedAt?: string | null;
  observacionesIngreso: string | null;
  fechaElaboracion?: string | null;   // ← Identificación del queso (facturación)
  numeroLote?: string | null;
  fechaVenta?: string | null;          // ← Vendido en una nota de pedido
  motivo: Motivo;
}

// Secciones del sistema sobre las que se pueden otorgar permisos a un usuario.
export type Modulo = 'quesos' | 'elementos' | 'indumentaria' | 'dashboard' | 'historial' | 'facturacion';

export interface User {
  token: string;
  rol: 'admin' | 'usuario';
  // Secciones a las que el usuario tiene acceso (solo aplica a rol 'usuario').
  // Los admin tienen acceso a todo.
  permisos?: Modulo[];
}

export type FiltroHistorial = 'todos' | 'activos' | 'agotados';

// Stock reconstruido a una fecha de corte (ej: lunes más reciente), por producto
export interface StockLunesProducto {
  productoId: number;
  producto: string;
  plu: string;
  tipoQueso: string | null;
  cantidadFisico: number;    // hormas físicas (pistola)
  cantidadComercial: number; // stock de venta (facturación)
}

// Movimiento (corte o baja) ocurrido desde la fecha de corte hasta ahora
export interface MovimientoDesdeLunes {
  tipo: 'corte' | 'baja';
  unidadId: number;
  producto: string;
  tipoQueso: string | null;
  peso: number | null;
  motivo: string | null;
  fecha: string;
  agotoUnidad: boolean;
}

export interface StockAlCorteResponse {
  fechaCorte: string;
  totalFisico: number;
  totalComercial: number;
  productos: StockLunesProducto[];
  movimientos: MovimientoDesdeLunes[];
}

// ← NUEVO: Tipo para crear producto
export interface CreateProductoData {
  nombre: string;
  plu: string;
  seVendePorUnidad: boolean;
  tipoQuesoId: number;
  precioPorKilo?: number | null;
  precioUnitario?: number | null;
}

export interface UsuarioMini {
  id: number;
  email?: string;
}

export interface Elemento {
  id: number;
  nombre: string;
  descripcion: string | null;
  cantidadDisponible: number;
  cantidadTotal: number;
  activo: boolean;
  precioUnitario?: number;          // ← Facturación
  esVendible?: boolean;
  creadoPor?: User | null;
  modificadoPor?: User | null;
  createdAt: string;
  updatedAt: string;
}

// ← Facturación: cliente reutilizable
export interface Cliente {
  id: number;
  nombre: string;
  tipoDocumento: 'DNI' | 'CUIT';
  numeroDocumento: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  localidad: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ← Facturación: datos del emisor (la propia empresa)
export interface Empresa {
  id?: number;
  razonSocial: string;
  cuit: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  localidad: string | null;
  provincia: string | null;
  telefono: string | null;
  email: string | null;
  condicionIva: string | null;
}

// ← Facturación: nota de pedido (venta)
export type EstadoNotaPedido = 'confirmada' | 'pagada_parcial' | 'pagada_total' | 'anulada';

export interface NotaPedidoItem {
  id: number;
  tipoItem: 'queso' | 'elemento';
  descripcion: string;
  plu: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Stock comercial (facturación) por producto
export interface StockComercialItem {
  productoId: number;
  producto: string;
  plu: string;
  tipoQueso: string | null;
  precioUnitario: number | null;
  cantidadDisponible: number;
}

// Movimiento del stock de facturación (carga/compra, venta o ajuste)
export interface MovimientoStockComercial {
  id: number;
  productoId: number;
  producto: string | null;
  plu: string | null;
  tipoQueso: string | null;
  tipo: 'ingreso' | 'egreso' | 'ajuste';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia: string | null;
  observaciones: string | null;
  fechaComprobante: string | null;
  comprobantePrefijo: string | null;
  comprobanteNumero: string | null;
  precioCompra: number | null;
  proveedorId: number | null;
  proveedor: string | null;
  usuario: { id: number; username: string } | null;
  createdAt: string;
}

// Datos de la carga (compra) de stock comercial
export interface CargaStockComercial {
  cantidad: number;
  observaciones?: string | null;
  fechaComprobante?: string | null;
  comprobantePrefijo?: string | null;
  comprobanteNumero?: string | null;
  precioCompra?: number | null;
  proveedorId?: number | null;
}

export interface NotaPedido {
  id: number;
  serie: string;
  numero: number;
  fecha: string;
  cliente: Cliente | null;
  total: number;
  saldoPendiente: number;
  estado: EstadoNotaPedido;
  observaciones: string | null;
  items?: NotaPedidoItem[];
}

// Payload para crear una nota de pedido
export interface CreateNotaPedidoItem {
  tipoItem: 'queso' | 'elemento';
  productoId?: number;
  elementoId?: number;
  cantidad: number;
}

export interface CreateNotaPedidoData {
  clienteId: number;
  observaciones?: string | null;
  fecha?: string | null;
  items: CreateNotaPedidoItem[];
}

// ← Facturación: recibo (cobro)
export type MedioPago = 'efectivo' | 'transferencia';

export interface ReciboAplicacion {
  id: number;
  notaPedidoId: number;
  numeroNota: string | null;
  monto: number;
}

export interface ReciboPago {
  id: number;
  medio: MedioPago;
  monto: number;
}

export interface Recibo {
  id: number;
  serie: string;
  numero: number;
  fecha: string;
  cliente: Cliente | null;
  montoTotal: number;
  medioPago: MedioPago | 'mixto';
  observaciones: string | null;
  aplicaciones?: ReciboAplicacion[];
  pagos?: ReciboPago[];
}

export interface CreateReciboData {
  clienteId: number;
  observaciones?: string | null;
  aplicaciones: { notaPedidoId: number; monto: number }[];
  pagos: { medio: MedioPago; monto: number }[];
}

// ← Facturación: nota de crédito (devolución)
export interface NotaCreditoItem {
  id: number;
  tipoItem: 'queso' | 'elemento';
  descripcion: string;
  plu: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface NotaCredito {
  id: number;
  serie: string;
  numero: number;
  fecha: string;
  notaPedido: NotaPedido | null;
  cliente: Cliente | null;
  montoTotal: number;
  motivo: string | null;
  items?: NotaCreditoItem[];
}

// Nota de pedido "para devolver": ítems con lo disponible a devolver
export interface ItemParaDevolver {
  notaPedidoItemId: number;
  tipoItem: 'queso' | 'elemento';
  descripcion: string;
  plu: string | null;
  cantidad: number;
  cantidadDevuelta: number;
  disponible: number;
  precioUnitario: number;
}

export interface NotaParaDevolver {
  id: number;
  serie: string;
  numero: number;
  cliente: Cliente | null;
  estado: EstadoNotaPedido;
  total: number;
  items: ItemParaDevolver[];
}

export interface CreateNotaCreditoData {
  notaPedidoId: number;
  motivo?: string | null;
  items: { notaPedidoItemId: number; cantidad: number }[];
}

// ← Facturación: reporte de ventas
export interface ReporteFacturacion {
  periodo: { desde: string | null; hasta: string | null };
  resumen: {
    cantidadNotas: number;
    totalFacturado: number;
    cantidadRecibos: number;
    totalCobrado: number;
    cantidadNotasCredito: number;
    totalCreditado: number;
    saldoPendienteTotal: number;
  };
  ventasPorProducto: { descripcion: string; cantidad: number; monto: number }[];
  cuentaCorriente: { clienteId: number; cliente: string; facturado: number; cobrado: number; saldo: number }[];
}

export interface MovimientoElemento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: Motivo | null;
  observaciones: string | null;
  creadoPor?: User | null;
  createdAt: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  observaciones: string | null;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Indumentaria {
  id: number;
  nombre: string;
  categoria: string | null;
  talle: string | null;
  color: string | null;
  genero: string | null;
  ubicacion: string | null;
  cantidadDisponible: number;
  cantidadTotalIngresada: number;
  stockMinimo: number;
  proveedor: Proveedor | null;
  observaciones: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MovimientoIndumentaria {
  id: number;
  tipo: 'INGRESO' | 'EGRESO' | 'AJUSTE';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  destino: string | null;
  proveedor?: Proveedor | null;
  documentoReferencia: string | null;
  observaciones: string | null;
  fechaMovimiento: string;
  usuario?: UsuarioMini | null;
  createdAt: string;
}
