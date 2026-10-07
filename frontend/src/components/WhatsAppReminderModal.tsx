import React, { useState, useEffect } from 'react';
import { BillingService } from '../services/billing.service';
import { MessageSquare, X, Send, AlertCircle } from 'lucide-react';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  studentId: string;
  studentName: string;
  mobile: string;
  billingPeriodId: string;
  onClose: () => void;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  studentId,
  studentName,
  mobile,
  billingPeriodId,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [normalizedMobile, setNormalizedMobile] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openedNotice, setOpenedNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOpenedNotice(false);
      return;
    }

    const prepare = async () => {
      setLoading(true);
      setErrorMsg(null);
      setOpenedNotice(false);
      try {
        const data = await BillingService.prepareWhatsAppReminder(
          studentId,
          billingPeriodId
        );
        setNormalizedMobile(data.normalizedMobile);
        setMessage(data.formattedMessage);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to prepare WhatsApp message.');
      } finally {
        setLoading(false);
      }
    };

    prepare();
  }, [isOpen, studentId, billingPeriodId]);

  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    const rawNumber = normalizedMobile.replace(/^\+/, '');
    const encodedText = encodeURIComponent(message);
    const url = `https://wa.me/${rawNumber}?text=${encodedText}`;

    // Open WhatsApp Click-to-chat
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenedNotice(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Send WhatsApp Fee Reminder</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click-to-chat with {studentName}</p>
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
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Preparing personalized message...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Recipient Details */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{studentName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 block">Normalized Mobile:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                  {normalizedMobile || mobile}
                </span>
              </div>
            </div>

            {/* Editable Message Preview */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5 text-[11px]">
                Message Preview (You may edit before opening WhatsApp):
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-750 text-slate-900 dark:text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {openedNotice && (
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  WhatsApp Web or App opened in a new tab. Delivery status is managed directly by WhatsApp.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-750 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 shadow-md transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Open WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
