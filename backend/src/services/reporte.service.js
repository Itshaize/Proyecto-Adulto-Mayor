import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import { Paciente } from '../models/Paciente.js';
import { TomaMedicamento } from '../models/TomaMedicamento.js';
import { Medicion } from '../models/Medicion.js';
import { Usuario } from '../models/Usuario.js';
import { demoStore } from '../data/demo-store.js';

const TIME_ZONE = 'America/Guayaquil';
const BLUE = '0D3B78';
const TEAL = '1597A8';
const GREEN = '4CAF68';
const PALE = 'EAF7F9';
const BORDER = 'D9E4EA';
const usingDatabase = () => mongoose.connection.readyState === 1;

function dateOnly(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : String(value);
}

function dateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

function localRange(desde, hasta) {
  return {
    ...(desde ? { $gte: new Date(`${desde}T00:00:00-05:00`) } : {}),
    ...(hasta ? { $lte: new Date(`${hasta}T23:59:59.999-05:00`) } : {}),
  };
}

function medicationName(toma) {
  const medicamento = toma.medicamentoId && typeof toma.medicamentoId === 'object' ? toma.medicamentoId : null;
  if (medicamento) return `${medicamento.nombre} ${medicamento.concentracion}`.trim();
  return toma.medicamento || 'Medicamento';
}

function medicationDose(toma) {
  const medicamento = toma.medicamentoId && typeof toma.medicamentoId === 'object' ? toma.medicamentoId : null;
  return toma.dosis || medicamento?.dosis || '—';
}

export function validateReportQuery(query) {
  const formato = String(query.formato || '').toLowerCase();
  const seccion = String(query.seccion || 'todas').toLowerCase();
  const desde = String(query.desde || '');
  const hasta = String(query.hasta || '');
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!['xlsx', 'pdf'].includes(formato)) return { error: 'El formato debe ser xlsx o pdf' };
  if (!['todas', 'medicacion', 'salud'].includes(seccion)) return { error: 'La sección no es válida' };
  if ((desde && !datePattern.test(desde)) || (hasta && !datePattern.test(hasta))) return { error: 'Las fechas deben usar el formato AAAA-MM-DD' };
  if (desde && hasta && desde > hasta) return { error: 'La fecha inicial no puede ser posterior a la fecha final' };
  return { formato, seccion, desde, hasta };
}

export async function getReportData({ pacienteId, adminId, seccion, desde, hasta }) {
  let paciente;
  let administrador;
  let tomas = [];
  let mediciones = [];

  if (usingDatabase()) {
    if (!mongoose.isValidObjectId(pacienteId)) return null;
    paciente = await Paciente.findOne({ _id: pacienteId, hijoAdminId: adminId }).lean();
    if (!paciente) return null;
    administrador = await Usuario.findById(adminId).select('nombre correo').lean();

    const takeQuery = {
      pacienteId,
      ...(desde || hasta ? { fechaProgramada: { ...(desde ? { $gte: desde } : {}), ...(hasta ? { $lte: hasta } : {}) } } : {}),
    };
    const healthRange = localRange(desde, hasta);
    [tomas, mediciones] = await Promise.all([
      seccion === 'salud' ? [] : TomaMedicamento.find(takeQuery).sort({ fechaProgramada: -1, horaProgramada: -1 }).populate('medicamentoId').lean(),
      seccion === 'medicacion' ? [] : Medicion.find({ pacienteId, ...(Object.keys(healthRange).length ? { fechaHora: healthRange } : {}) }).sort({ fechaHora: -1 }).lean(),
    ]);
  } else {
    paciente = demoStore.pacientes.find((item) => String(item._id) === String(pacienteId) && String(item.hijoAdminId) === String(adminId));
    if (!paciente) return null;
    administrador = demoStore.usuarios.find((item) => String(item._id) === String(adminId));
    tomas = seccion === 'salud' ? [] : demoStore.tomas
      .filter((item) => item.pacienteId === pacienteId && (!desde || item.fechaProgramada >= desde) && (!hasta || item.fechaProgramada <= hasta))
      .sort((a, b) => b.fechaProgramada.localeCompare(a.fechaProgramada) || b.horaProgramada.localeCompare(a.horaProgramada));
    mediciones = seccion === 'medicacion' ? [] : demoStore.mediciones
      .filter((item) => item.pacienteId === pacienteId && (!desde || String(item.fechaHora).slice(0, 10) >= desde) && (!hasta || String(item.fechaHora).slice(0, 10) <= hasta))
      .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
  }

  const medicationRows = tomas.map((toma) => ({
    fecha: toma.fechaProgramada,
    hora: toma.horaProgramada,
    medicamento: medicationName(toma),
    dosis: medicationDose(toma),
    estado: toma.estado,
    metodo: toma.metodoConfirmacion || 'Sin confirmar',
    confirmada: toma.fechaHoraConfirmacion,
    observacion: toma.observacion || '',
  }));
  const healthRows = mediciones.map((measurement) => ({
    fechaHora: measurement.fechaHora,
    pulsaciones: measurement.pulsaciones,
    spo2: measurement.spo2,
    estado: measurement.estadoSalud,
    dispositivo: measurement.dispositivoId,
  }));
  const average = (rows, key) => rows.length ? Math.round(rows.reduce((sum, item) => sum + Number(item[key] || 0), 0) / rows.length) : null;

  return {
    paciente,
    administrador,
    filtros: { seccion, desde, hasta },
    generadoEn: new Date(),
    tomas: medicationRows,
    mediciones: healthRows,
    resumen: {
      tomas: medicationRows.length,
      tomadas: medicationRows.filter((item) => item.estado === 'TOMADA').length,
      pendientes: medicationRows.filter((item) => item.estado === 'PENDIENTE').length,
      omitidas: medicationRows.filter((item) => item.estado === 'OMITIDA').length,
      mediciones: healthRows.length,
      promedioPulsaciones: average(healthRows, 'pulsaciones'),
      promedioSpo2: average(healthRows, 'spo2'),
    },
  };
}

function styleTitle(sheet, lastColumn) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  const title = sheet.getCell('A1');
  title.value = 'KAIRÓS · REPORTE DE SALUD Y MEDICACIÓN';
  title.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BLUE}` } };
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 34;
}

function styleHeader(row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: `FF${BLUE}` } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${PALE}` } };
    cell.border = { bottom: { style: 'thin', color: { argb: `FF${TEAL}` } } };
    cell.alignment = { vertical: 'middle' };
  });
}

function styleDataRows(sheet, firstRow, lastRow) {
  for (let index = firstRow; index <= lastRow; index += 1) {
    const row = sheet.getRow(index);
    row.height = 21;
    row.eachCell((cell) => {
      cell.border = { bottom: { style: 'hair', color: { argb: `FF${BORDER}` } } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  }
}

export async function buildExcelReport(data) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KAIRÓS';
  workbook.subject = `Historial de ${data.paciente.nombre}`;
  workbook.created = data.generadoEn;

  const summary = workbook.addWorksheet('Resumen', { views: [{ showGridLines: false }] });
  styleTitle(summary, 'F');
  summary.getColumn('A').width = 25;
  summary.getColumn('B').width = 32;
  summary.getColumn('C').width = 20;
  summary.getColumn('D').width = 22;
  summary.getColumn('E').width = 20;
  summary.getColumn('F').width = 22;
  summary.addRow([]);
  summary.addRow(['Paciente', data.paciente.nombre, 'Edad', data.paciente.edad, 'Dispositivo', data.paciente.dispositivoId]);
  summary.addRow(['Diagnósticos', data.paciente.diagnosticos?.join(', ') || 'Sin diagnósticos', 'Periodo', data.filtros.desde || 'Inicio', 'Hasta', data.filtros.hasta || 'Actualidad']);
  summary.addRow(['Generado por', data.administrador?.nombre || 'Administrador', 'Fecha', dateTime(data.generadoEn), 'Contenido', data.filtros.seccion]);
  summary.addRow([]);
  summary.addRow(['INDICADORES', '', '', '', '', '']);
  summary.mergeCells('A7:F7');
  summary.getCell('A7').font = { bold: true, color: { argb: `FF${BLUE}` } };
  summary.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${PALE}` } };
  summary.addRow(['Tomas registradas', data.resumen.tomas, 'Tomadas', data.resumen.tomadas, 'Pendientes', data.resumen.pendientes]);
  summary.addRow(['Mediciones', data.resumen.mediciones, 'Promedio pulsaciones', data.resumen.promedioPulsaciones ?? '—', 'Promedio SpO2', data.resumen.promedioSpo2 == null ? '—' : `${data.resumen.promedioSpo2}%`]);
  summary.getRows(3, 3)?.forEach((row) => row.eachCell((cell, column) => {
    cell.alignment = { vertical: 'top', wrapText: true };
    if (column % 2 === 1) cell.font = { bold: true, color: { argb: `FF${BLUE}` } };
  }));

  if (data.filtros.seccion !== 'salud') {
    const sheet = workbook.addWorksheet('Medicamentos', { views: [{ state: 'frozen', ySplit: 3, showGridLines: false }] });
    styleTitle(sheet, 'H');
    sheet.addRow([]);
    sheet.addRow(['Fecha', 'Hora', 'Medicamento', 'Dosis', 'Estado', 'Método', 'Hora confirmada', 'Observación']);
    styleHeader(sheet.getRow(3));
    sheet.columns = [{ width: 13 }, { width: 11 }, { width: 30 }, { width: 18 }, { width: 14 }, { width: 17 }, { width: 20 }, { width: 34 }];
    if (data.tomas.length) data.tomas.forEach((item) => sheet.addRow([dateOnly(item.fecha), item.hora, item.medicamento, item.dosis, item.estado, item.metodo, dateTime(item.confirmada), item.observacion || '—']));
    else sheet.addRow(['Sin registros para el periodo seleccionado']);
    styleDataRows(sheet, 4, sheet.rowCount);
    sheet.autoFilter = `A3:H${Math.max(3, sheet.rowCount)}`;
  }

  if (data.filtros.seccion !== 'medicacion') {
    const sheet = workbook.addWorksheet('Salud', { views: [{ state: 'frozen', ySplit: 3, showGridLines: false }] });
    styleTitle(sheet, 'E');
    sheet.addRow([]);
    sheet.addRow(['Fecha y hora', 'Pulsaciones (lpm)', 'SpO2 (%)', 'Estado de salud', 'Dispositivo']);
    styleHeader(sheet.getRow(3));
    sheet.columns = [{ width: 22 }, { width: 21 }, { width: 16 }, { width: 21 }, { width: 24 }];
    if (data.mediciones.length) data.mediciones.forEach((item) => sheet.addRow([dateTime(item.fechaHora), item.pulsaciones, item.spo2, item.estado, item.dispositivo]));
    else sheet.addRow(['Sin registros para el periodo seleccionado']);
    styleDataRows(sheet, 4, sheet.rowCount);
    sheet.autoFilter = `A3:E${Math.max(3, sheet.rowCount)}`;
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function drawPdfHeader(doc, data, continuation = false) {
  doc.save().rect(0, 0, doc.page.width, continuation ? 58 : 116).fill(`#${BLUE}`).restore();
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(continuation ? 15 : 24).text('KAIRÓS', 42, continuation ? 20 : 30);
  doc.fillColor('#BDE9DD').font('Helvetica').fontSize(9).text(continuation ? `Historial de ${data.paciente.nombre}` : 'CUIDADO FAMILIAR · INFORME CONFIDENCIAL', 42, continuation ? 39 : 59);
  if (!continuation) doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('Reporte de salud y medicación', 42, 78);
  doc.y = continuation ? 76 : 136;
}

function ensurePdfSpace(doc, data, height) {
  if (doc.y + height <= doc.page.height - 54) return;
  doc.addPage();
  drawPdfHeader(doc, data, true);
}

function pdfSectionTitle(doc, data, title, subtitle) {
  ensurePdfSpace(doc, data, 48);
  doc.fillColor(`#${BLUE}`).font('Helvetica-Bold').fontSize(13).text(title);
  doc.moveDown(0.15).fillColor('#60788B').font('Helvetica').fontSize(8.5).text(subtitle);
  doc.moveDown(0.7);
}

function pdfTable(doc, data, columns, rows) {
  const x = 42;
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const drawHeader = () => {
    ensurePdfSpace(doc, data, 42);
    const y = doc.y;
    doc.save().roundedRect(x, y, tableWidth, 25, 4).fill(`#${PALE}`).restore();
    let currentX = x;
    columns.forEach((column) => {
      doc.fillColor(`#${BLUE}`).font('Helvetica-Bold').fontSize(7.5).text(column.label, currentX + 5, y + 8, { width: column.width - 10, lineBreak: false });
      currentX += column.width;
    });
    doc.y = y + 29;
  };

  drawHeader();
  if (!rows.length) {
    doc.fillColor('#60788B').font('Helvetica').fontSize(9).text('Sin registros para el periodo seleccionado.', x + 5, doc.y + 7);
    doc.y += 31;
    return;
  }

  rows.forEach((row) => {
    const values = columns.map((column) => String(row[column.key] ?? '—'));
    const height = Math.max(25, ...values.map((value, index) => doc.heightOfString(value, { width: columns[index].width - 10 }) + 11));
    if (doc.y + height > doc.page.height - 54) {
      doc.addPage();
      drawPdfHeader(doc, data, true);
      drawHeader();
    }
    const y = doc.y;
    doc.save().moveTo(x, y + height).lineTo(x + tableWidth, y + height).strokeColor(`#${BORDER}`).lineWidth(0.5).stroke().restore();
    let currentX = x;
    columns.forEach((column, index) => {
      const isStatus = column.key === 'estado';
      doc.fillColor(isStatus && values[index] === 'TOMADA' ? '#27875B' : isStatus && ['ALERTA', 'OMITIDA'].includes(values[index]) ? '#B34A4A' : '#27445D')
        .font(isStatus ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5)
        .text(values[index], currentX + 5, y + 8, { width: column.width - 10 });
      currentX += column.width;
    });
    doc.y = y + height;
  });
  doc.moveDown(0.8);
}

export async function buildPdfReport(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true, info: { Title: `Historial de ${data.paciente.nombre}`, Author: 'KAIRÓS' } });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  drawPdfHeader(doc, data);
  doc.fillColor(`#${BLUE}`).font('Helvetica-Bold').fontSize(15).text(data.paciente.nombre);
  doc.moveDown(0.2).fillColor('#60788B').font('Helvetica').fontSize(9)
    .text(`${data.paciente.edad} años · Dispositivo ${data.paciente.dispositivoId} · ${data.paciente.diagnosticos?.join(', ') || 'Sin diagnósticos registrados'}`);
  doc.moveDown(0.3).text(`Periodo: ${data.filtros.desde ? dateOnly(data.filtros.desde) : 'inicio'} — ${data.filtros.hasta ? dateOnly(data.filtros.hasta) : 'actualidad'} · Generado: ${dateTime(data.generadoEn)}`);
  doc.moveDown(1.1);

  const metrics = [
    ['Tomas', data.resumen.tomas], ['Tomadas', data.resumen.tomadas],
    ['Mediciones', data.resumen.mediciones], ['Promedio SpO2', data.resumen.promedioSpo2 == null ? '—' : `${data.resumen.promedioSpo2}%`],
  ];
  const metricWidth = 122;
  const metricY = doc.y;
  metrics.forEach(([label, value], index) => {
    const metricX = 42 + index * (metricWidth + 7);
    doc.save().roundedRect(metricX, metricY, metricWidth, 52, 7).fill(`#${PALE}`).restore();
    doc.fillColor(`#${TEAL}`).font('Helvetica-Bold').fontSize(16).text(String(value), metricX + 11, metricY + 10, { width: metricWidth - 22 });
    doc.fillColor('#60788B').font('Helvetica').fontSize(7.5).text(label, metricX + 11, metricY + 32, { width: metricWidth - 22 });
  });
  doc.y = metricY + 72;

  if (data.filtros.seccion !== 'salud') {
    pdfSectionTitle(doc, data, 'Historial de medicamentos', `${data.resumen.tomadas} tomadas · ${data.resumen.pendientes} pendientes · ${data.resumen.omitidas} omitidas`);
    pdfTable(doc, data, [
      { key: 'fechaPdf', label: 'Fecha', width: 66 }, { key: 'hora', label: 'Hora', width: 44 },
      { key: 'medicamento', label: 'Medicamento', width: 137 }, { key: 'dosis', label: 'Dosis', width: 72 },
      { key: 'estado', label: 'Estado', width: 60 }, { key: 'metodo', label: 'Método', width: 72 },
      { key: 'confirmadaPdf', label: 'Confirmada', width: 62 },
    ], data.tomas.map((item) => ({ ...item, fechaPdf: dateOnly(item.fecha), confirmadaPdf: item.confirmada ? dateTime(item.confirmada).slice(11) : '—' })));
  }

  if (data.filtros.seccion !== 'medicacion') {
    pdfSectionTitle(doc, data, 'Historial de salud', `${data.resumen.mediciones} lecturas · Promedio ${data.resumen.promedioPulsaciones ?? '—'} lpm · SpO2 ${data.resumen.promedioSpo2 ?? '—'}%`);
    pdfTable(doc, data, [
      { key: 'fechaPdf', label: 'Fecha y hora', width: 128 }, { key: 'pulsacionesPdf', label: 'Pulsaciones', width: 88 },
      { key: 'spo2Pdf', label: 'SpO2', width: 70 }, { key: 'estado', label: 'Estado', width: 92 },
      { key: 'dispositivo', label: 'Dispositivo', width: 135 },
    ], data.mediciones.map((item) => ({ ...item, fechaPdf: dateTime(item.fechaHora), pulsacionesPdf: `${item.pulsaciones} lpm`, spo2Pdf: `${item.spo2}%` })));
  }

  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    doc.fillColor('#71879A').font('Helvetica').fontSize(7)
      .text(`KAIRÓS · Documento confidencial · Página ${index + 1} de ${pages.count}`, 42, doc.page.height - 32, { width: doc.page.width - 84, align: 'center', lineBreak: false });
  }
  doc.end();
  await finished;
  return Buffer.concat(chunks);
}

export function reportFilename(patientName, extension) {
  const safeName = patientName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `kairos-historial-${safeName || 'paciente'}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}
