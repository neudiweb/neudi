import { Link, useLocation } from 'react-router-dom';
import * as React from 'react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-surface)]/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Neudi
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className={`text-sm ${location.pathname === '/dashboard' ? 'font-medium text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'} transition-colors`}
            >
              Demo Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-[var(--color-text-secondary)]">
          &copy; {new Date().getFullYear()} Neudi &mdash; Turnos para tu negocio.
        </div>
      </footer>
    </div>
  );
}
