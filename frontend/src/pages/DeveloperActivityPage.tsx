import React, { useEffect, useState } from 'react';
import { developerService } from '../services/developer.service';
import type { ActivityLogRow } from '../types/auth';
import {
  Activity,
  Search,
  Eye,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const DeveloperActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await developerService.getActivityLogs({
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        role: roleFilter || undefined,
        limit: 100,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, actionFilter, roleFilter]);

  const actionColors: Record<string, string> = {
    LOGIN: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    LOGIN_FAILED: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
    PAYMENT_CREATED: 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
    PAYMENT_UPDATED: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    STUDENT_CREATED: 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    STUDENT_UPDATED: 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30',
    STUDENT_ARCHIVED: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    STUDENT_RESTORED: 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30',
    SEAT_ASSIGNED: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
    SEAT_TRANSFERRED: 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30',
    SEAT_VACATED: 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
    WHATSAPP_REMINDER_INITIATED: 'bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30',
    PASSWORD_CHANGED: 'bg-fuchsia-50 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/30',
    DEVELOPER_PROFILE_UPDATED: 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          System Activity &amp; Audit Logs
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Chronological audit trail of all administrative actions, student registrations, seat assignments, and payment adjustments.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, entity ID, metadata or student..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full md:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="PAYMENT_CREATED">PAYMENT_CREATED</option>
          <option value="PAYMENT_UPDATED">PAYMENT_UPDATED</option>
          <option value="STUDENT_CREATED">STUDENT_CREATED</option>
          <option value="STUDENT_UPDATED">STUDENT_UPDATED</option>
          <option value="STUDENT_ARCHIVED">STUDENT_ARCHIVED</option>
          <option value="SEAT_ASSIGNED">SEAT_ASSIGNED</option>
          <option value="SEAT_TRANSFERRED">SEAT_TRANSFERRED</option>
          <option value="SEAT_VACATED">SEAT_VACATED</option>
          <option value="WHATSAPP_REMINDER_INITIATED">WHATSAPP_REMINDER</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">All Roles</option>
          <option value="OWNER">OWNER</option>
          <option value="DEVELOPER">DEVELOPER</option>
        </select>
      </div>

      {/* Audit Log Results */}
      {isLoading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 mx-auto" />
          <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-950/40">
            <span className="text-slate-600 dark:text-slate-400">
              Recorded Events: <strong className="text-slate-900 dark:text-white">{total}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">Showing up to 100 recent entries</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details Summary</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {logs.length > 0 ? (
                  logs.map((log) => {
                    const badgeClass =
                      actionColors[log.action] ||
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {log.userName || log.username || 'System'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.userRole === 'DEVELOPER'
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {log.userRole || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${badgeClass}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {log.studentName
                            ? `Student: ${log.studentName}`
                            : log.entityType || '-'}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {log.metadata ? JSON.stringify(log.metadata) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Inspect Log Entry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No activity logs matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {logs.length > 0 ? (
              logs.map((log) => {
                const badgeClass =
                  actionColors[log.action] ||
                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

                return (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badgeClass}`}>
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>User: <strong className="text-slate-900 dark:text-white">{log.userName || log.username || 'System'}</strong></span>
                      <span className="text-slate-500 dark:text-slate-400">{log.userRole || '-'}</span>
                    </div>

                    {log.studentName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Subject: {log.studentName}</p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                        ID: {log.id.slice(0, 8)}...
                      </span>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">No logs found.</div>
            )}
          </div>
        </div>
      )}

      {/* Log Inspection Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Activity Log Audit Detail</h3>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-sans">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {new Date(selectedLog.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Actor (Username / Role):</span>
                <span className="text-slate-900 dark:text-white">
                  {selectedLog.username || 'System'} ({selectedLog.userRole || 'NONE'})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Entity Type / ID:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedLog.entityType || 'None'} / {selectedLog.entityId || 'None'}
                </span>
              </div>
              {selectedLog.studentName && (
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Student:</span>
                  <span className="text-purple-600 dark:text-purple-300 font-semibold">{selectedLog.studentName}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">IP Address:</span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">{selectedLog.ipAddress || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">User Agent:</span>
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs">{selectedLog.userAgent || 'None'}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Sanitized Metadata:</span>
                <pre className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-purple-700 dark:text-purple-200 overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2) || '{}'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
