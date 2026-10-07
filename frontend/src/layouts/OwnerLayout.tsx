import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  LayoutDashboard,
  Armchair,
  Users,
  FileText,
  UserCircle,
  LogOut,
  Bell,
  BookOpen,
  CreditCard,
} from 'lucide-react';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard },
    { name: 'Seats', path: '/owner/seats', icon: Armchair },
    { name: 'Students', path: '/owner/students', icon: Users },
    { name: 'Fees & Payments', path: '/owner/payments', icon: CreditCard },
    { name: 'Reports', path: '/owner/reports', icon: FileText, placeholder: true },
    { name: 'Profile', path: '/owner/profile', icon: UserCircle },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/owner') return 'Overview Dashboard';
    if (location.pathname === '/owner/seats') return '92 Seat Map';
    if (location.pathname.startsWith('/owner/students/new')) return 'Register New Student';
    if (location.pathname.startsWith('/owner/students/')) return 'Student Profile';
    if (location.pathname === '/owner/students') return 'Student Directory';
    if (location.pathname === '/owner/payments') return 'Fee Register & Payments';
    if (location.pathname === '/owner/reports') return 'System Reports';
    if (location.pathname === '/owner/profile') return 'Owner Profile';
    return 'Owner Console';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row pb-16 md:pb-0 transition-colors">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shrink-0 h-screen sticky top-0 transition-colors">
        {/* Brand */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-white tracking-wide">MY LIBRARY</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">92-Seat Study Hall</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/owner'
                ? location.pathname === '/owner'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-indigo-900/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
                {item.placeholder && (
                  <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Soon
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Owner Info & Logout Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
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
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">OWNER</p>
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
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            {/* Notification placeholder */}
            <button
              type="button"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </button>

            {/* Profile Avatar quick link */}
            <NavLink
              to="/owner/profile"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-colors"
            >
              {user?.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-5 h-5 text-slate-400" />
              )}
            </NavLink>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 transition-colors">
        {navItems
          .filter((item) => !item.placeholder)
          .map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/owner'
                ? location.pathname === '/owner'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px]">{item.name}</span>
              </NavLink>
            );
          })}
      </nav>
    </div>
  );
};
