import React from 'react';
import type { SeatWithStudent } from '../types/auth';
import { SeatStatus } from '../types/auth';
import { Armchair } from 'lucide-react';

interface SeatGridProps {
  seats: SeatWithStudent[];
  selectedSeatNumber?: number | null;
  onSelectSeat: (seat: SeatWithStudent) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  selectedSeatNumber,
  onSelectSeat,
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2.5 sm:gap-3">
      {seats.map((seat) => {
        const isOccupied = seat.status === SeatStatus.OCCUPIED;
        const isSelected = selectedSeatNumber === seat.seatNumber;

        return (
          <button
            key={seat.id}
            type="button"
            onClick={() => onSelectSeat(seat)}
            aria-label={`Seat ${seat.seatNumber}: ${isOccupied ? `Occupied by ${seat.currentStudent?.name || 'Student'}` : 'Available'}`}
            className={`group relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 cursor-pointer text-left min-h-[90px] sm:min-h-[100px] ${
              isSelected
                ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                : isOccupied
                ? 'border-rose-200 dark:border-rose-500/25 bg-rose-50/70 dark:bg-rose-500/5 hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-100/70 dark:hover:bg-rose-500/10'
                : 'border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/10'
            }`}
          >
            {/* Top row: Seat Number & Status indicator */}
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                #{seat.seatNumber}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full border ${
                  isOccupied
                    ? 'bg-rose-500 border-rose-600 dark:border-rose-400'
                    : 'bg-emerald-500 border-emerald-600 dark:border-emerald-400'
                }`}
                title={isOccupied ? 'Occupied' : 'Available'}
              />
            </div>

            {/* Middle: Icon or Avatar */}
            <div className="my-1 flex items-center justify-center">
              {isOccupied && seat.currentStudent ? (
                seat.currentStudent.photoUrl ? (
                  <img
                    src={seat.currentStudent.photoUrl}
                    alt={seat.currentStudent.name}
                    className="w-7 h-7 rounded-full object-cover border border-rose-300 dark:border-rose-500/40 shadow-xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-[10px] font-bold">
                    {seat.currentStudent.name.charAt(0).toUpperCase()}
                  </div>
                )
              ) : (
                <Armchair className="w-6 h-6 text-emerald-600/70 dark:text-emerald-500/50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors" />
              )}
            </div>

            {/* Bottom: Status Text / Student Name */}
            <div className="w-full text-center truncate">
              {isOccupied && seat.currentStudent ? (
                <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate block w-full">
                  {seat.currentStudent.name.split(' ')[0]}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400/90 uppercase tracking-wider block">
                  Available
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
