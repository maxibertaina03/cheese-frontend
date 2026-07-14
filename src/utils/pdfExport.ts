import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Elemento, Indumentaria, MovimientoStockComercial, StockComercialItem, Unidad } from '../types';

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

// Título de sección dentro de un reporte (barra oscura con texto). Devuelve la Y siguiente.
const drawSectionBar = (doc: jsPDF, title: string, y: number) => {
  doc.setFillColor(31, 41, 55);
  doc.rect(10, y, 277, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 14, y + 6.2);
  doc.setTextColor(17, 24, 39);
  return y + 12;
};

// Y donde terminó la última tabla dibujada por autoTable (para encadenar secciones).
const afterTableY = (doc: jsPDF, fallback: number) => {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return last ? last.finalY : fallback;
};

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

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

  // Agrupar por tipo de queso; dentro de cada grupo, de mayor a menor peso actual.
  const grupos = new Map<string, Unidad[]>();
  for (const u of unidades) {
    const tipo = u.producto?.tipoQueso?.nombre?.trim() || 'Sin tipo';
    const arr = grupos.get(tipo);
    if (arr) arr.push(u);
    else grupos.set(tipo, [u]);
  }
  const tiposOrdenados = Array.from(grupos.keys()).sort(collator.compare);

  const columnStyles = {
    0: { cellWidth: 16 },
    1: { cellWidth: 70 },
    2: { cellWidth: 34 },
    3: { halign: 'right' as const, cellWidth: 30 },
    4: { halign: 'right' as const, cellWidth: 30 },
    5: { halign: 'right' as const, cellWidth: 30 },
    6: { cellWidth: 40 },
    7: { cellWidth: 27 },
  };
  const head = [['ID', 'Producto', 'PLU', 'Inicial', 'Actual', 'Egreso', 'Motivo', 'Ingreso']];

  let y = 55;
  tiposOrdenados.forEach((tipo, i) => {
    const filas = grupos
      .get(tipo)!
      .sort((a, b) => toNumber(b.pesoActual) - toNumber(a.pesoActual));
    const pesoTipo = filas.reduce((s, u) => s + toNumber(u.pesoActual), 0);

    y = i === 0 ? y : afterTableY(doc, y) + 10;
    y = drawSectionBar(doc, `${tipo} — ${filas.length} unidades · ${kg(pesoTipo)}`, y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head,
      body: filas.map((unidad) => [
        `#${unidad.id}`,
        unidad.producto?.nombre ?? '-',
        unidad.producto?.plu ?? '-',
        kg(unidad.pesoInicial),
        kg(unidad.pesoActual),
        kg(toNumber(unidad.pesoInicial) - toNumber(unidad.pesoActual)),
        unidad.motivo?.nombre ?? '-',
        date(unidad.createdAt),
      ]),
      columnStyles,
    });
  });

  savePdf(doc, filename);
};

export const exportElementosPdfLocal = (elementos: Elemento[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalDisponible = elementos.reduce((sum, e) => sum + toNumber(e.cantidadDisponible), 0);
  const totalHistorico = elementos.reduce((sum, e) => sum + toNumber(e.cantidadTotal), 0);
  const bajos = elementos.filter((e) => toNumber(e.cantidadDisponible) <= 5).length;

  drawHeader(doc, 'Inventario de elementos', 'Las Tres Estrellas');
  drawSummary(doc, [
    { label: 'Elementos', value: String(elementos.length) },
    { label: 'Disponible total', value: String(totalDisponible) },
    { label: 'Total historico', value: String(totalHistorico) },
    { label: 'Bajo stock', value: String(bajos) },
  ]);

  // Tres secciones por estado: con stock (>5), bajo stock (1-5) y sin stock (0),
  // cada una de mayor a menor disponible.
  const porDisp = (a: Elemento, b: Elemento) =>
    toNumber(b.cantidadDisponible) - toNumber(a.cantidadDisponible) ||
    collator.compare(a.nombre ?? '', b.nombre ?? '');
  const conStock = elementos.filter((e) => toNumber(e.cantidadDisponible) > 5).sort(porDisp);
  const bajoStock = elementos
    .filter((e) => toNumber(e.cantidadDisponible) > 0 && toNumber(e.cantidadDisponible) <= 5)
    .sort(porDisp);
  const sinStock = elementos.filter((e) => toNumber(e.cantidadDisponible) <= 0).sort(porDisp);

  const columnStyles = {
    0: { cellWidth: 16 },
    1: { cellWidth: 70 },
    2: { halign: 'right' as const, cellWidth: 28 },
    3: { halign: 'right' as const, cellWidth: 28 },
    4: { cellWidth: 28 },
    5: { cellWidth: 107 },
  };
  const head = [['ID', 'Nombre', 'Disponible', 'Total', 'Estado', 'Descripcion']];
  const toRow = (e: Elemento) => [
    `#${e.id}`,
    e.nombre ?? '-',
    String(toNumber(e.cantidadDisponible)),
    String(toNumber(e.cantidadTotal)),
    e.activo ? 'Activo' : 'Inactivo',
    e.descripcion ?? '-',
  ];

  const secciones: Array<{ titulo: string; filas: Elemento[]; vacio: string }> = [
    { titulo: `Con stock — ${conStock.length}`, filas: conStock, vacio: 'Sin elementos con stock' },
    { titulo: `Bajo stock (1 a 5) — ${bajoStock.length}`, filas: bajoStock, vacio: 'Ninguno bajo stock' },
    { titulo: `Sin stock (0) — ${sinStock.length}`, filas: sinStock, vacio: 'Ninguno sin stock' },
  ];

  let y = 55;
  secciones.forEach((sec, i) => {
    y = i === 0 ? y : afterTableY(doc, y) + 10;
    y = drawSectionBar(doc, sec.titulo, y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head,
      body: sec.filas.length ? sec.filas.map(toRow) : [[sec.vacio, '', '', '', '', '']],
      columnStyles,
    });
  });

  savePdf(doc, filename);
};

export const exportIndumentariaPdfLocal = (prendas: Indumentaria[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalDisponible = prendas.reduce((sum, p) => sum + toNumber(p.cantidadDisponible), 0);
  const bajos = prendas.filter(
    (p) => toNumber(p.stockMinimo) > 0 && toNumber(p.cantidadDisponible) <= toNumber(p.stockMinimo)
  ).length;

  // Ordenar por tipo de prenda (categoria) y luego por nombre, para que el
  // reporte agrupe visualmente lo que hay de cada tipo.
  const prendasOrdenadas = [...prendas].sort((a, b) => {
    const catA = (a.categoria ?? '').trim();
    const catB = (b.categoria ?? '').trim();
    const porCategoria = collator.compare(catA, catB);
    if (porCategoria !== 0) return porCategoria;
    return collator.compare(a.nombre ?? '', b.nombre ?? '');
  });

  drawHeader(doc, 'Inventario de indumentaria', 'Ropa de trabajo y entregas');
  drawSummary(doc, [
    { label: 'Prendas', value: String(prendas.length) },
    { label: 'Disponible total', value: String(totalDisponible) },
    { label: 'Bajo stock', value: String(bajos) },
  ]);

  autoTable(doc, {
    ...tableTheme,
    startY: 58,
    head: [['ID', 'Nombre', 'Categoria', 'Talle', 'Color', 'Disponible', 'Stock min', 'Proveedor']],
    body: prendasOrdenadas.map((prenda) => [
      `#${prenda.id}`,
      prenda.nombre ?? '-',
      prenda.categoria ?? '-',
      prenda.talle ?? '-',
      prenda.color ?? '-',
      String(toNumber(prenda.cantidadDisponible)),
      String(toNumber(prenda.stockMinimo)),
      prenda.proveedor?.nombre ?? '-',
    ]),
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 55 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', cellWidth: 24 },
      7: { cellWidth: 79 },
    },
  });

  savePdf(doc, filename);
};

export const exportStockComercialPdfLocal = (items: StockComercialItem[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalDisponible = items.reduce((sum, i) => sum + toNumber(i.cantidadDisponible), 0);

  // Con stock: de mayor a menor cantidad (desempate por nombre).
  const conStock = items
    .filter((i) => toNumber(i.cantidadDisponible) > 0)
    .sort(
      (a, b) =>
        toNumber(b.cantidadDisponible) - toNumber(a.cantidadDisponible) ||
        collator.compare(a.producto ?? '', b.producto ?? '')
    );
  // Sin stock: alfabético por tipo y nombre.
  const sinStock = items
    .filter((i) => toNumber(i.cantidadDisponible) <= 0)
    .sort(
      (a, b) =>
        collator.compare((a.tipoQueso ?? '').trim(), (b.tipoQueso ?? '').trim()) ||
        collator.compare(a.producto ?? '', b.producto ?? '')
    );

  drawHeader(doc, 'Stock de venta (facturación)', 'Cantidad disponible para facturar');
  drawSummary(doc, [
    { label: 'Productos', value: String(items.length) },
    { label: 'Unidades disponibles', value: String(totalDisponible) },
    { label: 'Con stock', value: String(conStock.length) },
    { label: 'Sin stock', value: String(sinStock.length) },
  ]);

  const columnStyles = {
    0: { cellWidth: 130 },
    1: { cellWidth: 45 },
    2: { cellWidth: 62 },
    3: { halign: 'right' as const, cellWidth: 40 },
  };
  const head = [['Producto', 'PLU', 'Tipo', 'Disponible']];
  const toRow = (item: StockComercialItem) => [
    item.producto ?? '-',
    item.plu ?? '-',
    item.tipoQueso ?? '-',
    String(toNumber(item.cantidadDisponible)),
  ];

  // --- Sección 1: productos con stock (de mayor a menor) ---
  let y = drawSectionBar(doc, `Con stock — ${conStock.length} productos · ${totalDisponible} unidades`, 55);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head,
    body: conStock.length ? conStock.map(toRow) : [['Sin productos con stock', '', '', '']],
    columnStyles,
  });

  // --- Sección 2: productos sin stock (0 unidades) ---
  y = afterTableY(doc, y) + 10;
  y = drawSectionBar(doc, `Sin stock (0 unidades) — ${sinStock.length} productos`, y);
  autoTable(doc, {
    ...tableTheme,
    startY: y,
    head,
    body: sinStock.length ? sinStock.map(toRow) : [['Todos los productos tienen stock', '', '', '']],
    columnStyles,
  });

  savePdf(doc, filename);
};

const pesos = (value: unknown) =>
  `$ ${toNumber(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tipoMovLabel = (tipo: string) =>
  tipo === 'ingreso' ? 'Compra' : tipo === 'egreso' ? 'Venta' : 'Ajuste';

export const exportMovimientosStockPdfLocal = (
  movimientos: MovimientoStockComercial[],
  filename: string,
  subtitulo = 'Historial de compras y movimientos'
) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso');
  const unidadesCompradas = ingresos.reduce((s, m) => s + toNumber(m.cantidad), 0);
  const totalInvertido = ingresos.reduce((s, m) => s + toNumber(m.precioCompra) * toNumber(m.cantidad), 0);
  const unidadesVendidas = movimientos
    .filter((m) => m.tipo === 'egreso')
    .reduce((s, m) => s + toNumber(m.cantidad), 0);

  drawHeader(doc, 'Compras y movimientos de stock', subtitulo);
  drawSummary(doc, [
    { label: 'Movimientos', value: String(movimientos.length) },
    { label: 'Unidades compradas', value: String(unidadesCompradas) },
    { label: 'Total invertido', value: pesos(totalInvertido) },
    { label: 'Unidades vendidas', value: String(unidadesVendidas) },
  ]);

  // Agrupar por proveedor con subtotal invertido; grupos de mayor a menor inversión.
  const grupos = new Map<string, MovimientoStockComercial[]>();
  for (const m of movimientos) {
    const prov = m.proveedor?.trim() || 'Sin proveedor';
    const arr = grupos.get(prov);
    if (arr) arr.push(m);
    else grupos.set(prov, [m]);
  }
  const invertidoDe = (arr: MovimientoStockComercial[]) =>
    arr.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + toNumber(m.precioCompra) * toNumber(m.cantidad), 0);
  const proveedoresOrden = Array.from(grupos.keys()).sort(
    (a, b) => invertidoDe(grupos.get(b)!) - invertidoDe(grupos.get(a)!) || collator.compare(a, b)
  );

  const columnStyles = {
    0: { cellWidth: 26 },
    1: { cellWidth: 74 },
    2: { cellWidth: 24 },
    3: { halign: 'right' as const, cellWidth: 20 },
    4: { cellWidth: 40 },
    5: { halign: 'right' as const, cellWidth: 32 },
    6: { halign: 'right' as const, cellWidth: 34 },
    7: { cellWidth: 27 },
  };
  const head = [['Fecha', 'Producto', 'Tipo', 'Cant.', 'Comprobante', 'Precio u.', 'Total', 'Usuario']];
  const toRow = (m: MovimientoStockComercial) => {
    const comprobante = [m.comprobantePrefijo, m.comprobanteNumero].filter(Boolean).join('-') || '-';
    const esCompra = m.tipo === 'ingreso';
    const total = esCompra ? toNumber(m.precioCompra) * toNumber(m.cantidad) : 0;
    return [
      date(m.fechaComprobante || m.createdAt),
      `${m.producto ?? '-'}${m.plu ? ` (${m.plu})` : ''}`,
      tipoMovLabel(m.tipo),
      String(toNumber(m.cantidad)),
      comprobante,
      esCompra && m.precioCompra != null ? pesos(m.precioCompra) : '-',
      esCompra && m.precioCompra != null ? pesos(total) : '-',
      m.usuario?.username ?? '-',
    ];
  };

  let y = 55;
  proveedoresOrden.forEach((prov, i) => {
    const filas = grupos.get(prov)!;
    const invertido = invertidoDe(filas);
    y = i === 0 ? y : afterTableY(doc, y) + 10;
    y = drawSectionBar(doc, `${prov} — ${filas.length} mov. · invertido ${pesos(invertido)}`, y);
    autoTable(doc, {
      ...tableTheme,
      startY: y,
      head,
      body: filas.map(toRow),
      columnStyles,
    });
  });

  if (movimientos.length === 0) {
    drawSectionBar(doc, 'Sin movimientos', 55);
  }

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
