import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudentService } from '../services/student.service';
import { SeatService } from '../services/seat.service';
import type { SeatWithStudent } from '../types/auth';
import { SeatStatus } from '../types/auth';
import { StudentForm } from '../components/StudentForm';
import { ArrowLeft, UserPlus } from 'lucide-react';

export const AddStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSeat = searchParams.get('seat') ? Number(searchParams.get('seat')) : undefined;

  const [availableSeats, setAvailableSeats] = useState<SeatWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const allSeats = await SeatService.getAllSeats();
        setAvailableSeats(allSeats.filter((s) => s.status === SeatStatus.AVAILABLE));
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, []);

  const handleSubmit = async (values: any) => {
    const created = await StudentService.createStudent(values);
    navigate(`/owner/students/${created.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Register Student
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Admit a new student into MY LIBRARY with their permanent unique ID.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm sm:shadow-xl">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <StudentForm
            initialValues={{ seatNumber: preselectedSeat }}
            availableSeats={availableSeats}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/owner/students')}
          />
        )}
      </div>
    </div>
  );
};
