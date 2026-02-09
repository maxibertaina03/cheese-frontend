// src/utils/barcode.ts
import { Producto } from '../types';

export interface BarcodeResult {
  producto: Producto;
  peso: number;
}

export const decodificarBarcode = (
  barcode: string,
  productos: Producto[]
): { result: BarcodeResult | null; error: string } => {
  if (barcode.length !== 13) {
    return { result: null, error: 'El código debe tener exactamente 13 dígitos' };
  }

  const plu = barcode.substring(2, 7);
  const pesoStr = barcode.substring(7, 12);
  const pesoGramos = parseInt(pesoStr, 10);

  if (isNaN(pesoGramos) || pesoGramos <= 0) {
    return { result: null, error: 'Peso inválido en código de barras' };
  }

  const producto = productos.find(p => p.plu === plu);
  if (!producto) {
    return { result: null, error: `No se encontró producto con PLU: ${plu}` };
  }

  return { result: { producto, peso: pesoGramos }, error: '' };
};