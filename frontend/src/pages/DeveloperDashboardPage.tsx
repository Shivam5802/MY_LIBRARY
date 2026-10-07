import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { developerService } from '../services/developer.service';
import type { DeveloperDashboardStats, DeveloperIncomeOverview } from '../types/auth';
import { useTheme } from '../context/ThemeContext';
import {
  IndianRupee,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
  Target,
  ArrowRight,
  CreditCard,
  Layers,
  Box,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatDate } from '../utils/dateUtils';

export const DeveloperDashboardPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [stats, setStats] = useState<DeveloperDashboardStats | null>(null);
  const [incomeData, setIncomeData] = useState<DeveloperIncomeOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statsRes, incomeRes] = await Promise.all([
        developerService.getDashboardStats(),
        developerService.getIncomeOverview({ preset: 'this_month' }),
      ]);
      setStats(statsRes);
      setIncomeData(incomeRes);
    } catch (err: any) {
      console.error('Failed to load developer dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading Developer Financial &amp; System Analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Error loading developer telemetry</h3>
        <p className="text-sm text-rose-600 dark:text-rose-300">{error || 'Something went wrong.'}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Lifetime Income',
      value: formatInr(stats.lifetimeIncome),
      description: 'All valid recorded payments to date',
      icon: IndianRupee,
      color: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400',
    },
    {
      title: "Today's Income",
      value: formatInr(stats.todayIncome),
      description: 'Recorded today in Asia/Kolkata',
      icon: Clock,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    },
    {
      title: 'Current Month Income',
      value: formatInr(stats.currentMonthIncome),
      description: '1st of current month through today',
      icon: Calendar,
      color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400',
    },
    {
      title: 'Previous Month Income',
      value: formatInr(stats.previousMonthIncome),
      description: 'Entire preceding calendar month',
      icon: TrendingUp,
      color: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
    },
    {
      title: 'Current Year Income',
      value: formatInr(stats.currentYearIncome),
      description: 'Jan 1 through current date',
      icon: Target,
      color: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
    },
    {
      title: 'Pending Fees',
      value: formatInr(stats.pendingFees),
      description: `${stats.pendingStudentCount} student(s) with outstanding dues`,
      icon: AlertCircle,
      color: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400',
    },
    {
      title: 'Expected Income',
      value: formatInr(stats.expectedIncome),
      description: 'Outstanding balance on active periods',
      icon: IndianRupee,
      color: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
    },
    {
      title: 'Active Students',
      value: stats.activeStudents.toString(),
      description: 'Currently enrolled active members',
      icon: Users,
      color: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400',
    },
  ];

  const PIE_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-8">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-xs dark:shadow-none transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Technical Administration &amp; Financials</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time server-side aggregated metrics anchored to Indian Standard Time (Asia/Kolkata).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/developer/income"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Full Income Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* 8 ANALYTICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`p-5 rounded-2xl border transition-all ${card.color} shadow-xs dark:shadow-none`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* CHARTS SECTION */}
      {incomeData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income Trend Area Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-none space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Monthly Income Trend (Day-by-Day)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total collected: {formatInr(incomeData.summary.rangeIncome)}</p>
              </div>
              <NavLink
                to="/developer/income"
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Expand Chart
              </NavLink>
            </div>

            <div className="h-64 w-full">
              {incomeData.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={incomeData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#1E293B' : '#E2E8F0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#94A3B8' : '#64748B'}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => val.slice(8)} // Show day number
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
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#incomeGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No payment data recorded in this period yet.
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-none space-y-4 flex flex-col justify-between transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Payment Methods
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share of collected income</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData.paymentMethodBreakdown}
                    dataKey="amount"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {incomeData.paymentMethodBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              {incomeData.paymentMethodBreakdown.map((item, idx) => (
                <div key={item.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-900 dark:text-white font-bold">{formatInr(item.amount)}</span>
                    <span className="text-slate-500 ml-1.5">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SHIFT & LOCKER METRICS */}
      {incomeData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shift Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs dark:shadow-none transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Shift-wise Income
            </h3>
            <div className="space-y-2">
              {incomeData.shiftIncome.map((s) => (
                <div
                  key={s.shift}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{s.shift.replace('_', ' ')}</p>
                    <p className="text-[11px] text-slate-500">{s.count} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{formatInr(s.amount)}</p>
                    <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">{s.percentage}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locker Revenue */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs dark:shadow-none transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Locker-wise Income
            </h3>
            <div className="space-y-2">
              {incomeData.lockerIncome.map((l) => (
                <div
                  key={l.locker}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{l.locker.replace('_', ' ')}</p>
                    <p className="text-[11px] text-slate-500">{l.count} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{formatInr(l.amount)}</p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{l.percentage}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RECENT PAYMENTS TABLE / MOBILE CARDS */}
      {incomeData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-none space-y-0 transition-colors">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Recent Verified Payments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest recorded transactions</p>
            </div>
            <NavLink
              to="/developer/income"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              View All
            </NavLink>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Seat</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {incomeData.recentPayments.length > 0 ? (
                  incomeData.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-purple-700 dark:text-purple-300 font-semibold">
                        {p.receiptNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{p.studentName || 'Student'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {p.seatNumber ? `Seat #${p.seatNumber}` : 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatDate(p.paymentDate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {incomeData.recentPayments.length > 0 ? (
              incomeData.recentPayments.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{p.studentName || 'Student'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatInr(p.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-purple-700 dark:text-purple-300">{p.receiptNumber}</span>
                    <span>{p.seatNumber ? `Seat #${p.seatNumber}` : 'No Seat'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                      {p.paymentMethod}
                    </span>
                    <span>{formatDate(p.paymentDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No payments found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
