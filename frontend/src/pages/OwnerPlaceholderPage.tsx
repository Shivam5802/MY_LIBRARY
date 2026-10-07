import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';

export const OwnerPlaceholderPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">MY LIBRARY</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              OWNER PORTAL
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-750 bg-slate-800/80 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl w-full shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">OWNER AREA</h2>
          <p className="text-slate-400 text-sm mb-6">
            Authentication successfully verified. Prompt 1 foundation complete.
          </p>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-500" /> Authenticated User:
              </span>
              <span className="font-mono font-medium text-emerald-300">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" /> Authorized Role:
              </span>
              <span className="font-mono font-semibold text-emerald-400">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" /> Session Started:
              </span>
              <span className="text-slate-300 text-xs">
                {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Active'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-800/60">
            <strong>Upcoming in Prompt 2:</strong> 92-Seat visual map, student admissions, admission-date cycle tracking, and WhatsApp notifications.
          </div>
        </div>
      </main>
    </div>
  );
};
