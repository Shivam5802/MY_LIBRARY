import React from 'react';
import { FileText, Clock } from 'lucide-react';

export const ReportsPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
        <FileText className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white">Reports &amp; Analytics</h3>
        <p className="text-xs text-slate-400">
          Scheduled for Prompt 3 and Prompt 4.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
          <Clock className="w-4 h-4" /> Upcoming Reporting Features:
        </div>
        <p>• Daily and monthly seat collection summaries</p>
        <p>• Due and overdue recurring fees based on admission dates</p>
        <p>• Automated 5-day fee reminder schedules &amp; WhatsApp logs</p>
        <p>• Exportable student rosters and occupancy trends</p>
      </div>
    </div>
  );
};
