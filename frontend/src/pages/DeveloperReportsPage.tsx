import React, { useEffect, useState } from 'react';
import { developerService } from '../services/developer.service';
import { ReportFilterBar, type FilterState } from '../components/ReportFilterBar';
import { ExportButtonGroup } from '../components/ExportButtonGroup';
import { formatDate } from '../utils/dateUtils';
import {
  FileSpreadsheet,
  IndianRupee,
  AlertCircle,
  Users,
  Armchair,
  Layers,
  Box,
  Calendar,
  Loader2,
} from 'lucide-react';

type ReportCategory =
  | 'income'
  | 'pending-fees'
  | 'students'
  | 'seats'
  | 'admissions'
  | 'shift'
  | 'locker'
  | 'monthly-summary';

export const DeveloperReportsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('income');
  const [filters, setFilters] = useState<FilterState>({
    preset: 'this_month',
    year: new Date().getFullYear(),
  });
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: { id: ReportCategory; label: string; icon: any }[] = [
    { id: 'income', label: '1. Income & Payments', icon: IndianRupee },
    { id: 'pending-fees', label: '2. Pending Fees', icon: AlertCircle },
    { id: 'students', label: '3. Student Directory', icon: Users },
    { id: 'seats', label: '4. Seat Occupancy (92)', icon: Armchair },
    { id: 'admissions', label: '5. Student Admissions', icon: Calendar },
    { id: 'shift', label: '6. Shift Breakdown', icon: Layers },
    { id: 'locker', label: '7. Locker Usage', icon: Box },
    { id: 'monthly-summary', label: '8. Monthly Summary', icon: FileSpreadsheet },
  ];

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await developerService.getReportData(activeCategory, {
        preset: filters.preset,
        startDate: filters.startDate,
        endDate: filters.endDate,
        shift: filters.shift,
        locker: filters.locker,
        paymentMethod: filters.paymentMethod,
        status: filters.status,
        year: filters.year,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeCategory, filters]);

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Centralized Reports &amp; Export Center
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Complete database reports with instant export to CSV, Excel spreadsheets, and print-ready PDF.
          </p>
        </div>

        <ExportButtonGroup category={activeCategory} filters={filters} />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-purple-500/20 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reusable Filter Controls */}
      <ReportFilterBar
        filters={filters}
        onChange={setFilters}
        showShift={['income', 'pending-fees', 'students'].includes(activeCategory)}
        showLocker={['income', 'pending-fees', 'students'].includes(activeCategory)}
        showPaymentMethod={activeCategory === 'income'}
        showStatus={activeCategory === 'pending-fees' || activeCategory === 'students'}
        showYear={activeCategory === 'monthly-summary'}
        statusOptions={
          activeCategory === 'pending-fees'
            ? [
                { label: 'Due Soon (<=5 days)', value: 'DUE_SOON' },
                { label: 'Due Today', value: 'DUE' },
                { label: 'Overdue', value: 'OVERDUE' },
                { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              ]
            : [
                { label: 'Active Members', value: 'ACTIVE' },
                { label: 'Archived Members', value: 'ARCHIVED' },
              ]
        }
      />

      {/* Report Data Display */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
        </div>
      ) : data ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* 1. INCOME REPORT */}
          {activeCategory === 'income' && (
            <div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
                <span className="text-slate-600 dark:text-slate-400">Total Payments: <strong className="text-slate-900 dark:text-white">{data.totalPayments}</strong></span>
                <span className="text-slate-600 dark:text-slate-400">Total Collected: <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatInr(data.totalIncome)}</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Receipt</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Locker</th>
                      <th className="px-4 py-3">Billing Period</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.paymentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-300 font-semibold">{r.receiptNumber}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(r.paymentDate)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3">{r.seatNumber ? `#${r.seatNumber}` : 'None'}</td>
                        <td className="px-4 py-3 text-[11px]">{r.shift}</td>
                        <td className="px-4 py-3 text-[11px]">{r.locker}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.billingPeriod}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(r.amount)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">{r.paymentMethod}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. PENDING FEES REPORT */}
          {activeCategory === 'pending-fees' && (
            <div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
                <span className="text-slate-600 dark:text-slate-400">Students with Dues: <strong className="text-slate-900 dark:text-white">{data.studentsWithOutstanding}</strong></span>
                <span className="text-slate-600 dark:text-slate-400">Total Outstanding: <strong className="text-rose-600 dark:text-rose-400 text-sm">{formatInr(data.totalOutstanding)}</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Billing Period</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Outstanding</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.billingPeriodId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3">{r.seatNumber ? `#${r.seatNumber}` : 'None'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.mobile}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.billingPeriod}</td>
                        <td className="px-4 py-3">{formatInr(r.amount)}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{formatInr(r.paid)}</td>
                        <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatInr(r.outstanding)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(r.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'OVERDUE' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400' :
                            r.status === 'DUE' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                            'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. STUDENT DIRECTORY REPORT */}
          {activeCategory === 'students' && (
            <div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
                Total Enrolled Students: <strong className="text-slate-900 dark:text-white">{data.totalCount}</strong>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Locker</th>
                      <th className="px-4 py-3">Admission</th>
                      <th className="px-4 py-3">Cycle Start</th>
                      <th className="px-4 py-3">Monthly Fee</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                        <td className="px-4 py-3">{r.seatNumber ? `#${r.seatNumber}` : 'None'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.mobile}</td>
                        <td className="px-4 py-3 text-[11px]">{r.shift}</td>
                        <td className="px-4 py-3 text-[11px]">{r.locker}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(r.admissionDate)}</td>
                        <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium">{r.feeCycleStartDate ? formatDate(r.feeCycleStartDate) : formatDate(r.admissionDate)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatInr(r.monthlyFee)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. SEAT OCCUPANCY REPORT */}
          {activeCategory === 'seats' && (
            <div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
                <span className="text-slate-600 dark:text-slate-400">Occupied: <strong className="text-emerald-600 dark:text-emerald-400">{data.occupiedSeats}</strong> / {data.totalSeats}</span>
                <span className="text-slate-600 dark:text-slate-400">Available: <strong className="text-slate-800 dark:text-slate-300">{data.availableSeats}</strong></span>
                <span className="text-slate-600 dark:text-slate-400">Occupancy Rate: <strong className="text-purple-600 dark:text-purple-400 text-sm">{data.occupancyPercentage}%</strong></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Seat #</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned Student</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Assigned Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.seatNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">Seat #{r.seatNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'OCCUPIED' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{r.studentName || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.studentMobile || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {r.assignedDate ? formatDate(r.assignedDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ADMISSIONS REPORT */}
          {activeCategory === 'admissions' && (
            <div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/40">
                Total Admissions in Period: <strong className="text-slate-900 dark:text-white">{data.totalAdmissions}</strong>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Admission Date</th>
                      <th className="px-4 py-3">Cycle Start</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Seat</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Locker</th>
                      <th className="px-4 py-3">Monthly Fee</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {data.rows.map((r: any) => (
                      <tr key={r.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-300 font-semibold">{formatDate(r.admissionDate)}</td>
                        <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-medium">{r.feeCycleStartDate ? formatDate(r.feeCycleStartDate) : formatDate(r.admissionDate)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3">{r.seatNumber ? `#${r.seatNumber}` : 'None'}</td>
                        <td className="px-4 py-3">{r.shift}</td>
                        <td className="px-4 py-3">{r.locker}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{formatInr(r.monthlyFee)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SHIFT REPORT */}
          {activeCategory === 'shift' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Active Students</th>
                    <th className="px-4 py-3">Occupied Seats</th>
                    <th className="px-4 py-3">Collected Income</th>
                    <th className="px-4 py-3">Outstanding Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {data.rows.map((r: any) => (
                    <tr key={r.shift} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{r.shift.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.activeStudents}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.occupiedSeats}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(r.income)}</td>
                      <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatInr(r.outstandingFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. LOCKER USAGE REPORT */}
          {activeCategory === 'locker' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Locker Status</th>
                    <th className="px-4 py-3">Student Count</th>
                    <th className="px-4 py-3">Share Percentage</th>
                    <th className="px-4 py-3">Collected Income</th>
                    <th className="px-4 py-3">Outstanding Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {data.rows.map((r: any) => (
                    <tr key={r.locker} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{r.locker.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.studentCount}</td>
                      <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">{r.percentage}%</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(r.income)}</td>
                      <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatInr(r.outstandingFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 8. MONTHLY SUMMARY REPORT */}
          {activeCategory === 'monthly-summary' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Collected Income</th>
                    <th className="px-4 py-3">Payment Count</th>
                    <th className="px-4 py-3">Pending Amount</th>
                    <th className="px-4 py-3">Active Students</th>
                    <th className="px-4 py-3">New Admissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {data.rows.map((r: any) => (
                    <tr key={r.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{r.month}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatInr(r.collectedIncome)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.paymentCount}</td>
                      <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{formatInr(r.pendingAmount)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.activeStudents}</td>
                      <td className="px-4 py-3 text-purple-600 dark:text-purple-300 font-semibold">{r.newAdmissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
