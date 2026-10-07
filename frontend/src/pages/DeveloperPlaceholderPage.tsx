import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, LogOut, User as UserIcon, Shield, Database } from 'lucide-react';

export const DeveloperPlaceholderPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">MY LIBRARY</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              DEVELOPER CONSOLE
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
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Terminal className="w-8 h-8 text-indigo-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">DEVELOPER AREA</h2>
          <p className="text-slate-400 text-sm mb-6">
            Developer authorization verified. Protected endpoints and role-guard working as intended.
          </p>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left space-y-3 mb-6 font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-500" /> Account:
              </span>
              <span className="text-indigo-300 font-semibold">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" /> Role:
              </span>
              <span className="text-indigo-400 font-bold">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" /> API Scope:
              </span>
              <span className="text-emerald-400">Full System &amp; Income Analytics Access</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed bg-slate-950/30 p-3 rounded-lg border border-slate-800/60">
            <strong>Upcoming Developer Modules:</strong> System telemetry, aggregated revenue reports, backup snapshots, and security audit logs.
          </div>
        </div>
      </main>
    </div>
  );
};
