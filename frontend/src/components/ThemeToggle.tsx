import React, { useState, useRef, useEffect } from 'react';
import { useTheme, type Theme } from '../context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  align?: 'left' | 'right';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  align = 'right',
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ];

  const CurrentIcon =
    theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current theme: ${theme}. Click to switch theme.`}
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        className="flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <CurrentIcon className="w-4 h-4 shrink-0 transition-transform hover:scale-110" />
        {showLabel && (
          <span className="text-xs font-semibold capitalize hidden sm:inline">
            {theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-36 rounded-2xl shadow-xl z-50 py-1.5 border transition-all animate-fade-in bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200`}
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Appearance
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
