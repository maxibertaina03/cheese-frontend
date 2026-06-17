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
  motivo: Motivo;
}

// Secciones del sistema sobre las que se pueden otorgar permisos a un usuario.
export type Modulo = 'quesos' | 'elementos' | 'indumentaria' | 'dashboard' | 'historial';

export interface User {
  token: string;
  rol: 'admin' | 'usuario';
  // Secciones a las que el usuario tiene acceso (solo aplica a rol 'usuario').
  // Los admin tienen acceso a todo.
  permisos?: Modulo[];
}

export type FiltroHistorial = 'todos' | 'activos' | 'agotados';

// ← NUEVO: Tipo para crear producto
export interface CreateProductoData {
  nombre: string;
  plu: string;
  seVendePorUnidad: boolean;
  tipoQuesoId: number;
  precioPorKilo?: number | null;
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
  creadoPor?: User | null;
  modificadoPor?: User | null;
  createdAt: string;
  updatedAt: string;
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
