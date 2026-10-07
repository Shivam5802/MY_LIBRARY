import React, { useState } from 'react';
import type { BillingPeriodWithPayments } from '../types/auth';
import { PaymentMethod } from '../types/auth';
import { DollarSign, X, AlertCircle, Loader2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  period: BillingPeriodWithPayments | null;
  onClose: () => void;
  onSubmit: (payload: {
    studentId: string;
    billingPeriodId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    reference?: string | null;
    note?: string | null;
  }) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  period,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (period) {
      setAmount(period.outstanding);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);
    }
  }, [period]);

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    if (numericAmount > period.outstanding + 0.001) {
      setErrorMsg(
        `Payment cannot exceed the outstanding balance of ₹${period.outstanding.toLocaleString('en-IN')}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        studentId: period.studentId,
        billingPeriodId: period.id,
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        reference: reference.trim() || null,
        note: note.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Fee Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period.student?.name} {period.student?.seatNumber ? `(Seat #${period.student.seatNumber})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Billing Period Context Details */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Billing Cycle:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {new Date(period.periodStart).toLocaleDateString()} – {new Date(period.periodEnd).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Total Cycle Fee:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ₹{period.amount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Already Paid:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{period.paidAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-850">
            <span className="text-slate-800 dark:text-slate-300 font-bold">Outstanding Balance:</span>
            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
              ₹{period.outstanding.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Payment Amount */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              max={period.outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              disabled={submitting}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Maximum allowed for this cycle is ₹{period.outstanding.toLocaleString('en-IN')}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
                Payment Mode *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={submitting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
              >
                <option value={PaymentMethod.UPI}>UPI (GPay / PhonePe)</option>
                <option value={PaymentMethod.CASH}>Cash</option>
                <option value={PaymentMethod.OTHER}>Other / Bank</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={submitting}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
              Transaction Reference / UPI Ref (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={submitting}
              placeholder="e.g. UPI Ref / Cash memo #..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
              Administrative Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Paid in full for Sept-Oct cycle"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-750 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording...
                </>
              ) : (
                'Confirm & Record Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
