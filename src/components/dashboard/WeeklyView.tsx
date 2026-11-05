import * as React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAgendaData, type AgendaAppointment } from '../../hooks/useAgendaData';
import {
  parseLocalDate,
  BUSINESS_TIMEZONE,
  addDaysToDate,
  getTodayInTimezone,
} from '../../utils/helpers';
import type { AppointmentStatusLower } from '../../types/index';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Professional color palette: softer backgrounds with white text for contrast
const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  confirmed: {
    bg: 'bg-indigo-300 dark:bg-indigo-900',
    text: 'text-indigo-900 dark:text-indigo-100',
    ring: 'ring-indigo-300 dark:ring-indigo-800',
  },
  completed: {
    bg: 'bg-emerald-300 dark:bg-emerald-900',
    text: 'text-emerald-900 dark:text-emerald-100',
    ring: 'ring-emerald-300 dark:ring-emerald-800',
  },
  pending: {
    bg: 'bg-amber-300 dark:bg-amber-900',
    text: 'text-amber-900 dark:text-amber-100',
    ring: 'ring-amber-300 dark:ring-amber-800',
  },
  requires_deposit: {
    bg: 'bg-zinc-300 dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  cancelled: {
    bg: 'bg-zinc-300 dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  rejected: {
    bg: 'bg-zinc-300 dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  no_show: {
    bg: 'bg-zinc-300 dark:bg-zinc-800',
    text: 'text-zinc-900 dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  expired: {
    bg: 'bg-slate-300 dark:bg-slate-800',
    text: 'text-slate-900 dark:text-slate-100',
    ring: 'ring-slate-300 dark:ring-slate-700',
  },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00
const HOUR_HEIGHT = 64; // px per hour

function getTimePosition(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return ((hours - 8) * 60 + minutes) / 60; // hours from 08:00
}

function getTimeHeight(durationMinutes: number): number {
  return (durationMinutes / 60) * HOUR_HEIGHT;
}

// ─── Overlap algorithm (interval partitioning) ───
// Sorts by start time, then greedily assigns each appointment to the
// first column whose last appointment ends before this one starts.
function computeOverlaps(appointments: AgendaAppointment[]): AgendaAppointment[] {
  if (appointments.length === 0) return appointments;

  const sorted = [...appointments].sort((a, b) => {
    const aStart = getTimePosition(a.time);
    const bStart = getTimePosition(b.time);
    return aStart - bStart;
  });

  // Each column: list of appointments + end time of last appointment
  const columns: { apts: AgendaAppointment[]; lastEnd: number }[] = [];

  for (const apt of sorted) {
    const aptStart = getTimePosition(apt.time);
    const aptEnd = aptStart + (apt.totalDuration / 60);

    let placed = false;
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      if (aptStart >= columns[colIdx].lastEnd - 0.01) {
        columns[colIdx].apts.push(apt);
        columns[colIdx].lastEnd = aptEnd;
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push({ apts: [apt], lastEnd: aptEnd });
    }
  }

  // Attach column metadata to each appointment
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (let aptIdx = 0; aptIdx < columns[colIdx].apts.length; aptIdx++) {
      columns[colIdx].apts[aptIdx] = {
        ...columns[colIdx].apts[aptIdx],
        _colIndex: colIdx,
        _colCount: columns.length,
      } as AgendaAppointment & { _colIndex: number; _colCount: number };
    }
  }

  // Flatten back, sorted by start time
  return columns.flatMap(c => c.apts).sort((a, b) => {
    const aStart = getTimePosition(a.time);
    const bStart = getTimePosition(b.time);
    return aStart - bStart;
  });
}

interface WeeklyViewProps {
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
  showPastAppointments: boolean;
}

export function WeeklyView({
  appointmentsByDate,
  calendarCountByDate,
  calendarPendingCountByDate,
  selectedDate,
  onDateSelect,
  filterStatus,
  searchQuery,
  setFilterStatus,
  setSearchQuery,
  STATUS_LABELS,
  bizTimezone,
  selectedAppointment,
  setSelectedAppointment,
  todayStr,
  navigateDate,
  goToday,
  activeTheme,
  showPastAppointments,
}: WeeklyViewProps) {
  const isDark = activeTheme === 'dark';
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute week start (Monday) and week dates using business timezone
  const weekDates = React.useMemo(() => {
    const selected = new Date(selectedDate + 'T00:00:00');
    const selectedDayOfWeek = selected.getDay();
    const mondayOffset = selectedDayOfWeek === 0 ? -6 : 1 - selectedDayOfWeek;
    const monday = new Date(selected);
    monday.setDate(monday.getDate() + mondayOffset);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: bizTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  }, [selectedDate, bizTimezone]);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const weekLabel = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: bizTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(weekEnd + 'T00:00:00');
    const startParts = fmt.formatToParts(start);
    const endParts = fmt.formatToParts(end);
    const startMonth = startParts.find(p => p.type === 'month')?.value || '';
    const endMonth = endParts.find(p => p.type === 'month')?.value || '';
    const startDay = startParts.find(p => p.type === 'day')?.value || '';
    const endDay = endParts.find(p => p.type === 'day')?.value || '';
    const startMonthName = MONTH_NAMES[parseInt(startMonth, 10) - 1];
    const endMonthName = MONTH_NAMES[parseInt(endMonth, 10) - 1];
    const endMonthStr = endMonth === startMonth ? '' : ` ${endMonthName}`;
    return `${startDay} – ${endDay}${endMonthStr} ${startMonthName}`;
  }, [weekStart, weekEnd, bizTimezone]);

  // Pre-calculate filtered appointments for the entire week
  const filteredAppointmentsByDate = React.useMemo(() => {
    // Compute today in the business timezone to ensure consistent comparison
    const localTodayStr = getTodayInTimezone(bizTimezone);
    const result: Record<string, AgendaAppointment[]> = {};
    for (const date of weekDates) {
      const apts = appointmentsByDate[date] || [];
      result[date] = apts.filter((apt) => {
        // Exclude past dates unless showPastAppointments is true
        if (!showPastAppointments && date < localTodayStr) return false;
        // Same day: exclude appointments that already ended unless showPastAppointments is true
        if (date === localTodayStr && !showPastAppointments) {
          const now = new Date();
          const aptEnd = new Date(`${date}T${apt.endTime}:00`);
          if (aptEnd < now) return false;
        }
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
    }
    return result;
  }, [weekDates, appointmentsByDate, filterStatus, searchQuery, bizTimezone, showPastAppointments]);

  const getFilteredAppointments = React.useCallback(
    (date: string) => filteredAppointmentsByDate[date] || [],
    [filteredAppointmentsByDate]
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

  // Navigate to previous/next week
  const navigateWeek = React.useCallback(
    (dir: number) => {
      navigateDate(dir * 7);
    },
    [navigateDate]
  );

  // ─── Render ───
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Header ── */}
      <div className="flex flex-col items-start sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigateWeek(-1)}
            className={`
              flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0
              ${isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
              }
            `}
            aria-label="Semana anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="text-center min-w-[120px] flex-1 sm:flex-none">
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {weekLabel}
            </h2>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
              Vista semanal
            </p>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className={`
              flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0
              ${isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600'
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
              }
            `}
            aria-label="Semana siguiente"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {weekDates.includes(todayStr) || (
            <button
              onClick={goToday}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap
                ${isDark
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800'
                }
              `}
            >
              Hoy
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-2 transition-all duration-200
              ${isDark
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400'
              }
              focus:outline-none focus:ring-2 focus:ring-zinc-500/20
            `}
          />
        </div>
      </div>

      {/* ── Status filters ── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95
              ${filterStatus === status
                ? isDark
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-900 text-white shadow-sm'
                : isDark
                  ? 'bg-zinc-800/60 border-2 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  : 'bg-white border-2 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
              }
            `}
          >
            {status === 'all' ? 'Todos' : STATUS_LABELS[status] || status}
          </button>
        ))}
      </div>

      {/* ── Weekly grid ── */}
      {isMobile ? (
        /* ── Mobile: horizontal scroll per day ── */
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {weekDates.map((date, idx) => {
            const dayAppointments = getFilteredAppointments(date);
            const dayDate = new Date(date + 'T00:00:00');
            const isToday = date === todayStr;
            const isSelected = date === selectedDate;
            const overlaps = computeOverlaps(dayAppointments);

            return (
              <div
                key={date}
                role="button"
                tabIndex={0}
                onClick={() => onDateSelect(date)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDateSelect(date); } }}
                className={`
                  shrink-0 w-[170px] rounded-2xl border-2 p-3 transition-all duration-200 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500
                  ${isSelected
                    ? isDark
                      ? 'bg-zinc-800 border-zinc-500'
                      : 'bg-zinc-50 border-zinc-400'
                    : isDark
                      ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800/80'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50'
                  }
                `}
              >
                {/* Day header */}
                <div className="text-center mb-3">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {DAY_NAMES_SHORT[idx]}
                  </p>
                  <p className={`text-2xl font-bold mt-0.5 ${
                    isToday
                      ? isDark ? 'text-zinc-100' : 'text-zinc-900'
                      : isDark ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    {dayDate.getDate()}
                  </p>
                  {isToday && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 inline-block ${
                      isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
                    }`}>
                      HOY
                    </span>
                  )}
                </div>

                {/* Appointments with overlap handling */}
                {dayAppointments.length === 0 ? (
                  <p className={`text-[11px] text-center py-6 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    Sin turnos
                  </p>
                ) : (
                  <div className="space-y-2">
                    {overlaps.map((apt, overlapIdx) => {
                      const colors = getAppointmentColor(apt.status);
                      const typedApt = apt as AgendaAppointment & { _colIndex?: number; _colCount?: number };
                      const isGrouped = typedApt._colCount !== undefined && typedApt._colCount! > 1;
                      const colCount = typedApt._colCount ?? 1;

                      return (
                        <div
                          key={`${apt.id}-${overlapIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppointmentClick(apt);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              e.preventDefault();
                              handleAppointmentClick(apt);
                            }
                          }}
                          className={`
                            w-full text-left rounded-xl p-2.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500
                            ${colors.bg} ${colors.text}
                            hover:opacity-90 hover:scale-[1.02]
                          `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm">{apt.time}</div>
                              <div className="truncate text-xs opacity-90 mt-0.5 font-medium">
                                {apt.clientName}
                              </div>
                              {apt.totalDuration > 0 && (
                                <div className="text-[10px] opacity-75 mt-0.5">
                                  {apt.totalDuration} min
                                </div>
                              )}
                            </div>
                            {isGrouped && (
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-xs font-bold">{colCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: full grid with overlap columns ── */
        <div className={`
          rounded-2xl border-2 overflow-hidden
          ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}
        `}>
          {/* Day headers */}
          <div className={`
            grid grid-cols-8 border-b-2
            ${isDark ? 'border-zinc-800' : 'border-zinc-200'}
          `}>
            {/* Time column header */}
            <div className={`
              px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center
              ${isDark ? 'text-zinc-500 bg-zinc-800/60' : 'text-zinc-400 bg-zinc-50'}
            `}>
              Hora
            </div>

            {weekDates.map((date, idx) => {
              const dayDate = new Date(date + 'T00:00:00');
              const isToday = date === todayStr;
              const isSelected = date === selectedDate;
              const count = calendarCountByDate[date] || 0;

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onDateSelect(date)}
                  className={`
                    px-3 py-3 text-center transition-all duration-200 border-l-2
                    ${isSelected
                      ? isDark
                        ? 'bg-zinc-800 border-zinc-500'
                        : 'bg-zinc-50 border-zinc-400'
                      : ''
                    }
                  `}
                >
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    {DAY_NAMES_SHORT[idx]}
                  </p>
                  <p className={`text-xl font-bold mt-1 ${
                    isToday
                      ? isDark ? 'text-zinc-100' : 'text-zinc-900'
                      : isDark ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    {dayDate.getDate()}
                  </p>
                  {count > 0 && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1.5 inline-block
                      ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}
                    `}>
                      {count}
                    </span>
                  )}
                  {isToday && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                      isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
                    }`}>
                      HOY
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Time grid + appointments */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={`
                    grid grid-cols-8 border-b
                    ${isDark ? 'border-zinc-800/60' : 'border-zinc-100'}
                  `}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {/* Time label */}
                  <div className={`
                    px-4 py-2 text-[12px] font-semibold
                    ${isDark ? 'text-zinc-500 bg-zinc-800/30' : 'text-zinc-400 bg-zinc-50/50'}
                  `}>
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Day columns (no appointments) */}
                  {weekDates.map((date) => (
                    <div
                      key={date}
                      className={`
                        relative border-l-2
                        ${isDark ? 'border-zinc-800/40' : 'border-zinc-100'}
                      `}
                    />
                  ))}
                </div>
              ))}

              {/* Appointments layer - positioned using CSS grid to match hour rows */}
              <div
                className="grid grid-cols-8 absolute inset-0 pointer-events-none"
                style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
              >
                {/* Time column spacer */}
                <div />
                {/* Day columns with appointments */}
                {weekDates.map((date) => {
                  const dayAppointments = getFilteredAppointments(date);
                  const overlaps = computeOverlaps(dayAppointments);

                  return (
                    <div key={date} className="relative pointer-events-none">
                      {overlaps.map((apt) => {
                        const colors = getAppointmentColor(apt.status);
                        const isSelected = selectedAppointment?.id === apt.id;
                        const typedApt = apt as AgendaAppointment & { _colIndex?: number; _colCount?: number };
                        const colIndex = typedApt._colIndex ?? 0;
                        const colCount = typedApt._colCount ?? 1;
                        const isGrouped = colCount > 1;

                        const topOffset = getTimePosition(apt.time) * HOUR_HEIGHT;
                        const height = Math.max(getTimeHeight(apt.totalDuration), 28);
                        const slotWidth = 100 / colCount;
                        const leftOffset = colIndex * slotWidth;

                        return (
                          <div
                            key={apt.id}
                            onClick={() => handleAppointmentClick(apt)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                handleAppointmentClick(apt);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`
                              absolute rounded-xl px-2 py-1.5 text-xs transition-all duration-200
                              cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500
                              ${colors.bg} ${colors.text}
                              hover:opacity-90 hover:scale-[1.02]
                              z-10 pointer-events-auto
                            `}
                            style={{
                              left: `calc(${leftOffset}% + 2px)`,
                              width: `calc(${slotWidth}% - 4px)`,
                              top: `${Math.max(topOffset, 2)}px`,
                              height: `${height}px`,
                            }}
                          >
                            <div className="font-bold text-xs truncate">{apt.time}</div>
                            {height > 35 && (
                              <div className="truncate text-[10px] opacity-90 font-medium mt-0.5">
                                {apt.clientName}
                              </div>
                            )}
                            {isGrouped && height > 28 && (
                              <div className="text-[10px] opacity-75 font-semibold mt-0.5">
                                +{colCount - 1} más
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
