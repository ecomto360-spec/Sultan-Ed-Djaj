import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemePreference } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: t.themeLight,
      icon: <Sun className="w-4 h-4 text-amber-500 shrink-0" />,
    },
    {
      value: 'dark',
      label: t.themeDark,
      icon: <Moon className="w-4 h-4 text-orange-400 shrink-0" />,
    },
    {
      value: 'auto',
      label: t.themeAuto,
      icon: <Laptop className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />,
    },
  ];

  // Quick cycle when clicking directly on compact button
  const handleQuickToggle = () => {
    if (theme === 'auto') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const currentIcon =
    theme === 'auto' ? (
      <Laptop className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="w-4 h-4 text-orange-400 shrink-0" />
    ) : (
      <Sun className="w-4 h-4 text-amber-600 shrink-0" />
    );

  const currentLabel =
    theme === 'auto' ? t.themeAuto : theme === 'dark' ? t.themeDark : t.themeLight;

  if (variant === 'full') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">{t.themeLabel}</span>
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">{currentLabel}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-zinc-200/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-300 dark:border-zinc-700/60 shadow-inner">
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm border border-zinc-300/60 dark:border-zinc-600'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40'
                }`}
                aria-label={`${t.themeLabel}: ${opt.label}`}
                title={opt.label}
              >
                {opt.icon}
                <span className="text-[11px] leading-tight truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown / Popover variant (or click to open choice, right click or long press, or simple dropdown trigger)
  return (
    <div className={`relative inline-block text-start ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label={t.themeToggleAria}
        title={`${t.themeLabel}: ${currentLabel}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 ${
            isArabic ? 'left-0' : 'right-0'
          } z-50 w-44 p-1.5 bg-white dark:bg-[#18181c] rounded-2xl border border-zinc-200 dark:border-zinc-700/80 shadow-xl shadow-black/10 dark:shadow-black/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
            {t.themeLabel}
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
