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
}

export interface Particion {
  id: number;
  peso: number;
  createdAt: string;
  observacionesCorte: string | null;
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