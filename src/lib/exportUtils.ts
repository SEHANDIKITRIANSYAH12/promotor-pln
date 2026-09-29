import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface PdfColumn {
  header: string;
  dataKey: string;
}

export interface SummaryStat {
  label: string;
  value: string | number;
}

export interface ExportExcelConfig {
  filename: string;
  sheetName?: string;
  columns?: ExcelColumn[];
  data: any[];
}

export interface ExportPdfConfig {
  filename: string;
  title: string;
  subtitle?: string;
  unit?: string;
  orientation?: 'portrait' | 'landscape';
  columns?: PdfColumn[];
  data?: any[];
  tableHeaders?: string[];
  tableData?: any[][];
  summaryStats?: SummaryStat[];
  summaryCards?: Array<{ label: string; value: string | number; color?: number[] }>;
  signer?: { name: string; title: string; unit?: string };
  signatureName?: string;
  signatureTitle?: string;
}

/**
 * Enhanced Excel Export with auto column width & flexible arguments
 */
export function exportToExcel(
  arg1: ExportExcelConfig | any[],
  arg2?: string,
  arg3?: string
) {
  let filename = 'EXPORT_DATA_PLN';
  let sheetName = 'DATA';
  let rows: Record<string, any>[] = [];
  let explicitCols: ExcelColumn[] | undefined;

  if (Array.isArray(arg1)) {
    rows = arg1;
    if (arg2) filename = arg2;
    if (arg3) sheetName = arg3;
  } else {
    filename = arg1.filename;
    sheetName = arg1.sheetName || 'DATA';
    explicitCols = arg1.columns;
    if (arg1.columns && arg1.columns.length > 0) {
      rows = arg1.data.map(item => {
        const row: Record<string, any> = {};
        arg1.columns!.forEach(col => {
          row[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
        });
        return row;
      });
    } else {
      rows = arg1.data;
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-calculate column widths
  if (rows.length > 0) {
    const keys = Object.keys(rows[0]);
    const colWidths = keys.map(k => {
      const explicitWidth = explicitCols?.find(c => c.header === k || c.key === k)?.width;
      const maxLen = rows.reduce((max, r) => {
        const str = String(r[k] || '');
        return Math.max(max, str.length);
      }, k.length);
      return { wch: Math.max(explicitWidth || 12, Math.min(maxLen + 4, 60)) };
    });
    ws['!cols'] = colWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Official PLN Formatted PDF Export with Letterhead, AutoTable & Signatures
 */
export function exportToPdf(config: ExportPdfConfig) {
  const {
    filename,
    title,
    subtitle = 'Sistem Informasi Monitoring Proyek & Kontrol Material (PROMOTOR V1.0)',
    unit = 'PLN ULP RANGKASBITUNG',
    orientation = 'landscape',
    columns,
    data,
    tableHeaders,
    tableData,
    summaryStats,
    summaryCards,
    signer,
    signatureName = 'SEHAN DIKI TRIANSYAH',
    signatureTitle = 'Manager ULP Rangkasbitung'
  } = config;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Header PLN Letterhead
  doc.setFillColor(12, 135, 235); // PLN Primary Blue
  doc.rect(margin, 10, 4, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('PT PLN (PERSERO) UID BANTEN', margin + 7, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(12, 135, 235);
  doc.text(`UP3 BANTEN SELATAN — ${unit.toUpperCase()}`, margin + 7, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`, margin + 7, 25);

  // Document Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(title.toUpperCase(), margin, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, margin, 40);

  let currentY = 44;

  // 2. Summary Stats Cards (if provided)
  const statsList = summaryStats || (summaryCards ? summaryCards.map(c => ({ label: c.label, value: c.value })) : undefined);

  if (statsList && statsList.length > 0) {
    const boxWidth = (pageWidth - margin * 2) / statsList.length;
    statsList.forEach((stat, idx) => {
      const x = margin + idx * boxWidth;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x + 1, currentY, boxWidth - 2, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label.toUpperCase(), x + 4, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(12, 135, 235);
      doc.text(String(stat.value), x + 4, currentY + 11);
    });
    currentY += 18;
  }

  // 3. Resolve Table Headers & Rows
  let finalHeaders: string[] = [];
  let finalRows: any[][] = [];

  if (tableHeaders && tableData) {
    finalHeaders = tableHeaders;
    finalRows = tableData;
  } else if (columns && data) {
    finalHeaders = columns.map(c => c.header);
    finalRows = data.map(item => {
      const row: any[] = [];
      columns.forEach(col => {
        const val = item[col.dataKey];
        row.push(val !== undefined && val !== null ? String(val) : '-');
      });
      return row;
    });
  }

  autoTable(doc, {
    head: [finalHeaders],
    body: finalRows,
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 35 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [12, 135, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (hookData) => {
      // Footer page numbering
      const str = `Halaman ${hookData.pageNumber} dari ${doc.getNumberOfPages()} · Dokumen Resmi PROMOTOR V1.0 PLN`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, margin, pageHeight - 8);
    }
  });

  // 4. Signature Block on final page
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 20;
  const signatureSpaceNeeded = 32;

  let sigY = finalY + 8;
  if (sigY + signatureSpaceNeeded > pageHeight - 12) {
    doc.addPage();
    sigY = 20;
  }

  const sigX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${unit.replace(/^PLN\s+/i, '')}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, sigX, sigY);
  doc.text('Mengetahui / Menyetujui,', sigX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(signer?.title || signatureTitle, sigX, sigY + 8);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(sigX, sigY + 24, sigX + 55, sigY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(signer?.name || signatureName, sigX, sigY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(signer?.unit || 'PT PLN (Persero)', sigX, sigY + 32);

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
