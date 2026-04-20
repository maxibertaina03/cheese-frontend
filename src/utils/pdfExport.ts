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
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('Las Tres Estrellas - Sistema de stock', 14, 200);
    doc.text(`Pagina ${page} de ${pageCount}`, 270, 200, { align: 'right' });
  }

  doc.save(filename);
};

const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
  doc.setFillColor(17, 24, 39);
  doc.rect(10, 10, 277, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(209, 213, 219);
  doc.text(subtitle, 14, 24);
  doc.text(`Generado: ${date(new Date().toISOString())}`, 282, 21, { align: 'right' });
  doc.setTextColor(17, 24, 39);
};

const drawSummary = (doc: jsPDF, cards: Array<{ label: string; value: string }>, y = 35) => {
  const gap = 3;
  const width = (277 - gap * (cards.length - 1)) / cards.length;

  cards.forEach((card, index) => {
    const x = 10 + index * (width + gap);
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, y, width, 15, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(card.label.toUpperCase(), x + 3, y + 5);
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(card.value, x + 3, y + 11);
  });
};

const tableTheme = {
  theme: 'grid' as const,
  styles: {
    fontSize: 7,
    cellPadding: 2,
    lineColor: [229, 231, 235] as [number, number, number],
    lineWidth: 0.1,
    textColor: [17, 24, 39] as [number, number, number],
    overflow: 'linebreak' as const,
    valign: 'middle' as const,
  },
  headStyles: {
    fillColor: [31, 41, 55] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
  },
  alternateRowStyles: {
    fillColor: [249, 250, 251] as [number, number, number],
  },
  margin: { left: 10, right: 10 },
};

export const exportInventarioPdfLocal = (unidades: Unidad[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalPeso = unidades.reduce((sum, unidad) => sum + toNumber(unidad.pesoActual), 0);
  const totalEgreso = unidades.reduce(
    (sum, unidad) => sum + toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual),
    0
  );

  drawHeader(doc, 'Inventario actual de quesos', 'Las Tres Estrellas');
  drawSummary(doc, [
    { label: 'Unidades', value: String(unidades.length) },
    { label: 'Peso actual', value: kg(totalPeso) },
    { label: 'Egreso acumulado', value: kg(totalEgreso) },
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: 58,
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
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 58 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 24 },
      6: { halign: 'right', cellWidth: 24 },
      7: { cellWidth: 42 },
      8: { cellWidth: 27 },
    },
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

  drawHeader(doc, 'Historial de quesos', 'Unidades y cortes');
  drawSummary(doc, [
    { label: 'Unidades', value: String(unidades.length) },
    { label: 'Peso inicial', value: kg(totalPeso) },
    { label: 'Egreso total', value: kg(totalEgreso) },
    { label: 'Cortes', value: String(totalCortes) },
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: 58,
    head: [['ID', 'Producto', 'PLU', 'Tipo', 'Estado', 'Inicial', 'Actual', 'Egreso', 'Ingreso', 'Cortes']],
    body: unidades.map((unidad) => {
      const cortes = unidad.particiones?.length
        ? unidad.particiones
            .slice(0, 5)
            .map((particion, index) => `${index + 1}. ${date(particion.createdAt)} - ${kg(particion.peso)} ${particion.motivo?.nombre ?? ''}`)
            .join('\n')
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
    columnStyles: {
      0: { cellWidth: 13 },
      1: { cellWidth: 46 },
      2: { cellWidth: 24 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { halign: 'right', cellWidth: 23 },
      6: { halign: 'right', cellWidth: 23 },
      7: { halign: 'right', cellWidth: 23 },
      8: { cellWidth: 24 },
      9: { cellWidth: 73 },
    },
  });

  savePdf(doc, filename);
};
