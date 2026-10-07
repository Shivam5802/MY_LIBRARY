import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { DashboardService } from '../services/dashboard.service';
import { SeatService } from '../services/seat.service';
import { BillingService } from '../services/billing.service';
import type {
  OwnerDashboardStats,
  SeatWithStudent,
  FeeReminderItem,
  BillingPeriodWithPayments,
} from '../types/auth';
import { StatCard } from '../components/StatCard';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import {
  Armchair,
  CheckCircle2,
  XCircle,
  Users,
  Archive,
  UserPlus,
  ArrowRight,
  Bell,
  Sparkles,
  AlertTriangle,
  Clock,
  DollarSign,
  MessageSquare,
  CreditCard,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [recentSeats, setRecentSeats] = useState<SeatWithStudent[]>([]);
  const [reminders, setReminders] = useState<FeeReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // WhatsApp reminder modal state
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

  // Record payment modal state
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    period: BillingPeriodWithPayments | null;
  }>({
    isOpen: false,
    period: null,
  });

  const loadDashboard = async () => {
    try {
      const [statsData, seatsData, reminderData] = await Promise.all([
        DashboardService.getOwnerDashboardStats(),
        SeatService.getAllSeats(),
        BillingService.getFeeReminders(),
      ]);
      setStats(statsData);
      setRecentSeats(seatsData.filter((s) => s.status === 'OCCUPIED').slice(0, 8));
      setReminders(reminderData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleOpenRecordPayment = async (rem: FeeReminderItem) => {
    try {
      const curPeriod = await BillingService.getStudentCurrentBilling(rem.studentId);
      if (curPeriod) {
        setPaymentModal({ isOpen: true, period: curPeriod });
      } else {
        alert('Could not find active billing period for this student.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve billing period.');
    }
  };

  const occupancyRate = stats ? Math.round((stats.occupiedSeats / 92) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs dark:shadow-xl transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Study Hall Operational Status
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Library Overview
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Live monitor for 92 study desks, recurring admission-date fee cycles, and 5-day reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NavLink
            to="/owner/payments"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Fee Register
          </NavLink>
          <NavLink
            to="/owner/students/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Register Student
          </NavLink>
          <NavLink
            to="/owner/seats"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Open 92 Seat Map
          </NavLink>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Operational Summary Stat Cards (Seats & Students) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Desks"
          value={stats?.totalSeats ?? 92}
          subtitle="Fixed capacity"
          icon={<Armchair className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          variant="default"
        />
        <StatCard
          title="Occupied"
          value={stats?.occupiedSeats ?? 0}
          subtitle={`${occupancyRate}% rate`}
          icon={<XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />
        <StatCard
          title="Available"
          value={stats?.availableSeats ?? 92}
          subtitle="Ready to assign"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          variant="success"
        />
        <StatCard
          title="Active Students"
          value={stats?.activeStudents ?? 0}
          subtitle="Enrolled"
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          variant="info"
        />
        <StatCard
          title="Archived"
          value={stats?.archivedStudents ?? 0}
          subtitle="Historical"
          icon={<Archive className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
          variant="default"
        />
      </div>

      {/* Real-time Fee Status Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <StatCard
          title="Fees Due Soon (≤ 5 Days)"
          value={stats?.feesDueSoon ?? 0}
          subtitle="Reminder window"
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          variant="info"
        />
        <StatCard
          title="Fees Due Today"
          value={stats?.feesDue ?? 0}
          subtitle="Due on cycle anniversary"
          icon={<DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          variant="default"
        />
        <StatCard
          title="Fees Overdue"
          value={stats?.feesOverdue ?? 0}
          subtitle="Past billing cycle"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          variant="danger"
        />
      </div>

      {/* Fee Reminders Alert Section (Dynamic 5-Day Window) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fee Reminders &amp; Attention</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {reminders.length > 0
                  ? `${reminders.length} student${reminders.length === 1 ? '' : 's'} have fees due within 5 days or overdue.`
                  : 'No fee reminders right now.'}
              </p>
            </div>
          </div>

          <NavLink
            to="/owner/payments"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 self-start sm:self-auto"
          >
            View Full Fee Register <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {reminders.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
            All active students are current on their admission-date fee cycles. No reminders pending.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reminders.map((rem) => {
              const isOverdue = rem.status === 'OVERDUE';
              return (
                <div
                  key={rem.billingPeriodId}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rem.studentName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rem.seatNumber ? `Seat #${rem.seatNumber}` : 'Unassigned'} • {rem.mobile}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      {isOverdue ? 'OVERDUE' : `${rem.daysRemaining}d left`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Outstanding:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      ₹{rem.outstanding.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => navigate(`/owner/students/${rem.studentId}`)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer text-center"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenRecordPayment(rem)}
                      className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer text-center"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() =>
                        setWhatsappModal({
                          isOpen: true,
                          studentId: rem.studentId,
                          studentName: rem.studentName,
                          mobile: rem.mobile,
                          billingPeriodId: rem.billingPeriodId,
                        })
                      }
                      className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-600/10 hover:bg-emerald-100 dark:hover:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Glance: Occupied Desks */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs dark:shadow-none transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Currently Occupied Desks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quick view of students actively using seats.</p>
          </div>
          <NavLink
            to="/owner/seats"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            View All 92 Seats <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentSeats.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No occupied seats at the moment. All seats are available for booking.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recentSeats.map((seat) => (
              <div
                key={seat.id}
                onClick={() => navigate('/owner/seats')}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center gap-3 cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-xs font-black text-rose-700 dark:text-rose-300 shrink-0">
                  #{seat.seatNumber}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {seat.currentStudent?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {seat.currentStudent?.shift.replace('_', ' ')} • {seat.currentStudent?.mobile}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModal.isOpen}
        period={paymentModal.period}
        onClose={() => setPaymentModal({ isOpen: false, period: null })}
        onSubmit={async (payload) => {
          await BillingService.recordPayment(payload);
          await loadDashboard();
        }}
      />
    </div>
  );
};
