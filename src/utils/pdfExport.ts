import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Unidad } from '../types';

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const kg = (grams: unknown) => `${(toNumber(grams) / 1000).toFixed(2)} kg`;

const date = (value: string | undefined | null) => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('es-AR');
};

const savePdf = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

export const exportInventarioPdfLocal = (unidades: Unidad[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalPeso = unidades.reduce((sum, unidad) => sum + toNumber(unidad.pesoActual), 0);
  const totalEgreso = unidades.reduce(
    (sum, unidad) => sum + toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual),
    0
  );

  doc.setFontSize(16);
  doc.text('Inventario actual de quesos', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generado: ${date(new Date().toISOString())}`, 14, 23);
  doc.text(`Unidades: ${unidades.length}`, 14, 29);
  doc.text(`Peso actual total: ${kg(totalPeso)}`, 14, 35);
  doc.text(`Egreso acumulado: ${kg(totalEgreso)}`, 14, 41);

  autoTable(doc, {
    startY: 48,
    head: [['ID', 'Producto', 'PLU', 'Tipo', 'Inicial', 'Actual', 'Egreso', 'Motivo', 'Ingreso']],
    body: unidades.map((unidad) => [
      `#${unidad.id}`,
      unidad.producto?.nombre ?? '-',
      unidad.producto?.plu ?? '-',
      unidad.producto?.tipoQueso?.nombre ?? '-',
      kg(unidad.pesoInicial),
      kg(unidad.pesoActual),
      kg(toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual)),
      unidad.motivo?.nombre ?? '-',
      date(unidad.createdAt),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55] },
  });

  savePdf(doc, filename);
};

export const exportHistorialPdfLocal = (unidades: Unidad[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalPeso = unidades.reduce((sum, unidad) => sum + toNumber(unidad.pesoInicial), 0);
  const totalEgreso = unidades.reduce(
    (sum, unidad) => sum + toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual),
    0
  );
  const totalCortes = unidades.reduce((sum, unidad) => sum + (unidad.particiones?.length ?? 0), 0);

  doc.setFontSize(16);
  doc.text('Historial de quesos', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generado: ${date(new Date().toISOString())}`, 14, 23);
  doc.text(`Unidades: ${unidades.length}`, 14, 29);
  doc.text(`Peso inicial total: ${kg(totalPeso)}`, 14, 35);
  doc.text(`Egreso total: ${kg(totalEgreso)}`, 14, 41);
  doc.text(`Cortes: ${totalCortes}`, 14, 47);

  autoTable(doc, {
    startY: 54,
    head: [['ID', 'Producto', 'PLU', 'Tipo', 'Estado', 'Inicial', 'Actual', 'Egreso', 'Ingreso', 'Cortes']],
    body: unidades.map((unidad) => {
      const cortes = unidad.particiones?.length
        ? unidad.particiones
            .map((particion) => `${date(particion.createdAt)} ${kg(particion.peso)} ${particion.motivo?.nombre ?? ''}`)
            .join(' | ')
        : 'Sin cortes';

      return [
        `#${unidad.id}`,
        unidad.producto?.nombre ?? '-',
        unidad.producto?.plu ?? '-',
        unidad.producto?.tipoQueso?.nombre ?? '-',
        unidad.deletedAt ? 'Eliminada' : unidad.activa ? 'Activa' : 'Agotada',
        kg(unidad.pesoInicial),
        kg(unidad.pesoActual),
        kg(toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual)),
        date(unidad.createdAt),
        cortes,
      ];
    }),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55] },
    columnStyles: {
      9: { cellWidth: 70 },
    },
  });

  savePdf(doc, filename);
};
