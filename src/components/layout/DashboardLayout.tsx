import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentTab?: string;
}

const tabs = [
  { id: 'agenda', label: 'Agenda', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" strokeLinecap="round" />
      <path d="M8 2v4" strokeLinecap="round" />
      <path d="M3 10h18" strokeLinecap="round" />
    </svg>
  )},
  { id: 'services', label: 'Servicios', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
      <rect x="9" y="5" width="6" height="3" rx="1" />
    </svg>
  )},
  { id: 'clients', label: 'Clientes', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )},
  { id: 'hours', label: 'Horarios', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" />
    </svg>
  )},
  { id: 'settings', label: 'Configuración', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )},
];

export function DashboardLayout({ children, currentTab = 'agenda' }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-border-primary)] transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-64' : 'w-[72px]'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--color-border-primary)] shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <>
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                <>
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] flex items-center justify-center shrink-0">
              <span className="text-[var(--color-text-primary)] text-xs font-bold">N</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg tracking-tight text-[var(--color-text-primary)]">Neudi</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/dashboard/${tab.id}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? 'bg-[color-mix(in_srgb,var(--color-accent-500)_12%,transparent)] text-[var(--color-accent-500)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span className="shrink-0 text-[inherit]">
                {tab.icon}
              </span>
              {sidebarOpen && <span>{tab.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[var(--color-border-primary)] shrink-0">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{user?.businessName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{user?.email}</p>
                </div>
              </>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={async () => { await logout(); }}
              className="w-full mt-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,13 20,9 16,5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="20" y1="12" x2="8" y2="12" />
              </svg>
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] flex items-center px-4 gap-3 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] flex items-center justify-center shrink-0">
              <span className="text-[var(--color-text-primary)] text-xs font-bold">N</span>
            </div>
            <span className="font-bold tracking-tight text-[var(--color-text-primary)]">Neudi</span>
          </Link>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
