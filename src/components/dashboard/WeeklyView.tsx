import * as React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAgendaData, type AgendaAppointment } from '@/hooks/useAgendaData';
import {
  parseLocalDate,
  BUSINESS_TIMEZONE,
  addDaysToDate,
  getTodayInTimezone,
} from '@/utils/dateTime';
import type { AppointmentStatusLower } from '@/types/index';
import { HorizontalView } from '@/components/dashboard/HorizontalView';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Professional color palette: solid vibrant backgrounds with white text
const STATUS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  confirmed: {
    bg: 'bg-blue-500 dark:bg-indigo-900',
    text: 'text-white dark:text-indigo-100',
    ring: 'ring-blue-300 dark:ring-indigo-800',
  },
  completed: {
    bg: 'bg-emerald-500 dark:bg-emerald-900',
    text: 'text-white dark:text-emerald-100',
    ring: 'ring-emerald-300 dark:ring-emerald-800',
  },
  pending: {
    bg: 'bg-amber-500 dark:bg-amber-900',
    text: 'text-white dark:text-amber-100',
    ring: 'ring-amber-300 dark:ring-amber-800',
  },
  requires_deposit: {
    bg: 'bg-zinc-500 dark:bg-zinc-800',
    text: 'text-white dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  cancelled: {
    bg: 'bg-zinc-500 dark:bg-zinc-800',
    text: 'text-white dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  rejected: {
    bg: 'bg-zinc-500 dark:bg-zinc-800',
    text: 'text-white dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  no_show: {
    bg: 'bg-zinc-500 dark:bg-zinc-800',
    text: 'text-white dark:text-zinc-100',
    ring: 'ring-zinc-300 dark:ring-zinc-700',
  },
  expired: {
    bg: 'bg-slate-500 dark:bg-slate-800',
    text: 'text-white dark:text-slate-100',
    ring: 'ring-slate-300 dark:ring-slate-700',
  },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00
const HOUR_HEIGHT = 64; // px per hour

function getTimePosition(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60 + minutes) / 60; // hours from 00:00
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
    createdAt?: string;
    updatedAt?: string;
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
    createdAt?: string;
    updatedAt?: string;
    serviceId?: string;
  } | null) => void;
  todayStr: string;
  formatMonthLabel: (dateStr: string) => string;
  navigateDate: (dir: number) => void;
  goToday: () => void;
  activeTheme: 'light' | 'dark';
  showPastAppointments: boolean;
  setShowPastAppointments: (val: boolean) => void;
}

export function WeeklyView({
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
  showPastAppointments,
  setShowPastAppointments,
}: WeeklyViewProps) {
  const isDark = activeTheme === 'dark';
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  const [subViewMode, setSubViewMode] = React.useState<'vertical' | 'horizontal'>('vertical');

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSubViewMode('vertical');
      }
    };
    window.addEventListener('resize', handleResize);
    // Init: if already mobile, force vertical
    if (window.innerWidth < 768) {
      setSubViewMode('vertical');
    }
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

  // ─── Get desktop view content ───
  const getDesktopContent = () => {
    if (subViewMode === 'horizontal') {
      return (
        <HorizontalView
          appointmentsByDate={appointmentsByDate}
          calendarCountByDate={calendarCountByDate}
          calendarPendingCountByDate={calendarPendingCountByDate}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onMonthChange={onMonthChange}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          setFilterStatus={setFilterStatus}
          setSearchQuery={setSearchQuery}
          STATUS_LABELS={STATUS_LABELS}
          bizTimezone={bizTimezone}
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          todayStr={todayStr}
          formatMonthLabel={formatMonthLabel}
          navigateDate={navigateDate}
          goToday={goToday}
          activeTheme={activeTheme}
          showPastAppointments={showPastAppointments}
          isMobile={isMobile}
        />
      );
    }

    // Vertical view - day headers
    const dayHeaders = (
      <div className={`
        grid grid-cols-8 border-b-2
        ${isDark ? 'border-zinc-800' : 'border-zinc-200'}
      `}>
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
                px-3 py-3 text-center transition-all duration-200
                ${isSelected
                  ? isDark
                    ? 'bg-zinc-500/20'
                    : 'bg-zinc-400/20'
                  : isToday
                    ? isDark
                      ? 'bg-emerald-900/30'
                      : 'bg-green-100/80'
                    : isDark
                      ? 'bg-zinc-900'
                      : 'bg-zinc-50'
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
    );

    // Vertical view - time grid
    const hourRows = HOURS.map((hour) => (
      <div
        key={hour}
        className={`
          grid grid-cols-8 border-b
          ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}
        `}
        style={{ height: `${HOUR_HEIGHT}px` }}
      >
        <div className={`
          px-4 py-2 text-[12px] font-semibold
          ${isDark ? 'text-zinc-500 bg-zinc-800/30' : 'text-zinc-400 bg-zinc-50/50'}
        `}>
          {String(hour).padStart(2, '0')}:00
        </div>

        {weekDates.map((date, idx) => {
          const isToday = date === todayStr;
          const isSelected = date === selectedDate;
          const isTodaySelected = isToday && isSelected;
          return (
            <div
              key={date}
              className={`
                relative border-l
                ${isDark ? 'border-zinc-800/40' : 'border-zinc-200'}
                ${isTodaySelected
                  ? isDark ? 'bg-emerald-900/30' : 'bg-green-100/80'
                  : isToday
                    ? isDark ? 'bg-emerald-900/30' : 'bg-green-100/80'
                    : isSelected
                      ? isDark ? 'bg-zinc-500/20' : 'bg-zinc-400/20'
                      : ''
                }
              `}
            />
          );
        })}
      </div>
    ));

    // Vertical view - appointment cells
    const dayColumns = weekDates.map((date, idx) => {
      const isLast = idx === weekDates.length - 1;
      const dayAppointments = getFilteredAppointments(date);
      const overlaps = computeOverlaps(dayAppointments);

      return (
        <div key={date} className={`relative pointer-events-none ${isLast ? 'border-r-2 ' + (isDark ? 'border-zinc-800' : 'border-zinc-200') : ''}`}>
          {overlaps.map((apt) => {
            const colors = getAppointmentColor(apt.status);
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
                  z-0 pointer-events-auto
                `}
                style={{
                  left: `calc(${leftOffset}% + 2px)`,
                  width: `calc(${slotWidth}% - 4px)`,
                  top: `${Math.max(topOffset, 2)}px`,
                  height: `${height}px`,
                }}
              >
                {slotWidth > 40 && (
                  <>
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
    });

    return (
      <>
        <div className="sticky top-0 z-30 bg-zinc-50 dark:bg-zinc-900 overflow-x-hidden w-screen max-w-full">
          {dayHeaders}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="relative min-w-0" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
            {hourRows}

            <div
              className="grid grid-cols-8 absolute inset-0 pointer-events-none"
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
            >
              <div />
              {dayColumns}
            </div>
          </div>
        </div>
      </>
    );
  };

  // ─── Render ───
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6">
        {/* Navigation row */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
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

          <div className="text-center min-w-[100px] sm:min-w-[120px] flex-1 sm:flex-none">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
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

        {/* Controls row: sub-view toggle + show past switch */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Sub-view toggle: Vertical / Horizontal */}
          <div className={`
            shrink-0 inline-flex items-center rounded-lg border p-0.5 transition-all duration-200
            ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}
          `}>
            <button
              onClick={() => setSubViewMode('vertical')}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
                ${subViewMode === 'vertical'
                  ? isDark
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }
              `}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <span className="hidden sm:inline">Vertical</span>
              <span className="sm:hidden">Vertical</span>
            </button>
            <button
              onClick={() => setSubViewMode('horizontal')}
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
                ${subViewMode === 'horizontal'
                  ? isDark
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }
              `}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M3 6h18M3 12h18M3 18h18" />
                <path d="M9 2v20" />
              </svg>
              <span className="hidden sm:inline">Horizontal</span>
              <span className="sm:hidden">Horizontal</span>
            </button>
          </div>

          {/* Show past toggle */}
          <div className={`
            shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
            ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}
          `}>
            <button
              onClick={() => setShowPastAppointments(!showPastAppointments)}
              className={`
                relative w-9 h-5 rounded-full transition-all duration-200 shrink-0
                ${showPastAppointments
                  ? isDark ? 'bg-zinc-100' : 'bg-zinc-900'
                  : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                }
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm
                  ${showPastAppointments ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-semibold whitespace-nowrap ${
              showPastAppointments
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}>
              {showPastAppointments ? 'Mostrar todos' : 'Solo futuros'}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs mb-5">
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
      <div className="flex-1 min-h-0 flex flex-col" style={isMobile ? undefined : { height: 'calc(100vh - 260px)' }}>
        {isMobile ? (
          /* ── Mobile: responsive per sub-view ── */
          (subViewMode === 'horizontal' ? (
            /* Mobile Horizontal: scroll horizontal */
            <div className="flex-1 min-h-0 touch-auto">
              <HorizontalView
                appointmentsByDate={appointmentsByDate}
                calendarCountByDate={calendarCountByDate}
                calendarPendingCountByDate={calendarPendingCountByDate}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                onMonthChange={onMonthChange}
                filterStatus={filterStatus}
                searchQuery={searchQuery}
                setFilterStatus={setFilterStatus}
                setSearchQuery={setSearchQuery}
                STATUS_LABELS={STATUS_LABELS}
                bizTimezone={bizTimezone}
                selectedAppointment={selectedAppointment}
                setSelectedAppointment={setSelectedAppointment}
                todayStr={todayStr}
                formatMonthLabel={formatMonthLabel}
                navigateDate={navigateDate}
                goToday={goToday}
                activeTheme={activeTheme}
                showPastAppointments={showPastAppointments}
                isMobile={isMobile}
              />
            </div>
          ) : (
          /* Mobile Vertical: single day timeline */
          <div className="flex-1 min-h-0">
            {(() => {
              const selIdx = weekDates.indexOf(selectedDate);
              const dayDate = new Date(selectedDate + 'T00:00:00');
              const isToday = selectedDate === todayStr;
              const dayAppointments = getFilteredAppointments(selectedDate);
              const overlaps = computeOverlaps(dayAppointments);

              return (
                <>
                  {/* Day selector */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateDate(-1)}
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95
                        ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-600'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <div className="text-center">
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {DAY_NAMES_SHORT[selIdx >= 0 ? selIdx : 0]}
                      </p>
                      <p className={`text-2xl font-bold ${
                        isToday
                          ? isDark ? 'text-zinc-100' : 'text-zinc-900'
                          : isDark ? 'text-zinc-300' : 'text-zinc-700'
                      }`}>
                        {dayDate.getDate()}
                      </p>
                      {isToday && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 inline-block ${
                          isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
                        }`}>
                          HOY
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigateDate(1)}
                      className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95
                        ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-600'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Day timeline */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1 min-h-0 relative overflow-y-auto scrollbar-hide">
                      <div className="relative" style={{ height: `${HOURS.length * 48}px` }}>
                        {/* Time column + grid rows */}
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className={`
                              flex border-b
                              ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}
                            `}
                            style={{ height: '48px' }}
                          >
                            {/* Time label */}
                            <div className={`
                              w-16 shrink-0 px-2 flex items-center justify-center
                              text-[11px] font-semibold
                              ${isDark ? 'text-zinc-500 bg-zinc-950/90' : 'text-zinc-400 bg-white/90'}
                            `}>
                              {String(hour).padStart(2, '0')}:00
                            </div>
                            {/* Grid cell */}
                            <div className={`
                              flex-1 border-l
                              ${isDark ? 'border-zinc-800/40' : 'border-zinc-200'}
                            `} />
                          </div>
                        ))}

                        {/* Appointments overlay */}
                        <div className="absolute top-0 left-16 right-0 pointer-events-none" style={{ height: `${HOURS.length * 48}px` }}>
                          {overlaps.map((apt) => {
                            const colors = getAppointmentColor(apt.status);
                            const typedApt = apt as AgendaAppointment & { _colIndex?: number; _colCount?: number };
                            const colIndex = typedApt._colIndex ?? 0;
                            const colCount = typedApt._colCount ?? 1;
                            const isGrouped = colCount > 1;

                            const topOffset = getTimePosition(apt.time) * 48;
                            const height = Math.max((apt.totalDuration / 60) * 48, 24);
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
                                  hover:opacity-90 hover:scale-[1.01]
                                  z-10 pointer-events-auto
                                `}
                                style={{
                                  left: `calc(${leftOffset}% + 1px)`,
                                  right: '1px',
                                  width: `calc(${slotWidth}% - 2px)`,
                                  top: `${Math.max(topOffset, 2)}px`,
                                  height: `${height}px`,
                                }}
                              >
                                {slotWidth > 20 && (
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-[10px] leading-tight">{apt.time}</div>
                                      {height > 30 && (
                                        <div className="truncate text-[9px] opacity-90 mt-0.5 leading-tight">
                                          {apt.clientName}
                                        </div>
                                      )}
                                      {height > 40 && apt.totalDuration > 0 && (
                                        <div className="text-[8px] opacity-75 mt-0.5 leading-tight">
                                          {apt.totalDuration} min
                                        </div>
                                      )}
                                    </div>
                                    {isGrouped && (
                                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="text-[10px] font-bold">{colCount}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          ))
        ) : (
          /* ── Desktop: full grid with overlap columns ── */
          <div className="flex-1 min-h-0 overflow-hidden">
            {getDesktopContent()}
          </div>
        )}
      </div>
    </div>
  );
}
