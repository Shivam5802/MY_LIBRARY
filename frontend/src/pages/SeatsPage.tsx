import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeatService } from '../services/seat.service';
import { StudentService } from '../services/student.service';
import type { SeatWithStudent, StudentWithSeat } from '../types/auth';
import { SeatStatus, StudentStatus } from '../types/auth';
import { SeatGrid } from '../components/SeatGrid';
import { SeatDetailsDrawer } from '../components/SeatDetailsDrawer';
import { Armchair, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';

export const SeatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [seats, setSeats] = useState<SeatWithStudent[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentWithSeat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatWithStudent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedSeats, students] = await Promise.all([
        SeatService.getAllSeats(),
        StudentService.getStudents({ status: StudentStatus.ACTIVE, hasSeat: false }),
      ]);
      setSeats(fetchedSeats);
      setUnassignedStudents(students);

      // Keep drawer in sync if open
      if (selectedSeat) {
        const refreshed = fetchedSeats.find((s) => s.seatNumber === selectedSeat.seatNumber);
        if (refreshed) setSelectedSeat(refreshed);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load seats.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeatClick = (seat: SeatWithStudent) => {
    setSelectedSeat(seat);
    setIsDrawerOpen(true);
  };

  const handleAssignStudent = async (seatNumber: number, studentId: string) => {
    await SeatService.assignSeat(seatNumber, studentId);
    await loadData();
  };

  const handleVacateSeat = async (seatNumber: number) => {
    await SeatService.vacateSeat(seatNumber);
    await loadData();
  };

  const handleTransferSeat = async (studentId: string, newSeatNumber: number) => {
    await SeatService.transferSeat(studentId, newSeatNumber);
    await loadData();
  };

  // Filtered views
  const filteredSeats = seats.filter((s) => {
    if (filterMode === 'AVAILABLE' && s.status !== SeatStatus.AVAILABLE) return false;
    if (filterMode === 'OCCUPIED' && s.status !== SeatStatus.OCCUPIED) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = s.seatNumber.toString().includes(q);
      const matchName = s.currentStudent?.name.toLowerCase().includes(q);
      const matchMobile = s.currentStudent?.mobile.includes(q);
      return matchNumber || matchName || matchMobile;
    }
    return true;
  });

  const availableSeats = seats.filter((s) => s.status === SeatStatus.AVAILABLE);
  const occupiedCount = seats.filter((s) => s.status === SeatStatus.OCCUPIED).length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Armchair className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            92 Seat Hall Layout
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time visual map of all 92 physical seats and current student occupants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            title="Refresh Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Toolbar: Search & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none transition-colors">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seat # or student name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-slate-200 dark:bg-slate-750 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All (92)
          </button>
          <button
            onClick={() => setFilterMode('AVAILABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'AVAILABLE'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                : 'text-emerald-700 dark:text-emerald-400/80 hover:text-emerald-800 dark:hover:text-emerald-300 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Available ({92 - occupiedCount})
          </button>
          <button
            onClick={() => setFilterMode('OCCUPIED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === 'OCCUPIED'
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                : 'text-rose-700 dark:text-rose-400/80 hover:text-rose-800 dark:hover:text-rose-300 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Occupied ({occupiedCount})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 92-Seat Grid Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading seat layout...</p>
        </div>
      ) : filteredSeats.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No seats found matching filter.</p>
          <button
            onClick={() => {
              setFilterMode('ALL');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 shadow-xs dark:shadow-inner transition-colors">
          <SeatGrid
            seats={filteredSeats}
            selectedSeatNumber={selectedSeat?.seatNumber}
            onSelectSeat={handleSeatClick}
          />
        </div>
      )}

      {/* Seat Details Drawer */}
      <SeatDetailsDrawer
        seat={selectedSeat}
        isOpen={isDrawerOpen}
        unassignedStudents={unassignedStudents}
        availableSeats={availableSeats}
        onClose={() => setIsDrawerOpen(false)}
        onAssignStudent={handleAssignStudent}
        onVacateSeat={handleVacateSeat}
        onTransferSeat={handleTransferSeat}
        onViewStudentProfile={(studentId) => {
          setIsDrawerOpen(false);
          navigate(`/owner/students/${studentId}`);
        }}
        onRegisterNewStudentForSeat={(seatNum) => {
          setIsDrawerOpen(false);
          navigate(`/owner/students/new?seat=${seatNum}`);
        }}
      />
    </div>
  );
};
