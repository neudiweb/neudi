import * as React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAgendaData, type AgendaAppointment } from '../../hooks/useAgendaData';
import {
  parseLocalDate,
  BUSINESS_TIMEZONE,
  addDaysToDate,
} from '../../utils/helpers';
import type { AppointmentStatusLower } from '../../types/index';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const STATUS_COLORS: Record<string, { light: string; dark: string; bg: string; darkBg: string }> = {
  confirmed: {
    light: 'text-blue-700',
    dark: 'text-blue-300',
    bg: 'bg-blue-500',
    darkBg: 'bg-blue-600',
  },
  completed: {
    light: 'text-green-700',
    dark: 'text-green-300',
    bg: 'bg-green-500',
    darkBg: 'bg-green-600',
  },
  pending: {
    light: 'text-yellow-700',
    dark: 'text-yellow-300',
    bg: 'bg-yellow-500',
    darkBg: 'bg-yellow-600',
  },
  requires_deposit: {
    light: 'text-zinc-700',
    dark: 'text-zinc-300',
    bg: 'bg-zinc-500',
    darkBg: 'bg-zinc-600',
  },
  cancelled: {
    light: 'text-red-700',
    dark: 'text-red-300',
    bg: 'bg-red-500',
    darkBg: 'bg-red-600',
  },
  rejected: {
    light: 'text-red-700',
    dark: 'text-red-300',
    bg: 'bg-red-600',
    darkBg: 'bg-red-700',
  },
  no_show: {
    light: 'text-zinc-700',
    dark: 'text-zinc-300',
    bg: 'bg-zinc-500',
    darkBg: 'bg-zinc-600',
  },
  expired: {
    light: 'text-zinc-700',
    dark: 'text-zinc-300',
    bg: 'bg-zinc-600',
    darkBg: 'bg-zinc-700',
  },
};

const STATUS_BORDER_COLORS: Record<string, { light: string; dark: string }> = {
  confirmed: { light: 'border-blue-500/30', dark: 'border-blue-400/30' },
  completed: { light: 'border-green-500/30', dark: 'border-green-400/30' },
  pending: { light: 'border-yellow-500/30', dark: 'border-yellow-400/30' },
  requires_deposit: { light: 'border-zinc-500/30', dark: 'border-zinc-400/30' },
  cancelled: { light: 'border-red-500/30', dark: 'border-red-400/30' },
  rejected: { light: 'border-red-500/30', dark: 'border-red-400/30' },
  no_show: { light: 'border-zinc-500/30', dark: 'border-zinc-400/30' },
  expired: { light: 'border-zinc-500/30', dark: 'border-zinc-400/30' },
};

interface TimelineViewProps {
  appointmentsByDate: Record<string, AgendaAppointment[]>;
  calendarCountByDate: Record<string, number>;
  calendarPendingCountByDate: Record<string, number>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onMonthChange: (date: string) => void;
  filterStatus: string;
  searchQuery: string;
  setFilterStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  STATUS_LABELS: Record<string, string>;
  bizTimezone: string;
  selectedAppointment: {
    id: string;
    clientName: string;
    clientPhone: string;
    service: string;
    services: string[];
    serviceNames: string;
    date: string;
    time: string;
    endTime: string;
    totalDuration: number;
    totalPrice: number;
    status: AppointmentStatusLower;
    requiresDeposit: boolean;
    serviceId?: string;
  } | null;
  setSelectedAppointment: (apt: {
    id: string;
    clientName: string;
    clientPhone: string;
    service: string;
    services: string[];
    serviceNames: string;
    date: string;
    time: string;
    endTime: string;
    totalDuration: number;
    totalPrice: number;
    status: AppointmentStatusLower;
    requiresDeposit: boolean;
    serviceId?: string;
  } | null) => void;
  todayStr: string;
  formatMonthLabel: (dateStr: string) => string;
  navigateDate: (dir: number) => void;
  goToday: () => void;
  activeTheme: 'light' | 'dark';
}

function getMonthDays(year: number, month: number, todayStr: string): Array<{
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}> {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days: Array<{
    date: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthLast.getDate() - i;
    const pm = month - 1 < 0 ? 11 : month - 1;
    const py = month - 1 < 0 ? year - 1 : year;
    const dateStr = `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: false,
    });
  }

  // Current month
  for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: false,
    });
  }

  // Next month padding
  const totalCells = Math.ceil(days.length / 7) * 7;
  for (let i = 1; days.length < totalCells; i++) {
    const nm = month + 1;
    const ny = nm > 11 ? year + 1 : year;
    const actualMonth = nm > 11 ? 0 : nm;
    const dateStr = `${ny}-${String(actualMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      day: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: false,
    });
  }

  return days;
}

export function TimelineView({
  appointmentsByDate,
  calendarCountByDate,
  calendarPendingCountByDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  filterStatus,
  searchQuery,
  setFilterStatus,
  setSearchQuery,
  STATUS_LABELS,
  bizTimezone,
  selectedAppointment,
  setSelectedAppointment,
  todayStr,
  formatMonthLabel,
  navigateDate,
  goToday,
  activeTheme,
}: TimelineViewProps) {
  const isDark = activeTheme === 'dark';

  // Derive view year/month directly from selectedDate — no state lag
  const viewDate = new Date(selectedDate + 'T00:00:00');
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const navigateMonth = React.useCallback(
    (dir: number) => {
      let newYear = viewYear;
      let newMonth = viewMonth + dir;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      else if (newMonth > 11) { newMonth = 0; newYear++; }
      const firstDay = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-01`;
      onMonthChange(firstDay);
    },
    [viewYear, viewMonth, onMonthChange]
  );

  const monthDays = React.useMemo(() => {
    const days = getMonthDays(viewYear, viewMonth, todayStr);
    return days.map(d => ({ ...d, isSelected: d.date === selectedDate }));
  }, [viewYear, viewMonth, selectedDate, todayStr]);

  const isMobile = React.useRef(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => {
      isMobile.current = window.innerWidth < 1024;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredAppointments = React.useMemo(() => {
    const apts = appointmentsByDate[selectedDate] || [];
    return apts.filter((apt) => {
      if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          apt.clientName.toLowerCase().includes(q) ||
          apt.serviceNames.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appointmentsByDate, selectedDate, filterStatus, searchQuery]);

  const handleDayClick = React.useCallback(
    (date: string) => {
      onDateSelect(date);
    },
    [onDateSelect]
  );

  const handleAppointmentClick = React.useCallback(
    (apt: AgendaAppointment) => {
      setSelectedAppointment({
        ...apt,
        service: apt.serviceNames.split(' + ')[0] || apt.serviceNames,
        services: apt.serviceNames.split(' + '),
      });
    },
    [setSelectedAppointment]
  );

  const getAppointmentColor = (status: string) => {
    const key = status.toLowerCase().replace(/\s+/g, '_') as string;
    return STATUS_COLORS[key] || STATUS_COLORS.pending;
  };

  // Render calendar grid day cell
  const renderDayCell = (dayInfo: typeof monthDays[0]) => {
    const dayAppointments = appointmentsByDate[dayInfo.date] || [];
    const count = calendarCountByDate[dayInfo.date] || 0;
    const pending = calendarPendingCountByDate[dayInfo.date] || 0;

    const isSelected = dayInfo.isSelected;
    const isToday = dayInfo.isToday;

    return (
      <div
        key={dayInfo.date}
        role="button"
        tabIndex={0}
        onClick={() => handleDayClick(dayInfo.date)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDayClick(dayInfo.date); } }}
        className={`
          relative flex flex-col rounded-xl p-1.5 transition-all duration-200 h-full min-h-[160px] border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500
          ${isSelected
            ? isDark
              ? 'bg-zinc-700/50 border-zinc-500 shadow-md shadow-zinc-500/10'
              : 'bg-zinc-100 border-zinc-400 shadow-md shadow-zinc-400/20'
            : isDark
              ? 'bg-zinc-800/60 border-zinc-700/50 hover:bg-zinc-700/60 hover:border-zinc-600'
              : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
          }
        `}
      >
        {/* Day number */}
        <div className="mb-1">
          <span className={`
            text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg
            ${isToday
              ? isDark
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-900 text-white'
              : isDark
                ? 'text-zinc-400'
                : 'text-zinc-500'
            }
          `}>
            {dayInfo.day}
          </span>
        </div>

        {/* Appointment blocks — grouped by status */}
        {(() => {
          const grouped: Record<string, AgendaAppointment[]> = {};
          for (const apt of dayAppointments) {
            const key = apt.status.toLowerCase().replace(/\s+/g, '_');
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(apt);
          }
          const entries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
          if (entries.length === 0) return null;

          return (
            <div className="flex flex-col gap-0.5 flex-1 justify-center">
              {entries.map(([statusKey, apts]) => {
                const colors = getAppointmentColor(statusKey);
                return (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppointmentClick(apts[0]);
                    }}
                    className={`
                      w-full rounded-lg px-1.5 py-0.5 text-center border transition-all duration-200 hover:opacity-90 hover:scale-[1.02]
                      ${colors.darkBg} ${isDark ? colors.dark : colors.light}
                    `}
                  >
                    <span className="text-sm leading-none font-mono font-bold">{apts.length}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Pending indicator */}
        {pending > 0 && !isSelected && (
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400" />
        )}
      </div>
    );
  };

  // Sidebar appointment item
  const renderSidebarAppointment = (apt: AgendaAppointment) => {
    const colors = getAppointmentColor(apt.status);
    const isSelected = selectedAppointment?.id === apt.id;

    return (
      <button
        key={apt.id}
        onClick={() => handleAppointmentClick(apt)}
        className={`
          w-full text-left rounded-2xl p-4 transition-all duration-200 border
          ${isSelected
            ? isDark
              ? 'border-zinc-500 bg-zinc-700/50 shadow-lg shadow-zinc-500/10 ring-1 ring-zinc-500/20'
              : 'border-zinc-400 bg-zinc-100 shadow-lg shadow-zinc-300/30 ring-1 ring-zinc-500/20'
            : isDark
              ? 'border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600'
              : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Time */}
          <div className="text-right shrink-0 min-w-[55px]">
            <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">{apt.time}</span>
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{apt.endTime}</span>
          </div>

          {/* Color bar */}
          <div className={`w-1 h-10 rounded-full ${colors.bg} shrink-0`} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{apt.clientName}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{apt.serviceNames}</p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>{apt.time} - {apt.endTime}</span>
              <span>·</span>
              <span>{apt.totalDuration} min</span>
              <span>·</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">${apt.totalPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-start sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigateMonth(-1)}
            className={`
              flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 shrink-0
              ${isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
              }
            `}
            aria-label="Mes anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[120px] text-center flex-1 sm:flex-none">
            {formatMonthLabel(selectedDate)}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            className={`
              flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 shrink-0
              ${isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
              }
            `}
            aria-label="Mes siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {selectedDate !== todayStr && (
            <button
              onClick={goToday}
              className={`
                px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap
                ${isDark
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-900 text-white shadow-sm'
                }
              `}
            >
              Hoy
            </button>
          )}
        </div>

        {/* Date label */}
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize whitespace-normal break-words">
          {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }) : ''}
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAY_NAMES_SHORT.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2" style={{ gridAutoRows: '160px' }}>
            {monthDays.map(renderDayCell)}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-[380px] shrink-0">
          {/* Search */}
          <div className="relative mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente o servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border transition-all duration-200
                ${isDark
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
                }
                focus:outline-none focus:ring-2 focus:ring-zinc-500/20
              `}
            />
          </div>

          {/* Status filters */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {['all', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`
                  px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95
                  ${filterStatus === status
                    ? isDark
                      ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                      : 'bg-zinc-900 text-white shadow-sm'
                    : isDark
                      ? 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      : 'bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900'
                  }
                `}
              >
                {status === 'all' ? 'Todos' : STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>

          {/* Appointments list */}
          {filteredAppointments.length === 0 ? (
            <div className={`
              text-center py-12 rounded-2xl border
              ${isDark
                ? 'bg-zinc-800/30 border-zinc-700/50 text-zinc-500'
                : 'bg-zinc-50/50 border-zinc-200 text-zinc-400'
              }
            `}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <p className="text-sm font-semibold">No hay turnos</p>
              <p className="text-xs mt-1 opacity-70">
                {searchQuery || filterStatus !== 'all'
                  ? 'Probá con otros filtros.'
                  : 'No tenés turnos para esta fecha.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAppointments.map(renderSidebarAppointment)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
