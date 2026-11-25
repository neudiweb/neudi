import { Input } from '@/components/ui/Input';
import { STATUS_LABELS } from '@/utils/status';
import type { AppointmentStatusLower } from '@/types/index';

interface AgendaFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export function AgendaFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: AgendaFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="relative max-w-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400/50">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <Input
          placeholder="Buscar cliente o servicio..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
              filterStatus === status
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-300/20 dark:shadow-zinc-900/30'
                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            {status === 'all' ? 'Todos' : STATUS_LABELS[status as AppointmentStatusLower]}
          </button>
        ))}
      </div>
    </div>
  );
}
