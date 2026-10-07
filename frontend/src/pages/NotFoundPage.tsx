import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Role } from '../types/auth';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user?.role === Role.DEVELOPER) {
      navigate('/developer');
    } else if (user?.role === Role.OWNER) {
      navigate('/owner');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">404 — Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
