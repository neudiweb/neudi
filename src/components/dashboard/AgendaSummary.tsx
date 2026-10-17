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
    <div className="flex items-center gap-4 mb-4 overflow-x-auto">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-lg shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <div>
          <span className="text-xs text-[var(--color-text-secondary)]">Hoy</span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{todayCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-lg shrink-0">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div>
          <span className="text-xs text-[var(--color-text-secondary)]">Esta semana</span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{weekCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-warning-50)] border border-[var(--color-warning-100)] rounded-lg shrink-0">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <div>
          <span className="text-xs text-[var(--color-text-secondary)]">Pendientes</span>
          <p className="text-sm font-semibold text-amber-700">{pendingCount}</p>
        </div>
      </div>
    </div>
  );
}
