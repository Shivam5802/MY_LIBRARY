import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (user?.role === Role.OWNER) {
      navigate('/owner', { replace: true });
    } else if (user?.role === Role.DEVELOPER) {
      navigate('/developer', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You do not have the required permissions to access this area. Your current role is restricted from viewing this resource.
        </p>

        {user && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 mb-6 text-xs text-left font-mono">
            <div className="text-slate-400">Current User: <span className="text-slate-200">{user.username}</span></div>
            <div className="text-slate-400">Current Role: <span className="text-amber-400 font-bold">{user.role}</span></div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReturn}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return to Authorized Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
