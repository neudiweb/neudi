import * as React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeToggleVariant = 'auth' | 'landing' | 'pill';

/**
 * Toggle de tema compartido.
 *
 * - `auth` (default): botón redondo fijo (Login/Register).
 * - `landing`: botón landing "Editorial Ledger" (HomePage, sin cambiar el look).
 * - `pill`: botón con etiqueta (DashboardLayout).
 *
 * Reproduce exactamente el markup de las versiones inline originales.
 */
export function ThemeToggle({ variant = 'auth', isDark: isDarkProp }: { variant?: ThemeToggleVariant; isDark?: boolean }) {
  const { activeTheme, setMode } = useTheme();
  const isDark = isDarkProp ?? activeTheme === 'dark';
  const toggle = () => setMode(isDark ? 'light' : 'dark');

  const sunIcon = (className = '') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );

  const moonIcon = (className = '') => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  if (variant === 'pill') {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
      >
        {isDark ? sunIcon() : moonIcon()}
        <span className="hidden xl:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
      </button>
    );
  }

  if (variant === 'landing') {
    return (
      <button
        onClick={toggle}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--lp-hairline-strong)] bg-[var(--lp-surface)] text-[var(--lp-ink-2)] transition-all duration-200 hover:scale-105 hover:text-[var(--lp-accent)]"
      >
        {isDark ? sunIcon() : moonIcon()}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 flex items-center justify-center rounded-full border border-zinc-300/50 dark:border-zinc-700/50 bg-white/90 dark:bg-zinc-900/90 w-10 h-10 shadow-lg shadow-zinc-500/5 dark:shadow-zinc-500/10 backdrop-blur-sm transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? sunIcon('text-zinc-400') : moonIcon('text-zinc-600')}
    </button>
  );
}
