import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { TimezoneUtils } from '../utils/timezone.js';

export class ExportService {
  /**
   * Generates CSV format with UTF-8 BOM, escaped values, headers and summary rows.
   */
  static generateCsv(
    headers: string[],
    rows: (string | number | null | undefined)[][],
    summaryRows?: (string | number | null | undefined)[][]
  ): string {
    const escapeCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const lines: string[] = [];

    // Header line
    lines.push(headers.map(escapeCell).join(','));

    // Data rows
    for (const r of rows) {
      lines.push(r.map(escapeCell).join(','));
    }

    // Optional summary footer
    if (summaryRows && summaryRows.length > 0) {
      lines.push(''); // empty line separator
      for (const s of summaryRows) {
        lines.push(s.map(escapeCell).join(','));
      }
    }

    // UTF-8 Byte Order Mark for Excel compatibility
    return '\uFEFF' + lines.join('\r\n');
  }

  /**
   * Generates styled multi-sheet Excel spreadsheet buffer using exceljs.
   */
  static async generateExcel(options: {
    sheetName: string;
    reportTitle: string;
    filtersText?: string;
    headers: string[];
    rows: (string | number | null | undefined)[][];
    summaryRows?: { label: string; value: string | number }[];
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MY LIBRARY';
    workbook.created = new Date();

    // Sheet 1: Detailed Report
    const sheet = workbook.addWorksheet(options.sheetName || 'Report');

    // Add Title Banner
    const titleRow = sheet.addRow(['MY LIBRARY - ' + options.reportTitle]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo brand color
    };
    sheet.mergeCells(1, 1, 1, Math.max(options.headers.length, 4));

    // Add generated metadata row
    const metaRow = sheet.addRow([
      `Generated on: ${TimezoneUtils.formatToIstDisplay(new Date())} (Asia/Kolkata) | ${options.filtersText || 'All Records'}`,
    ]);
    metaRow.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
    sheet.mergeCells(2, 1, 2, Math.max(options.headers.length, 4));

    sheet.addRow([]); // Blank spacer

    // Header Row
    const headerRow = sheet.addRow(options.headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate-800
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Data Rows
    options.rows.forEach((r, idx) => {
      const row = sheet.addRow(r);
      if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // subtle zebra
        };
      }
    });

    // Auto-fit column widths
    sheet.columns.forEach((col) => {
      let maxLen = 14;
      if (col && col.values) {
        col.values.forEach((v) => {
          const str = String(v || '');
          if (str.length > maxLen && str.length < 50) {
            maxLen = str.length;
          }
        });
      }
      col.width = maxLen + 4;
    });

    // Sheet 2: Executive Summary
    if (options.summaryRows && options.summaryRows.length > 0) {
      const summarySheet = workbook.addWorksheet('Summary');
      const sumTitle = summarySheet.addRow(['EXECUTIVE SUMMARY']);
      sumTitle.font = { bold: true, size: 13 };
      summarySheet.addRow([]);

      const sHeader = summarySheet.addRow(['Metric', 'Value']);
      sHeader.font = { bold: true };
      sHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };

      for (const item of options.summaryRows) {
        summarySheet.addRow([item.label, item.value]);
      }

      summarySheet.getColumn(1).width = 30;
      summarySheet.getColumn(2).width = 25;
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generates printable professional PDF buffer using pdfkit.
   */
  static async generatePdf(options: {
    reportTitle: string;
    filtersText?: string;
    headers: string[];
    rows: (string | number | null | undefined)[][];
    summary?: { label: string; value: string | number }[];
  }): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margin: 30,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Header
        doc.fontSize(16).fillColor('#4F46E5').text('MY LIBRARY', { continued: false });
        doc.fontSize(14).fillColor('#1E293B').text(options.reportTitle);
        doc.fontSize(9).fillColor('#64748B').text(
          `Generated: ${TimezoneUtils.formatToIstDisplay(new Date())} (Asia/Kolkata) | Filters: ${options.filtersText || 'All Records'}`
        );
        doc.moveDown(0.8);

        // Summary box if provided
        if (options.summary && options.summary.length > 0) {
          doc.fontSize(10).fillColor('#0F172A').text('Executive Summary:');
          options.summary.forEach((s) => {
            doc.fontSize(8).fillColor('#334155').text(`• ${s.label}: ${s.value}`);
          });
          doc.moveDown(0.8);
        }

        // Table layout calculation
        const pageWidth = doc.page.width - 60; // 30 margin left and right
        const colCount = options.headers.length;
        const colWidth = Math.max(pageWidth / colCount, 60);

        let startY = doc.y;

        // Render Table Headers
        doc.rect(30, startY, pageWidth, 20).fill('#1E293B');
        options.headers.forEach((h, i) => {
          doc
            .fontSize(8)
            .fillColor('#FFFFFF')
            .text(h, 34 + i * colWidth, startY + 5, {
              width: colWidth - 8,
              ellipsis: true,
            });
        });

        startY += 22;

        // Render Rows
        options.rows.forEach((row, rowIdx) => {
          if (startY > doc.page.height - 40) {
            doc.addPage();
            startY = 30;
          }

          if (rowIdx % 2 === 1) {
            doc.rect(30, startY, pageWidth, 16).fill('#F8FAFC');
          }

          row.forEach((cell, cellIdx) => {
            const cellText = String(cell ?? '-');
            doc
              .fontSize(7)
              .fillColor('#1E293B')
              .text(cellText, 34 + cellIdx * colWidth, startY + 4, {
                width: colWidth - 8,
                ellipsis: true,
              });
          });

          startY += 17;
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
