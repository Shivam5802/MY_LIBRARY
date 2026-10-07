import React, { useEffect, useState } from 'react';
import { developerService } from '../services/developer.service';
import type { DeveloperIncomeOverview, PaymentDto } from '../types/auth';
import { ReportFilterBar, type FilterState } from '../components/ReportFilterBar';
import { ExportButtonGroup } from '../components/ExportButtonGroup';
import { useTheme } from '../context/ThemeContext';
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  Layers,
  Box,
  Eye,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const DeveloperIncomePage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [filters, setFilters] = useState<FilterState>({
    preset: 'this_month',
  });
  const [data, setData] = useState<DeveloperIncomeOverview | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncome = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await developerService.getIncomeOverview({
        preset: filters.preset,
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
        shift: filters.shift,
        locker: filters.locker,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load income data:', err);
      setError(err.message || 'Failed to load income reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, [filters]);

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Income &amp; Revenue Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audited financial intake aggregated exclusively from successful payment records.
          </p>
        </div>

        <ExportButtonGroup category="income" filters={filters} title="Income Report" />
      </div>

      {/* Reusable Filter Controls */}
      <ReportFilterBar
        filters={filters}
        onChange={setFilters}
        showShift={true}
        showLocker={true}
        showPaymentMethod={true}
      />

      {/* Summary KPI Badges */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Lifetime Income</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
              {formatInr(data.summary.lifetimeIncome)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Today</p>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatInr(data.summary.todayIncome)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Month</p>
            <p className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatInr(data.summary.currentMonthIncome)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Previous Month</p>
            <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mt-1">
              {formatInr(data.summary.previousMonthIncome)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Year</p>
            <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatInr(data.summary.currentYearIncome)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 shadow-xs">
            <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300">Selected Range</p>
            <p className="text-sm sm:text-base font-bold text-purple-900 dark:text-purple-200 mt-1">
              {formatInr(data.summary.rangeIncome)}
            </p>
          </div>
        </div>
      )}

      {/* Main Income Trend Chart */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
        </div>
      ) : data ? (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-none space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Income Trend Over Time
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {data.summary.rangePaymentCount} transactions across selected timeframe
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-700 w-fit">
                Total: {formatInr(data.summary.rangeIncome)}
              </span>
            </div>

            <div className="h-72 w-full">
              {data.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#1E293B' : '#E2E8F0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? '#94A3B8' : '#64748B'}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#94A3B8' : '#64748B'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Income']}
                      labelFormatter={(label) => `Interval: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#A855F7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#rangeGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No payment data in this range.
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Method Breakdown */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs dark:shadow-none transition-colors">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Payment Method
              </h4>
              <div className="space-y-2">
                {data.paymentMethodBreakdown.map((m) => (
                  <div
                    key={m.method}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{m.method}</p>
                      <p className="text-[10px] text-slate-500">{m.count} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{formatInr(m.amount)}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{m.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Breakdown */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs dark:shadow-none transition-colors">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                Shift-wise Intake
              </h4>
              <div className="space-y-2">
                {data.shiftIncome.map((s) => (
                  <div
                    key={s.shift}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{s.shift.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-500">{s.count} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{formatInr(s.amount)}</p>
                      <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">{s.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locker Breakdown */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs dark:shadow-none transition-colors">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Locker Usage Intake
              </h4>
              <div className="space-y-2">
                {data.lockerIncome.map((l) => (
                  <div
                    key={l.locker}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{l.locker.replace('_', ' ')}</p>
                      <p className="text-[10px] text-slate-500">{l.count} payments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">{formatInr(l.amount)}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{l.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Payments Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-none transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transactions in Selected Scope</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click any transaction to inspect details</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Seat</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {data.recentPayments.length > 0 ? (
                    data.recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-purple-700 dark:text-purple-300 font-semibold">
                          {p.receiptNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{p.studentName}</td>
                        <td className="px-4 py-3">
                          {p.seatNumber ? `Seat #${p.seatNumber}` : 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Inspect Payment Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No transactions found in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {data.recentPayments.length > 0 ? (
                data.recentPayments.map((p) => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{p.studentName}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatInr(p.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-purple-700 dark:text-purple-300">{p.receiptNumber}</span>
                      <span>{p.seatNumber ? `Seat #${p.seatNumber}` : 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.paymentMethod}</span>
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">No records found.</div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Transaction Detail</h3>
                <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                  Receipt: {selectedPayment.receiptNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Student</p>
                <p className="text-slate-900 dark:text-white font-semibold mt-0.5">{selectedPayment.studentName || 'Student'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Seat Number</p>
                <p className="text-slate-900 dark:text-white font-semibold mt-0.5">
                  {selectedPayment.seatNumber ? `#${selectedPayment.seatNumber}` : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Amount Paid</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{formatInr(selectedPayment.amount)}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Payment Method</p>
                <p className="text-slate-900 dark:text-white font-semibold mt-0.5">{selectedPayment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Payment Date</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  {new Date(selectedPayment.paymentDate).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Reference / UTR</p>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{selectedPayment.reference || 'None'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 dark:text-slate-400">Note / Remarks</p>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedPayment.note || 'None'}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>Payment ID: {selectedPayment.id}</span>
                <span>Period ID: {selectedPayment.billingPeriodId.slice(0, 8)}...</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
