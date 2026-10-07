import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

export interface FilterState {
  preset: string;
  startDate?: string;
  endDate?: string;
  shift?: string;
  locker?: string;
  paymentMethod?: string;
  status?: string;
  year?: number;
}

interface ReportFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  showShift?: boolean;
  showLocker?: boolean;
  showPaymentMethod?: boolean;
  showStatus?: boolean;
  showYear?: boolean;
  statusOptions?: { label: string; value: string }[];
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onChange,
  showShift = false,
  showLocker = false,
  showPaymentMethod = false,
  showStatus = false,
  showYear = false,
  statusOptions,
}) => {
  const currentYear = new Date().getFullYear();

  const handlePresetChange = (preset: string) => {
    onChange({
      ...filters,
      preset,
      startDate: preset === 'custom' ? filters.startDate : undefined,
      endDate: preset === 'custom' ? filters.endDate : undefined,
    });
  };

  const handleReset = () => {
    onChange({
      preset: 'this_month',
      startDate: undefined,
      endDate: undefined,
      shift: undefined,
      locker: undefined,
      paymentMethod: undefined,
      status: undefined,
      year: currentYear,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs dark:shadow-none space-y-4 transition-colors">
      <div className="flex flex-wrap items-center gap-3">
        {/* Preset Selector */}
        {!showYear && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'prev_month', label: 'Prev Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  filters.preset === p.id
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Year Selector */}
        {showYear && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Year:</span>
            <select
              value={filters.year || currentYear}
              onChange={(e) => onChange({ ...filters, year: parseInt(e.target.value, 10) })}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Date Pickers */}
        {filters.preset === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
            <span className="text-slate-500 text-xs">to</span>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Optional Shift Filter */}
        {showShift && (
          <select
            value={filters.shift || ''}
            onChange={(e) => onChange({ ...filters, shift: e.target.value || undefined })}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Shifts</option>
            <option value="MORNING">Morning Shift</option>
            <option value="EVENING">Evening Shift</option>
            <option value="FULL_DAY">Full Day</option>
          </select>
        )}

        {/* Optional Locker Filter */}
        {showLocker && (
          <select
            value={filters.locker || ''}
            onChange={(e) => onChange({ ...filters, locker: e.target.value || undefined })}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Lockers</option>
            <option value="WITH_LOCKER">With Locker</option>
            <option value="WITHOUT_LOCKER">Without Locker</option>
          </select>
        )}

        {/* Optional Payment Method Filter */}
        {showPaymentMethod && (
          <select
            value={filters.paymentMethod || ''}
            onChange={(e) => onChange({ ...filters, paymentMethod: e.target.value || undefined })}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        )}

        {/* Optional Status Filter */}
        {showStatus && statusOptions && (
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Reset Filter Button */}
        <button
          type="button"
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-xs font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </div>
  );
};
