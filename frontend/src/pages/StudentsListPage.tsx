import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { StudentService } from '../services/student.service';
import { SeatService } from '../services/seat.service';
import type { StudentWithSeat, SeatWithStudent } from '../types/auth';
import { Shift, Locker, StudentStatus } from '../types/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Eye,
  ArrowRightLeft,
  UserMinus,
  Archive,
  RotateCcw,
  Phone,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithSeat[]>([]);
  const [availableSeats, setAvailableSeats] = useState<SeatWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>(StudentStatus.ACTIVE);
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [lockerFilter, setLockerFilter] = useState<Locker | ''>('');
  const [seatFilter, setSeatFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Dialog actions state
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

  // Transfer modal quick state
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    student: StudentWithSeat | null;
    targetSeatNumber: number | '';
  }>({ isOpen: false, student: null, targetSeatNumber: '' });

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const hasSeat =
        seatFilter === 'ASSIGNED' ? true : seatFilter === 'UNASSIGNED' ? false : undefined;

      const [data, allSeats] = await Promise.all([
        StudentService.getStudents({
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          shift: shiftFilter || undefined,
          locker: lockerFilter || undefined,
          hasSeat,
        }),
        SeatService.getAllSeats(),
      ]);

      setStudents(data);
      setAvailableSeats(allSeats.filter((s) => s.status === 'AVAILABLE'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch students.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, shiftFilter, lockerFilter, seatFilter]);

  const handleVacate = (student: StudentWithSeat) => {
    if (!student.currentSeat) return;
    setDialogConfig({
      isOpen: true,
      title: 'Vacate Seat Assignment',
      message: `Vacate Seat #${student.currentSeat.seatNumber} currently assigned to ${student.name}? The student will remain ACTIVE.`,
      confirmLabel: 'Vacate Seat',
      isDestructive: true,
      action: async () => {
        await SeatService.vacateSeat(student.currentSeat!.seatNumber);
        await loadData();
      },
    });
  };

  const handleArchive = (student: StudentWithSeat) => {
    setDialogConfig({
      isOpen: true,
      title: 'Archive Student Record',
      message: `Archive ${student.name}? Their record and history will be preserved, but any assigned seat will immediately be released.`,
      confirmLabel: 'Archive Student',
      isDestructive: true,
      action: async () => {
        await StudentService.archiveStudent(student.id);
        await loadData();
      },
    });
  };

  const handleRestore = (student: StudentWithSeat) => {
    setDialogConfig({
      isOpen: true,
      title: 'Restore Student Record',
      message: `Restore ${student.name} to ACTIVE status? They will be restored as unassigned.`,
      confirmLabel: 'Restore Student',
      isDestructive: false,
      action: async () => {
        await StudentService.restoreStudent(student.id);
        await loadData();
      },
    });
  };

  const handleDelete = (student: StudentWithSeat) => {
    setDialogConfig({
      isOpen: true,
      title: 'Delete Student Record Permanently',
      message: `Are you sure you want to permanently remove ${student.name}? This will vacate their seat and remove all their data from the static database.`,
      confirmLabel: 'Remove Student',
      isDestructive: true,
      action: async () => {
        await StudentService.deleteStudent(student.id);
        await loadData();
      },
    });
  };

  const handleExecuteTransfer = async () => {
    if (!transferModal.student || !transferModal.targetSeatNumber) return;
    try {
      await SeatService.transferSeat(
        transferModal.student.id,
        Number(transferModal.targetSeatNumber)
      );
      setTransferModal({ isOpen: false, student: null, targetSeatNumber: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer seat.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(StudentStatus.ACTIVE);
    setShiftFilter('');
    setLockerFilter('');
    setSeatFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Students Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage student registrations, seat assignments, shifts, and lockers.
          </p>
        </div>

        <NavLink
          to="/owner/students/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-indigo-900/20 shadow-md transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Register Student
        </NavLink>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Status: All</option>
              <option value={StudentStatus.ACTIVE}>Active</option>
              <option value={StudentStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          {/* Shift */}
          <div>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Shift: All</option>
              <option value={Shift.FULL_DAY}>Full Day</option>
              <option value={Shift.MORNING}>Morning</option>
              <option value={Shift.EVENING}>Evening</option>
            </select>
          </div>

          {/* Locker */}
          <div>
            <select
              value={lockerFilter}
              onChange={(e) => setLockerFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-750 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Locker: All</option>
              <option value={Locker.WITH_LOCKER}>With Locker</option>
              <option value={Locker.WITHOUT_LOCKER}>Without Locker</option>
            </select>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Seat Filter:</span>
            <button
              onClick={() => setSeatFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                seatFilter === 'ALL'
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeatFilter('ASSIGNED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                seatFilter === 'ASSIGNED'
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Seated
            </button>
            <button
              onClick={() => setSeatFilter('UNASSIGNED')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                seatFilter === 'UNASSIGNED'
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Unassigned
            </button>
          </div>

          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Student List View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-base font-bold text-slate-900 dark:text-white">No students found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No student matches the current filter or search criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-2 inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Seat</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Locker</th>
                  <th className="py-3 px-4">Admission</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {students.map((student) => {
                  const isArchived = student.status === StudentStatus.ARCHIVED;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-500 dark:text-slate-400">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{student.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: {student.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {student.currentSeat ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs">
                            #{student.currentSeat.seatNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{student.mobile}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {student.shift.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {student.locker === Locker.WITH_LOCKER ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Yes</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{formatDate(student.admissionDate)}</div>
                        {student.feeCycleStartDate && student.feeCycleStartDate !== student.admissionDate && (
                          <div className="text-[10px] text-indigo-500">Cycle: {formatDate(student.feeCycleStartDate)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">
                        ₹{student.monthlyFee.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/owner/students/${student.id}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isArchived ? (
                            <>
                              <button
                                onClick={() =>
                                  setTransferModal({
                                    isOpen: true,
                                    student,
                                    targetSeatNumber: '',
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                                title="Change/Assign Seat"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              {student.currentSeat && (
                                <button
                                  onClick={() => handleVacate(student)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                                  title="Vacate Seat"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleArchive(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Archive Student"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Student Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                title="Restore Student"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Student Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-3">
            {students.map((student) => {
              const isArchived = student.status === StudentStatus.ARCHIVED;
              return (
                <div
                  key={student.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-slate-500 dark:text-slate-400">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" /> {student.mobile}
                        </p>
                      </div>
                    </div>

                    {student.currentSeat ? (
                      <span className="px-2.5 py-1 rounded-xl font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs">
                        Seat #{student.currentSeat.seatNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs italic">No Seat</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Shift:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {student.shift.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Locker:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {student.locker === Locker.WITH_LOCKER ? 'Included' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Admission:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(student.admissionDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Monthly Fee:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{student.monthlyFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => navigate(`/owner/students/${student.id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                    {!isArchived ? (
                      <>
                        <button
                          onClick={() =>
                            setTransferModal({
                              isOpen: true,
                              student,
                              targetSeatNumber: '',
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 transition-colors cursor-pointer"
                        >
                          Seat
                        </button>
                        <button
                          onClick={() => handleArchive(student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer"
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 transition-colors cursor-pointer"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
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

      {/* Quick Seat Assignment / Transfer Modal */}
      {transferModal.isOpen && transferModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {transferModal.student.currentSeat ? 'Transfer Seat' : 'Assign Seat'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Student: <strong className="text-slate-900 dark:text-white">{transferModal.student.name}</strong>
              {transferModal.student.currentSeat && (
                <> (Current: #{transferModal.student.currentSeat.seatNumber})</>
              )}
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Target Available Seat
              </label>
              <select
                value={transferModal.targetSeatNumber}
                onChange={(e) =>
                  setTransferModal((prev) => ({
                    ...prev,
                    targetSeatNumber: e.target.value ? Number(e.target.value) : '',
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Choose an available seat...</option>
                {availableSeats.map((s) => (
                  <option key={s.id} value={s.seatNumber}>
                    Seat #{s.seatNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() =>
                  setTransferModal({ isOpen: false, student: null, targetSeatNumber: '' })
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!transferModal.targetSeatNumber}
                onClick={handleExecuteTransfer}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
