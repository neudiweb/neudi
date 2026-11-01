import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function BusinessSwitcher() {
  const { user, switchBusiness, isLoading } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState<string | null>(null);

  if (!user?.businesses || user.businesses.length <= 1) return null;

  const current = user.businesses.find(
    (b) => b.businessId === user.businessId
  );

  const handleSwitch = async (businessId: string) => {
    setIsSwitching(businessId);
    const result = await switchBusiness(businessId);
    setIsSwitching(null);
    setIsOpen(false);
    if (!result.error) {
      window.location.href = '/neudi/dashboard/agenda';
    }
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                   bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                   hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Cambiar negocio"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="truncate max-w-[100px] xl:max-w-[150px]">{current?.name || 'Negocio'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-zinc-900
                          border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50
                          overflow-hidden"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Mis negocios ({user.businesses.length})
              </p>
            </div>
            <div className="py-1.5 max-h-60 overflow-y-auto">
              {user.businesses.map((biz) => {
                const isActive = biz.businessId === user.businessId;
                const isSwitchingHere = isSwitching === biz.businessId;
                return (
                  <button
                    key={biz.businessId}
                    onClick={() => handleSwitch(biz.businessId)}
                    disabled={isSwitchingHere || isLoading}
                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between
                                transition-all duration-150
                                ${isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed`}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800'
                          : 'bg-zinc-300 dark:bg-zinc-600'
                      }`} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{biz.name}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 capitalize">{biz.role.toLowerCase()}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 text-emerald-500">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isSwitchingHere ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 animate-spin">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <a
                href="/neudi/onboarding"
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400
                           hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Crear nuevo negocio
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
