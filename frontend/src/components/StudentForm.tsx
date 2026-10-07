import React, { useState } from 'react';
import type { CreateStudentPayload, UpdateStudentPayload } from '../services/student.service';
import type { SeatWithStudent } from '../types/auth';
import { Shift, Locker } from '../types/auth';
import { ImageUpload } from './ImageUpload';
import { Loader2 } from 'lucide-react';

interface StudentFormProps {
  initialValues?: {
    name?: string;
    mobile?: string;
    photoUrl?: string | null;
    shift?: Shift;
    locker?: Locker;
    admissionDate?: string;
    monthlyFee?: number;
    seatNumber?: number | null;
  };
  availableSeats?: SeatWithStudent[];
  isEditMode?: boolean;
  onSubmit: (values: CreateStudentPayload | UpdateStudentPayload) => Promise<void>;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  initialValues,
  availableSeats = [],
  isEditMode = false,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [mobile, setMobile] = useState(initialValues?.mobile || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialValues?.photoUrl || null);
  const [shift, setShift] = useState<Shift>(initialValues?.shift || Shift.FULL_DAY);
  const [locker, setLocker] = useState<Locker>(initialValues?.locker || Locker.WITHOUT_LOCKER);
  const [admissionDate, setAdmissionDate] = useState(
    initialValues?.admissionDate
      ? new Date(initialValues.admissionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [monthlyFee, setMonthlyFee] = useState<number | string>(
    initialValues?.monthlyFee !== undefined ? initialValues.monthlyFee : 1000
  );
  const [seatNumber, setSeatNumber] = useState<number | ''>(
    initialValues?.seatNumber ? initialValues.seatNumber : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Student full name is required.';
    if (!mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^[0-9]{10,12}$/.test(mobile.replace(/[^0-9]/g, ''))) {
      errs.mobile = 'Enter a valid 10-digit mobile number.';
    }
    if (!admissionDate) errs.admissionDate = 'Admission date is required.';
    if (monthlyFee === '' || Number(monthlyFee) < 0) {
      errs.monthlyFee = 'Please enter a valid monthly fee.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        mobile: mobile.trim(),
        photoUrl,
        shift,
        locker,
        admissionDate: admissionDate || new Date().toISOString(),
        monthlyFee: Number(monthlyFee),
      };

      if (!isEditMode && seatNumber !== '') {
        payload.seatNumber = Number(seatNumber);
      }

      await onSubmit(payload);
    } catch (err: any) {
      setErrors({ form: err.message || 'Operation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errors.form}
        </div>
      )}

      {/* Photo Upload */}
      <ImageUpload
        label="Student Photo (Optional)"
        value={photoUrl}
        onChange={setPhotoUrl}
        disabled={isSubmitting}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. 9876543210"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
          {errors.mobile && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.mobile}</p>}
        </div>

        {/* Shift */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Shift *
          </label>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={Shift.FULL_DAY}>Full Day</option>
            <option value={Shift.MORNING}>Morning (6 AM - 2 PM)</option>
            <option value={Shift.EVENING}>Evening (2 PM - 10 PM)</option>
          </select>
        </div>

        {/* Locker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Locker Facility *
          </label>
          <select
            value={locker}
            onChange={(e) => setLocker(e.target.value as Locker)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value={Locker.WITHOUT_LOCKER}>Without Locker</option>
            <option value={Locker.WITH_LOCKER}>With Locker</option>
          </select>
        </div>

        {/* Admission Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Admission Date *
          </label>
          <input
            type="date"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Billing cycles will anchor to this day of the month.
          </p>
          {errors.admissionDate && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.admissionDate}</p>
          )}
        </div>

        {/* Monthly Fee */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Monthly Fee (₹) *
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            disabled={isSubmitting}
            placeholder="1000"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
          />
          {errors.monthlyFee && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.monthlyFee}</p>}
        </div>

        {/* Seat Selection (Only during Add Student; dedicated transfer flow used in edit) */}
        {!isEditMode && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Assign Desk/Seat (Optional)
            </label>
            <select
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value ? Number(e.target.value) : '')}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Do not assign seat now (register unassigned)</option>
              {availableSeats.map((s) => (
                <option key={s.id} value={s.seatNumber}>
                  Seat #{s.seatNumber} (Available)
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              You can assign or transfer a seat anytime later from the 92-seat map.
            </p>
          </div>
        )}
      </div>

      {/* Form Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-750 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 shadow-md transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : isEditMode ? (
            'Update Student Details'
          ) : (
            'Register Student'
          )}
        </button>
      </div>
    </form>
  );
};
