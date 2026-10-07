import type {
  DeveloperDashboardStats,
  DeveloperIncomeOverview,
  ActivityLogRow,
  DataIntegrityReport,
  SystemInfoData,
  PaymentDto,
  User,
} from '../types/auth';
import { staticDb } from '../mock/staticData';

export interface DeveloperReportFilters {
  preset?: string;
  startDate?: string;
  endDate?: string;
  shift?: string;
  locker?: string;
  paymentMethod?: string;
  status?: string;
  year?: number;
}

// Client-side export generator for CSV, Excel XML/HTML, and printable text/PDF
function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const developerService = {
  // Dashboard
  getDashboardStats: async (): Promise<DeveloperDashboardStats> => {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getDeveloperDashboardStats();
  },

  // Income Overview & Analytics
  getIncomeOverview: async (filters: DeveloperReportFilters = {}): Promise<DeveloperIncomeOverview> => {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getDeveloperIncomeOverview(filters);
  },

  // Payment Detail
  getPaymentDetail: async (paymentId: string): Promise<PaymentDto> => {
    await new Promise((r) => setTimeout(r, 40));
    const payment = staticDb.getPayments().find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');
    return payment;
  },

  // Reports
  getReportData: async <T>(category: string, _filters: DeveloperReportFilters = {}): Promise<T> => {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getReportData<T>(category);
  },

  // Activity Logs
  getActivityLogs: async (filters: {
    action?: string;
    role?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; logs: ActivityLogRow[] }> => {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getActivityLogs(filters);
  },

  // System & Health
  getSystemInfo: async (): Promise<SystemInfoData> => {
    await new Promise((r) => setTimeout(r, 40));
    return staticDb.getSystemInfo();
  },

  getIntegrityReport: async (): Promise<DataIntegrityReport> => {
    await new Promise((r) => setTimeout(r, 60));
    return staticDb.getIntegrityReport();
  },

  // Developer Profile
  getProfile: async (): Promise<User> => {
    await new Promise((r) => setTimeout(r, 40));
    const user = staticDb.getUser('developer');
    if (!user) throw new Error('Developer profile not found');
    return user;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    await new Promise((r) => setTimeout(r, 100));
    const user = staticDb.getUser('developer');
    if (!user) throw new Error('Developer profile not found');
    return staticDb.updateUser(user.id, data);
  },

  changePassword: async (_currentPassword: string, _newPassword: string, _confirmNewPassword: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 100));
  },

  // File Exports (CSV, XLSX, PDF) directly generated client-side from staticDb
  exportReport: async (
    category: string,
    format: 'csv' | 'xlsx' | 'pdf',
    _filters: DeveloperReportFilters = {}
  ): Promise<void> => {
    await new Promise((r) => setTimeout(r, 150));
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${category}_report_${dateStr}.${format}`;
    const reportData: any = staticDb.getReportData(category);
    const rows: any[] = reportData.rows || [];

    if (format === 'csv') {
      if (rows.length === 0) {
        triggerBrowserDownload(new Blob(['No data available'], { type: 'text/csv' }), filename);
        return;
      }
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerBrowserDownload(blob, filename);
    } else if (format === 'xlsx') {
      // Excel-compatible XML Spreadsheet 2003
      let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${category}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body><table border="1">`;

      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        tableHtml += '<thead><tr style="background:#4f46e5;color:#ffffff;font-weight:bold;">' +
          headers.map((h) => `<th>${h}</th>`).join('') +
          '</tr></thead><tbody>';
        rows.forEach((r) => {
          tableHtml += '<tr>' + headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('') + '</tr>';
        });
        tableHtml += '</tbody>';
      } else {
        tableHtml += '<tr><td>No records available</td></tr>';
      }
      tableHtml += '</table></body></html>';

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      triggerBrowserDownload(blob, filename);
    } else if (format === 'pdf') {
      // Create printable structured HTML formatted as print document
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>MY LIBRARY - ${category.toUpperCase()} REPORT</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; }
                h1 { font-size: 20px; margin-bottom: 4px; color: #0f172a; }
                p.meta { font-size: 12px; color: #64748b; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; }
                td { padding: 6px 8px; border: 1px solid #e2e8f0; }
                tr:nth-child(even) { background: #f8fafc; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div>
                  <h1>MY LIBRARY — ${category.toUpperCase().replace(/-/g, ' ')} REPORT</h1>
                  <p class="meta">Generated: ${new Date().toLocaleString()} | Autonomous Static Mode (92 Seats Capacity)</p>
                </div>
                <button onclick="window.print()" style="padding:8px 16px; background:#4f46e5; color:#fff; border:none; border-radius:6px; cursor:pointer;">Print / Save as PDF</button>
              </div>
              <table>
                <thead>
                  <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        // Fallback text blob if popup blocked
        const textContent = JSON.stringify(rows, null, 2);
        const blob = new Blob([textContent], { type: 'application/pdf' });
        triggerBrowserDownload(blob, filename);
      }
    }
  },
};
