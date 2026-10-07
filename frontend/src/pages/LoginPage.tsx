import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiClientError } from '../services/api';
import { Role } from '../types/auth';
import { ThemeToggle } from '../components/ThemeToggle';
import { BookOpen, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Please enter your username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(trimmedUsername, password);
      
      // Determine redirection target
      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (fromPath && fromPath !== '/login' && fromPath !== '/unauthorized') {
        navigate(fromPath, { replace: true });
        return;
      }

      if (user.role === Role.OWNER) {
        navigate('/owner', { replace: true });
      } else if (user.role === Role.DEVELOPER) {
        navigate('/developer', { replace: true });
      } else {
        navigate('/unauthorized', { replace: true });
      }
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors">
      {/* Theme Toggle Top-Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shadow-inner text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          MY LIBRARY
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Sign in to access the management portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10 transition-colors">
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-300 text-sm"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System access restricted to authorized Library Owner &amp; Developer personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
