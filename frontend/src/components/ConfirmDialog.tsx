import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDestructive
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-transparent dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-750 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20 shadow-md'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20 shadow-md'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
