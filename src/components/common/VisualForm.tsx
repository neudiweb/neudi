import * as React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface VisualInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: React.ReactNode;
}

export function VisualInput({ label, icon, className = '', id, ...props }: VisualInputProps) {
  const isDark = useTheme().activeTheme === 'dark';
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className={`block text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused ? 'text-zinc-600' : isDark ? 'text-zinc-500/50' : 'text-zinc-400'}`}>
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`w-full rounded-xl border-2 bg-white/60 dark:bg-emerald-950/30 px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-zinc-500 dark:focus:border-zinc-400 ${icon ? 'pl-12' : ''} ${className}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
    </div>
  );
}

interface VisualButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

export function VisualButton({ variant = 'primary', children, className = '', ...props }: VisualButtonProps) {
  if (variant === 'outline') {
    return (
      <button
        className={`group relative inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-emerald-500/30 bg-white/60 dark:bg-emerald-950/30 px-6 py-3.5 text-sm font-bold text-emerald-700 dark:text-emerald-300 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/60 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-95 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={`group relative inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${className}`}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
