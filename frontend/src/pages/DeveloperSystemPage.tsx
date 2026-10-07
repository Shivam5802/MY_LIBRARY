import React, { useEffect, useState } from 'react';
import { developerService } from '../services/developer.service';
import type { SystemInfoData, DataIntegrityReport } from '../types/auth';
import {
  Server,
  Database,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  HardDrive,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const DeveloperSystemPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [integrityReport, setIntegrityReport] = useState<DataIntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sysRes, intRes] = await Promise.all([
        developerService.getSystemInfo(),
        developerService.getIntegrityReport(),
      ]);
      setSystemInfo(sysRes);
      setIntegrityReport(intRes);
    } catch (err: any) {
      console.error('Failed to load system data:', err);
      setError(err.message || 'Failed to load system diagnostics.');
    } finally {
      setIsLoading(false);
    }
  };

  const rerunIntegrityCheck = async () => {
    try {
      setIsCheckingIntegrity(true);
      const report = await developerService.getIntegrityReport();
      setIntegrityReport(report);
    } catch (err: any) {
      console.error('Integrity check failed:', err);
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-400">Inspecting Database &amp; System Health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-300">{error}</p>
        <button
          onClick={fetchSystemData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            System Architecture &amp; Data Health
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Real-time backend diagnostic telemetry, database statistics, and non-destructive data integrity verification.
          </p>
        </div>

        <button
          onClick={fetchSystemData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer w-fit transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          Refresh Status
        </button>
      </div>

      {/* System Telemetry Cards */}
      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database Health Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Database Engine
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                {systemInfo.database.status}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">PostgreSQL</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Latency: <strong className="text-slate-700 dark:text-slate-300">{systemInfo.database.responseTimeMs} ms</strong> ping
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              Timezone: {systemInfo.timezone}
            </p>
          </div>

          {/* Backend Health Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Backend Runtime
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                {systemInfo.backend.status}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Node.js Express</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Version: <strong className="text-slate-700 dark:text-slate-300">{systemInfo.backend.nodeVersion}</strong>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              Uptime: {Math.floor(systemInfo.backend.uptimeSeconds / 60)} minutes
            </p>
          </div>

          {/* Environment Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Application
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold uppercase">
                {systemInfo.environment}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{systemInfo.application}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Capacity: <strong className="text-slate-900 dark:text-white">92 Assigned Seats</strong>
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
              Checked: {new Date(systemInfo.lastChecked).toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Database Entity Counts */}
      {systemInfo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Database Entity Volume
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Seats</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{systemInfo.counts.totalSeats}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Occupied Seats</span>
              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{systemInfo.counts.occupiedSeats}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Students</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{systemInfo.counts.activeStudents}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Archived Students</span>
              <p className="text-base font-bold text-slate-600 dark:text-slate-400 mt-0.5">{systemInfo.counts.archivedStudents}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Payments</span>
              <p className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">{systemInfo.counts.paymentRecords}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Audit Logs</span>
              <p className="text-base font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">{systemInfo.counts.activityLogs}</p>
            </div>
          </div>
        </div>
      )}

      {/* DATA INTEGRITY DIAGNOSTIC SUITE */}
      {integrityReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Integrity Diagnostic Suite</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${
                    integrityReport.overallStatus === 'PASS'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                      : integrityReport.overallStatus === 'WARNING'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                  }`}
                >
                  {integrityReport.overallStatus}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Verified 9 critical invariants: seat assignments, duplicate cycles, student relationships, and payment thresholds.
              </p>
            </div>

            <button
              onClick={rerunIntegrityCheck}
              disabled={isCheckingIntegrity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer w-fit"
            >
              {isCheckingIntegrity ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Run Diagnostics
            </button>
          </div>

          {integrityReport.issues.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">All 9 Data Invariants Passed Perfectly</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Zero orphan payments, no duplicate billing periods, exactly 92 registered seats, and no conflicting seat allocations found.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {integrityReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    issue.severity === 'ERROR'
                      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                      : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                  }`}
                >
                  {issue.severity === 'ERROR' ? (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{issue.category} &bull; {issue.id}</span>
                      <span
                        className={`text-[10px] font-black uppercase ${
                          issue.severity === 'ERROR' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{issue.description}</p>
                    {issue.details && (
                      <pre className="mt-2 p-2 rounded bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-400 overflow-x-auto">
                        {JSON.stringify(issue.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
