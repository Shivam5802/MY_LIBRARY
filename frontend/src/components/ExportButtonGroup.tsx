import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { developerService, type DeveloperReportFilters } from '../services/developer.service';

interface ExportButtonGroupProps {
  category: string;
  filters?: DeveloperReportFilters;
  title?: string;
}

export const ExportButtonGroup: React.FC<ExportButtonGroupProps> = ({
  category,
  filters = {},
}) => {
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setExportingFormat(format);
      setSuccessMessage('Preparing export...');
      setErrorMessage(null);

      await developerService.exportReport(category, format, filters);

      setSuccessMessage('Download ready!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Export failed:', err);
      setErrorMessage('Unable to generate report. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={Boolean(exportingFormat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          title="Export CSV"
        >
          {exportingFormat === 'csv' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          CSV
        </button>

        <button
          onClick={() => handleExport('xlsx')}
          disabled={Boolean(exportingFormat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          title="Export Excel (.xlsx)"
        >
          {exportingFormat === 'xlsx' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          )}
          Excel
        </button>

        <button
          onClick={() => handleExport('pdf')}
          disabled={Boolean(exportingFormat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          title="Export Printable PDF"
        >
          {exportingFormat === 'pdf' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
          ) : (
            <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          )}
          PDF
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMessage}
        </div>
      )}
    </div>
  );
};
