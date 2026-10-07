import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentService } from '../services/student.service';
import { SeatService } from '../services/seat.service';
import { BillingService } from '../services/billing.service';
import type {
  StudentWithSeat,
  SeatWithStudent,
  BillingPeriodWithPayments,
} from '../types/auth';
import { StudentStatus, SeatStatus } from '../types/auth';
import { StudentForm } from '../components/StudentForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Clock,
  Key,
  DollarSign,
  Armchair,
  Edit2,
  Archive,
  RotateCcw,
  UserMinus,
  ArrowRightLeft,
  History,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CreditCard,
  Receipt,
  Trash2,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentWithSeat | null>(null);
  const [availableSeats, setAvailableSeats] = useState<SeatWithStudent[]>([]);
  const [currentBilling, setCurrentBilling] = useState<BillingPeriodWithPayments | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingPeriodWithPayments[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetSeatNumber, setTargetSeatNumber] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Billing modals
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

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedStudent, allSeats, currentPeriod, history] = await Promise.all([
        StudentService.getStudentById(id),
        SeatService.getAllSeats(),
        BillingService.getStudentCurrentBilling(id),
        BillingService.getStudentBillingHistory(id),
      ]);
      setStudent(fetchedStudent);
      setAvailableSeats(allSeats.filter((s) => s.status === SeatStatus.AVAILABLE));
      setCurrentBilling(currentPeriod);
      setBillingHistory(history);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (values: any) => {
    if (!student) return;
    await StudentService.updateStudent(student.id, values);
    setIsEditing(false);
    await loadData();
  };

  const handleVacate = () => {
    if (!student || !student.currentSeat) return;
    setDialogConfig({
      isOpen: true,
      title: 'Vacate Seat Assignment',
      message: `Vacate Seat #${student.currentSeat.seatNumber}? ${student.name} will remain an ACTIVE registered student.`,
      confirmLabel: 'Vacate Seat',
      isDestructive: true,
      action: async () => {
        await SeatService.vacateSeat(student.currentSeat!.seatNumber);
        await loadData();
      },
    });
  };

  const handleArchive = () => {
    if (!student) return;
    setDialogConfig({
      isOpen: true,
      title: 'Archive Student',
      message: `Archive ${student.name}? Their record will be preserved for financial auditing, and their current seat will immediately be released to other students.`,
      confirmLabel: 'Archive Student',
      isDestructive: true,
      action: async () => {
        await StudentService.archiveStudent(student.id);
        await loadData();
      },
    });
  };

  const handleRestore = () => {
    if (!student) return;
    setDialogConfig({
      isOpen: true,
      title: 'Restore Student',
      message: `Restore ${student.name} back to ACTIVE status?`,
      confirmLabel: 'Restore Student',
      isDestructive: false,
      action: async () => {
        await StudentService.restoreStudent(student.id);
        await loadData();
      },
    });
  };

  const handleDelete = () => {
    if (!student) return;
    setDialogConfig({
      isOpen: true,
      title: 'Delete Student Record Permanently',
      message: `Are you sure you want to permanently delete ${student.name}? Their seat will be vacated and all their records will be removed from the static database.`,
      confirmLabel: 'Delete Student',
      isDestructive: true,
      action: async () => {
        await StudentService.deleteStudent(student.id);
        navigate('/owner/students');
      },
    });
  };

  const handleTransfer = async () => {
    if (!student || !targetSeatNumber) return;
    try {
      await SeatService.transferSeat(student.id, Number(targetSeatNumber));
      setIsTransferModalOpen(false);
      setTargetSeatNumber('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Seat transfer failed.');
    }
  };

  const handleRecordPaymentSubmit = async (payload: any) => {
    await BillingService.recordPayment(payload);
    await loadData();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading student details...</p>
      </div>
    );
  }

  if (errorMsg || !student) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-400">{errorMsg || 'Student not found.'}</p>
        <button
          onClick={() => navigate('/owner/students')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer"
        >
          Return to Students
        </button>
      </div>
    );
  }

  const isArchived = student.status === StudentStatus.ARCHIVED;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with back link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/owner/students')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students Directory
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing && !isArchived && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Info
              </button>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-600/10 dark:hover:bg-indigo-600/20 dark:border-indigo-500/20 dark:text-indigo-300 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                {student.currentSeat ? 'Transfer Seat' : 'Assign Seat'}
              </button>
              {student.currentSeat && (
                <button
                  onClick={handleVacate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:border-amber-500/20 dark:text-amber-300 transition-colors cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Vacate Seat
                </button>
              )}
              <button
                onClick={handleArchive}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:border-rose-500/20 dark:text-rose-300 transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/20 dark:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}

          {isArchived && (
            <>
              <button
                onClick={handleRestore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Student
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/20 dark:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Profile View / Edit Form */}
      {isEditing ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm sm:shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Student Details</h3>
          <StudentForm
            initialValues={{
              name: student.name,
              mobile: student.mobile,
              photoUrl: student.photoUrl,
              shift: student.shift,
              locker: student.locker,
              admissionDate: student.admissionDate,
              monthlyFee: student.monthlyFee,
            }}
            isEditMode={true}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm sm:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{student.name}</h2>
                  {isArchived ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      <XCircle className="w-3.5 h-3.5" /> ARCHIVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {student.mobile}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  Database ID: {student.id}
                </p>
              </div>
            </div>

            {/* Current Seat highlight badge */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-center shrink-0 sm:min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Allocated Seat
              </span>
              {student.currentSeat ? (
                <div className="text-xl font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
                  <Armchair className="w-5 h-5 text-rose-500" /> #{student.currentSeat.seatNumber}
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">No Seat Assigned</span>
              )}
            </div>
          </div>

          {/* CURRENT FEE STATUS SECTION */}
          {currentBilling && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm sm:shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Current Fee Status (Cycle: {new Date(currentBilling.periodStart).toLocaleDateString()} – {new Date(currentBilling.periodEnd).toLocaleDateString()})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {currentBilling.outstanding > 0 && (
                    <>
                      <button
                        onClick={() => setSelectedPeriodForPayment(currentBilling)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Record Payment
                      </button>
                      <button
                        onClick={() =>
                          setWhatsappModal({
                            isOpen: true,
                            studentId: student.id,
                            studentName: student.name,
                            mobile: student.mobile,
                            billingPeriodId: currentBilling.id,
                          })
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-600/10 hover:bg-emerald-100 dark:hover:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Reminder
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Agreed Monthly Fee</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    ₹{student.monthlyFee.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Paid This Cycle</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{currentBilling.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Outstanding Balance</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    ₹{currentBilling.outstanding.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Days Remaining</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">
                    {currentBilling.daysRemaining >= 0
                      ? `${currentBilling.daysRemaining} days (Due ${new Date(currentBilling.dueDate).toLocaleDateString()})`
                      : `${Math.abs(currentBilling.daysRemaining)} days OVERDUE`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Details 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Library Operational Info */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Library Admission Details
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Shift Timings
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {student.shift.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Locker Facility
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {student.locker === 'WITH_LOCKER' ? 'Allocated' : 'Not Included'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Admission Date
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Agreed Monthly Fee
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{student.monthlyFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Historical Seat Assignment Audit Log */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Seat History Audit
                </h4>
                <span className="text-[10px] text-slate-500">
                  {student.seatHistory?.length || 0} Records
                </span>
              </div>

              {(!student.seatHistory || student.seatHistory.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No previous seat allocations recorded.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {student.seatHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">Seat #{h.seatNumber}</span>
                        {h.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                        <div>Assigned: {new Date(h.assignedAt).toLocaleDateString()}</div>
                        {h.vacatedAt && (
                          <div className="text-slate-400 dark:text-slate-500">
                            Vacated: {new Date(h.vacatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HISTORICAL BILLING CYCLES & PAYMENTS AUDIT TABLE */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Complete Fee &amp; Payment History
            </h4>

            {billingHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No billing cycles generated yet.
              </p>
            ) : (
              <div className="space-y-3">
                {billingHistory.map((period) => (
                  <div
                    key={period.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          Cycle: {new Date(period.periodStart).toLocaleDateString()} – {new Date(period.periodEnd).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Due Date: {new Date(period.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        ₹{period.paidAmount.toLocaleString('en-IN')} / ₹{period.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {period.payments.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-850 space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                          Payments in this cycle:
                        </span>
                        {period.payments.map((pmt) => (
                          <div
                            key={pmt.id}
                            className="flex justify-between items-center text-[11px] py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-transparent"
                          >
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              ₹{pmt.amount.toLocaleString('en-IN')} ({pmt.paymentMethod})
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {pmt.receiptNumber} • {new Date(pmt.paymentDate).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        isDestructive={dialogConfig.isDestructive}
        onConfirm={async () => {
          await dialogConfig.action();
          setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Seat Transfer Modal */}
      {isTransferModalOpen && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {student.currentSeat ? 'Transfer Seat Assignment' : 'Assign New Seat'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select an available seat for <strong className="text-slate-900 dark:text-white">{student.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Available Desks
              </label>
              <select
                value={targetSeatNumber}
                onChange={(e) => setTargetSeatNumber(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select available seat...</option>
                {availableSeats.map((s) => (
                  <option key={s.id} value={s.seatNumber}>
                    Seat #{s.seatNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTargetSeatNumber('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!targetSeatNumber}
                onClick={handleTransfer}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50 transition-colors"
              >
                Confirm Move
              </button>
            </div>
          </div>
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
