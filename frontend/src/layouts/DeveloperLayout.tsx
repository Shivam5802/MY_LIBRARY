import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  LayoutDashboard,
  IndianRupee,
  FileSpreadsheet,
  Activity,
  Server,
  UserCircle,
  LogOut,
  Terminal,
  Menu,
  X,
} from 'lucide-react';

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

export const DeveloperLayout: React.FC<DeveloperLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/developer', icon: LayoutDashboard },
    { name: 'Income Analytics', path: '/developer/income', icon: IndianRupee },
    { name: 'Reports & Exports', path: '/developer/reports', icon: FileSpreadsheet },
    { name: 'Activity Logs', path: '/developer/activity', icon: Activity },
    { name: 'System & Health', path: '/developer/system', icon: Server },
    { name: 'Profile & Security', path: '/developer/profile', icon: UserCircle },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/developer') return 'Developer Executive Dashboard';
    if (location.pathname === '/developer/income') return 'Income & Revenue Analytics';
    if (location.pathname === '/developer/reports') return 'Data Reports & Export Center';
    if (location.pathname === '/developer/activity') return 'System Audit & Activity Logs';
    if (location.pathname === '/developer/system') return 'System Architecture & Data Health';
    if (location.pathname === '/developer/profile') return 'Developer Profile & Security';
    return 'Developer Administration';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0 font-sans selection:bg-purple-500 selection:text-white transition-colors">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0 h-screen sticky top-0 z-40 transition-colors">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide">MY LIBRARY</h1>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                DEV
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Technical Console</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/developer'
                ? location.pathname === '/developer'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-purple-900/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Developer Info & Logout Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {user?.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || user?.username}</p>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">DEVELOPER</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="hidden md:flex w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 items-center justify-center text-purple-600 dark:text-purple-400">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              API v1 Active
            </span>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Avatar quick link */}
            <NavLink
              to="/developer/profile"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-purple-500 transition-colors"
            >
              {user?.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-5 h-5 text-slate-400" />
              )}
            </NavLink>
          </div>
        </header>

        {/* MOBILE SLIDE-OUT MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 space-y-2 transition-colors">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/developer'
                  ? location.pathname === '/developer'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-600 dark:text-rose-400 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
