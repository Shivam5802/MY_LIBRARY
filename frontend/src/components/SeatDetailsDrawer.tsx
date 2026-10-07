import React, { useState } from 'react';
import type { SeatWithStudent, StudentWithSeat } from '../types/auth';
import { SeatStatus } from '../types/auth';
import { formatDate } from '../utils/dateUtils';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  Key,
  DollarSign,
  ArrowRightLeft,
  UserMinus,
  ExternalLink,
  UserPlus,
} from 'lucide-react';

interface SeatDetailsDrawerProps {
  seat: SeatWithStudent | null;
  isOpen: boolean;
  unassignedStudents: StudentWithSeat[];
  availableSeats: SeatWithStudent[];
  onClose: () => void;
  onAssignStudent: (seatNumber: number, studentId: string) => Promise<void>;
  onVacateSeat: (seatNumber: number) => Promise<void>;
  onTransferSeat: (studentId: string, newSeatNumber: number) => Promise<void>;
  onViewStudentProfile: (studentId: string) => void;
  onRegisterNewStudentForSeat: (seatNumber: number) => void;
}

export const SeatDetailsDrawer: React.FC<SeatDetailsDrawerProps> = ({
  seat,
  isOpen,
  unassignedStudents,
  availableSeats,
  onClose,
  onAssignStudent,
  onVacateSeat,
  onTransferSeat,
  onViewStudentProfile,
  onRegisterNewStudentForSeat,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedNewSeat, setSelectedNewSeat] = useState<number | ''>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !seat) return null;

  const isOccupied = seat.status === SeatStatus.OCCUPIED && !!seat.currentStudent;

  const handleAssign = async () => {
    if (!selectedStudentId) {
      setErrorMsg('Please select a student to assign.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onAssignStudent(seat.seatNumber, selectedStudentId);
      setIsAssigning(false);
      setSelectedStudentId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign seat.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedNewSeat || !seat.currentStudent) {
      setErrorMsg('Please select a new target seat.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onTransferSeat(seat.currentStudent.id, Number(selectedNewSeat));
      setIsTransferring(false);
      setSelectedNewSeat('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to transfer seat.');
    } finally {
      setLoading(false);
    }
  };

  const handleVacate = async () => {
    if (!window.confirm(`Vacate Seat ${seat.seatNumber}? The student will remain active.`)) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onVacateSeat(seat.seatNumber);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to vacate seat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col p-6 shadow-2xl overflow-y-auto animate-slide-in-right transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Study Hall Resource
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Seat #{seat.seatNumber}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isOccupied
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                }`}
              >
                {seat.status}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 py-6 space-y-6">
          {isOccupied && seat.currentStudent ? (
            <div className="space-y-6">
              {/* Student identity card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {seat.currentStudent.photoUrl ? (
                    <img
                      src={seat.currentStudent.photoUrl}
                      alt={seat.currentStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {seat.currentStudent.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {seat.currentStudent.mobile}
                  </p>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Shift
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {seat.currentStudent.shift.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Locker
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {seat.currentStudent.locker === 'WITH_LOCKER' ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Admission Date
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    {formatDate(seat.currentStudent.admissionDate)}
                  </span>
                  {seat.currentStudent.feeCycleStartDate && seat.currentStudent.feeCycleStartDate !== seat.currentStudent.admissionDate && (
                    <span className="block text-[10px] text-indigo-500 mt-0.5">
                      Cycle: {formatDate(seat.currentStudent.feeCycleStartDate)}
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Monthly Fee
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{seat.currentStudent.monthlyFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!isTransferring ? (
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => onViewStudentProfile(seat.currentStudent!.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-600/10 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Student Profile
                  </button>

                  <button
                    onClick={() => setIsTransferring(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Transfer to Another Seat
                  </button>

                  <button
                    disabled={loading}
                    onClick={handleVacate}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserMinus className="w-4 h-4" />
                    Vacate Seat
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                    Select New Seat
                  </h5>
                  <select
                    value={selectedNewSeat}
                    onChange={(e) => setSelectedNewSeat(e.target.value ? Number(e.target.value) : '')}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose an available seat...</option>
                    {availableSeats.map((s) => (
                      <option key={s.id} value={s.seatNumber}>
                        Seat #{s.seatNumber}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <button
                      disabled={loading || !selectedNewSeat}
                      onClick={handleTransfer}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Moving...' : 'Confirm Move'}
                    </button>
                    <button
                      onClick={() => setIsTransferring(false)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 text-center space-y-2">
                <span className="inline-block p-3 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArmchairIcon className="w-6 h-6" />
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">This Seat is Ready</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                  Seat #{seat.seatNumber} is currently vacant and can be allocated to an active student.
                </p>
              </div>

              {!isAssigning ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setIsAssigning(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 shadow-sm transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign Active Student
                  </button>

                  <button
                    onClick={() => onRegisterNewStudentForSeat(seat.seatNumber)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Register New Student to this Seat
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                    Select Unassigned Active Student
                  </h5>
                  {unassignedStudents.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      There are no unassigned active students right now. You can register a new student directly.
                    </p>
                  ) : (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a student...</option>
                      {unassignedStudents.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.mobile})
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex gap-2">
                    {unassignedStudents.length > 0 && (
                      <button
                        disabled={loading || !selectedStudentId}
                        onClick={handleAssign}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Assigning...' : 'Assign Seat'}
                      </button>
                    )}
                    <button
                      onClick={() => setIsAssigning(false)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArmchairIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0z" />
    <path d="M5 18v3" />
    <path d="M19 18v3" />
  </svg>
);
