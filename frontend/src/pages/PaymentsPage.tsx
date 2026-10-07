import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BillingService } from '../services/billing.service';
import type { BillingPeriodWithPayments, PaymentDto } from '../types/auth';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import {
  CreditCard,
  Search,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  User,
  RefreshCw,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PERIODS' | 'TRANSACTIONS'>('PERIODS');
  const [periods, setPeriods] = useState<BillingPeriodWithPayments[]>([]);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('');

  // Modals
  const [selectedPeriodForPayment, setSelectedPeriodForPayment] =
    useState<BillingPeriodWithPayments | null>(null);
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    mobile: string;
    billingPeriodId: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    mobile: '',
    billingPeriodId: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedPeriods, fetchedPayments] = await Promise.all([
        BillingService.getBillingPeriods({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          shift: shiftFilter || undefined,
          search: search.trim() || undefined,
        }),
        BillingService.getPayments({
          search: search.trim() || undefined,
        }),
      ]);
      setPeriods(fetchedPeriods);
      setPayments(fetchedPayments);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch fee records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(t);
  }, [statusFilter, shiftFilter, search]);

  const handleRecordPaymentSubmit = async (payload: any) => {
    await BillingService.recordPayment(payload);
    await loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
      case 'DUE_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <Clock className="w-3 h-3" /> DUE SOON
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> OVERDUE
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            DUE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Fee Management &amp; Payments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track admission-date billing cycles, record student fees, and review transaction receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PERIODS')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'PERIODS'
              ? 'border-indigo-600 text-slate-900 dark:border-indigo-500 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Billing Cycles &amp; Balances ({periods.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'TRANSACTIONS'
              ? 'border-indigo-600 text-slate-900 dark:border-indigo-500 dark:text-white font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Payment Receipts ({payments.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, phone, or seat #..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          {activeTab === 'PERIODS' && (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Status: All</option>
                <option value="DUE_SOON">Due Soon (≤ 5 Days)</option>
                <option value="OVERDUE">Overdue</option>
                <option value="DUE">Due Today/Normal</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Fully Paid</option>
              </select>
            </div>
          )}

          {/* Shift Filter */}
          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Shift: All</option>
              <option value="FULL_DAY">Full Day</option>
              <option value="MORNING">Morning</option>
              <option value="EVENING">Evening</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Content Tabs */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading fee records...</p>
        </div>
      ) : activeTab === 'PERIODS' ? (
        periods.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <DollarSign className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">No billing cycles found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table for Billing Cycles */}
            <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Seat</th>
                    <th className="py-3 px-4">Billing Cycle</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Outstanding</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {periods.map((period) => (
                    <tr key={period.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <NavLink
                          to={`/owner/students/${period.studentId}`}
                          className="hover:underline flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300">
                            {period.student?.name?.charAt(0) || <User className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="block">{period.student?.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-normal">
                              {period.student?.mobile}
                            </span>
                          </div>
                        </NavLink>
                      </td>
                      <td className="py-3 px-4">
                        {period.student?.seatNumber ? (
                          <span className="px-2 py-0.5 rounded-md font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs">
                            #{period.student.seatNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-800 dark:text-slate-200">
                          {new Date(period.periodStart).toLocaleDateString()} – {new Date(period.periodEnd).toLocaleDateString()}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                          Due: {new Date(period.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        ₹{period.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{period.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                        ₹{period.outstanding.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(period.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {period.outstanding > 0 && (
                            <>
                              <button
                                onClick={() => setSelectedPeriodForPayment(period)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                              >
                                Record Pay
                              </button>
                              <button
                                onClick={() =>
                                  setWhatsappModal({
                                    isOpen: true,
                                    studentId: period.studentId,
                                    studentName: period.student?.name || '',
                                    mobile: period.student?.mobile || '',
                                    billingPeriodId: period.id,
                                  })
                                }
                                className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Billing Cycles */}
            <div className="md:hidden space-y-3">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{period.student?.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {period.student?.seatNumber ? `Seat #${period.student.seatNumber}` : 'Unassigned'} • {period.student?.mobile}
                      </p>
                    </div>
                    {getStatusBadge(period.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850">
                    <div>
                      <span className="text-slate-500 block">Cycle:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(period.periodStart).toLocaleDateString()} – {new Date(period.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Fee:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{period.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Paid:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{period.paidAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Outstanding:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">
                        ₹{period.outstanding.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {period.outstanding > 0 && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() =>
                          setWhatsappModal({
                            isOpen: true,
                            studentId: period.studentId,
                            studentName: period.student?.name || '',
                            mobile: period.student?.mobile || '',
                            billingPeriodId: period.id,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                      <button
                        onClick={() => setSelectedPeriodForPayment(period)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                      >
                        Record Payment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )
      ) : payments.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">No payment receipts recorded</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Recorded payments will appear here with unique receipt IDs.</p>
        </div>
      ) : (
        /* Payment Receipts Tab */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-300">{p.receiptNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {p.studentName || 'Student'} {p.seatNumber ? `(Seat #${p.seatNumber})` : ''}
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedPeriodForPayment}
        period={selectedPeriodForPayment}
        onClose={() => setSelectedPeriodForPayment(null)}
        onSubmit={handleRecordPaymentSubmit}
      />

      {/* WhatsApp Modal */}
      <WhatsAppReminderModal
        isOpen={whatsappModal.isOpen}
        studentId={whatsappModal.studentId}
        studentName={whatsappModal.studentName}
        mobile={whatsappModal.mobile}
        billingPeriodId={whatsappModal.billingPeriodId}
        onClose={() =>
          setWhatsappModal({
            isOpen: false,
            studentId: '',
            studentName: '',
            mobile: '',
            billingPeriodId: '',
          })
        }
      />
    </div>
  );
};
