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
  precio?: number;           // ← Nuevo campo opcional
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
  observacionesIngreso: string | null;
  motivo: Motivo;
}

export interface User {
  token: string;
  rol: 'admin' | 'usuario';
}

export type FiltroHistorial = 'todos' | 'activos' | 'agotados';

// ← NUEVO: Tipo para crear producto
export interface CreateProductoData {
  nombre: string;
  plu: string;
  seVendePorUnidad: boolean;
  tipoQuesoId: number;
  precio?: number;
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