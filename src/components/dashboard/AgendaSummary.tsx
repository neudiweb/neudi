interface AgendaSummaryProps {
  todayCount: number;
  weekCount: number;
  pendingCount: number;
}

export function AgendaSummary({
  todayCount,
  weekCount,
  pendingCount,
}: AgendaSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="flex flex-col items-center gap-1.5 px-4 py-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-900 dark:from-zinc-200 dark:to-zinc-400 shadow-sm" />
        <div className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Hoy</span>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{todayCount}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 px-4 py-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-300 dark:to-zinc-500 shadow-sm" />
        <div className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Semana</span>
          <p className="text-xl font-black text-[var(--color-text-primary)]">{weekCount}</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 px-4 py-4 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/30 border border-yellow-300/50 dark:border-yellow-800/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-600 shadow-sm" />
        <div className="text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-800 dark:text-yellow-400">Pendientes</span>
          <p className="text-xl font-black text-yellow-900 dark:text-yellow-300">{pendingCount}</p>
        </div>
      </div>
    </div>
  );
}
