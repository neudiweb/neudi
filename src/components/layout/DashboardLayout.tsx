import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentTab?: string;
}

const tabs = [
  {
    id: 'agenda',
    label: 'Agenda',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" strokeLinecap="round" />
        <path d="M8 2v4" strokeLinecap="round" />
        <path d="M3 10h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
        <rect x="9" y="5" width="6" height="3" rx="1" />
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'hours',
    label: 'Horarios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const settingsTab = {
  id: 'settings',
  label: 'Configuración',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

function ThemeToggle() {
  const { activeTheme, setMode } = useTheme();
  const isDark = activeTheme === 'dark';

  return (
    <button
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      <span className="hidden xl:inline">{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}

export function DashboardLayout({ children, currentTab = 'agenda' }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-72' : 'w-[72px]'}`}
      >
        {/* Logo section */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors"
            aria-label={sidebarOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center shrink-0 shadow-md shadow-zinc-300/30 dark:shadow-zinc-900/50">
              <span className="text-white dark:text-zinc-900 text-sm font-extrabold">N</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">Neudi</span>
            )}
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="mb-2 px-3">
            {sidebarOpen && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                Menú principal
              </span>
            )}
          </div>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={`/dashboard/${tab.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span
                  className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/10 dark:bg-zinc-900/10 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                  }`}
                >
                  {tab.icon}
                </span>
                {sidebarOpen && <span className="flex-1">{tab.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        {sidebarOpen && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 py-4 px-3">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 px-2 py-2"
            >
              <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500">
                {settingsTab.icon}
              </span>
              <span className="flex-1">{settingsTab.label}</span>
            </Link>
          </div>
        )}

        {/* User section */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-300 dark:to-zinc-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-zinc-300/20 dark:shadow-zinc-900/50">
              {user?.email.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.businessName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={async () => { await logout(); }}
                  className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Cerrar sesión"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,13 20,9 16,5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="20" y1="12" x2="8" y2="12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              aria-label="Abrir menú"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center shrink-0">
                <span className="text-white dark:text-zinc-900 text-xs font-bold">N</span>
              </div>
              <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Neudi</span>
            </Link>
          </div>
          <ThemeToggle />
        </header>

        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <ThemeToggle />
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
