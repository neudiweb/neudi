import * as React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppointmentStatusLower } from '../../types/index';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-blue-500 dark:bg-indigo-600', text: 'text-white' },
  completed: { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white' },
  pending: { bg: 'bg-amber-500 dark:bg-amber-600', text: 'text-white' },
  requires_deposit: { bg: 'bg-zinc-500 dark:bg-zinc-600', text: 'text-white' },
  cancelled: { bg: 'bg-zinc-400 dark:bg-zinc-500', text: 'text-white' },
  rejected: { bg: 'bg-zinc-400 dark:bg-zinc-500', text: 'text-white' },
  no_show: { bg: 'bg-zinc-400 dark:bg-zinc-500', text: 'text-white' },
  expired: { bg: 'bg-slate-500 dark:bg-slate-600', text: 'text-white' },
};

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOUR_WIDTH = 50;
const DAY_LABEL_WIDTH = 80;
const DAY_ROW_BASE_HEIGHT = 120;
const APPT_ROW_GAP = 3;

function formatDateISO(date: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
}

interface AgendaAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  services: string;
  serviceNames: string;
  totalDuration: number;
  totalPrice: number;
  date: string;
  time: string;
  endTime: string;
  status: AppointmentStatusLower;
  requiresDeposit: boolean;
  serviceDetails?: Array<{ name: string; price: number; duration_minutes: number }>;
}

interface SelectedAppointment {
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
}

interface HorizontalViewProps {
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
  selectedAppointment: SelectedAppointment | null;
  setSelectedAppointment: (apt: SelectedAppointment | null) => void;
  todayStr: string;
  formatMonthLabel: (dateStr: string) => string;
  navigateDate: (dir: number) => void;
  goToday: () => void;
  activeTheme: 'light' | 'dark';
  showPastAppointments: boolean;
  isMobile: boolean;
}

export function HorizontalView({
  appointmentsByDate,
  calendarCountByDate,
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
  isMobile,
}: HorizontalViewProps) {
  const isDark = activeTheme === 'dark';

  // Use isMobile prop for responsive day label width
  const dayLabelWidth = isMobile ? 56 : DAY_LABEL_WIDTH;

  // Refs for the two independent scroll containers
  const horizontalScrollRef = React.useRef<HTMLDivElement>(null);

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
      dates.push(formatDateISO(d, bizTimezone));
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

  const filteredAppointmentsByDate = React.useMemo(() => {
    const localTodayStr = new Date().toISOString().split('T')[0];
    const result: Record<string, AgendaAppointment[]> = {};
    for (const date of weekDates) {
      const apts = appointmentsByDate[date] || [];
      result[date] = apts.filter((apt) => {
        if (!showPastAppointments && date < localTodayStr) return false;
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
  }, [weekDates, appointmentsByDate, filterStatus, searchQuery, showPastAppointments]);

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

  const navigateWeek = React.useCallback(
    (dir: number) => navigateDate(dir * 7),
    [navigateDate]
  );

  // Sync the header scroll with the appointments grid
  const syncScroll = React.useCallback(
    (source: HTMLDivElement) => {
      if (horizontalScrollRef.current && horizontalScrollRef.current !== source) {
        horizontalScrollRef.current.scrollLeft = source.scrollLeft;
      }
    },
    []
  );

  // Scroll to ~08:00 on mount (horizontal only)
  React.useEffect(() => {
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollLeft = 8 * HOUR_WIDTH;
    }
  }, []);

  // Calculate dynamic day row heights based on max vertical overlaps
  const dayRowHeights = React.useMemo(() => {
    const heights: Record<string, number> = {};
    for (const date of weekDates) {
      const dayAppointments = getFilteredAppointments(date);
      if (dayAppointments.length === 0) {
        heights[date] = DAY_ROW_BASE_HEIGHT;
        continue;
      }

      // Sort by start time
      const sorted = [...dayAppointments].sort((a, b) => {
        const aStart = parseInt(a.time.split(':')[0], 10) + parseInt(a.time.split(':')[1], 10) / 60;
        const bStart = parseInt(b.time.split(':')[0], 10) + parseInt(b.time.split(':')[1], 10) / 60;
        return aStart - bStart;
      });

      // Assign vertical rows for overlapping appointments (column coloring algorithm)
      const rows: { lastEnd: number }[] = [];
      for (const apt of sorted) {
        const [h, m] = apt.time.split(':').map(Number);
        const start = h + m / 60;
        const end = start + apt.totalDuration / 60;

        let placed = false;
        for (let ri = 0; ri < rows.length; ri++) {
          if (start >= rows[ri].lastEnd - 0.01) {
            rows[ri].lastEnd = end;
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push({ lastEnd: end });
        }
      }

      const maxRows = Math.max(rows.length, 1);
      const rowH = isMobile ? 40 : 15;
      heights[date] = Math.max(isMobile ? 180 : DAY_ROW_BASE_HEIGHT, maxRows * (rowH + APPT_ROW_GAP));
    }
    return heights;
  }, [weekDates, getFilteredAppointments]);

  const headerHeight = 36;
  const totalHeight = headerHeight + weekDates.reduce(
    (sum, date) => sum + (dayRowHeights[date] || DAY_ROW_BASE_HEIGHT), 0
  );
  const appointmentsWidth = 24 * HOUR_WIDTH;

  // Compute cumulative top offset for each day row (relative to appointments area, after header)
  const dayRowTopMap = React.useMemo(() => {
    const tops: Record<string, number> = {};
    let cumulative = 0;
    for (const date of weekDates) {
      tops[date] = cumulative;
      cumulative += dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;
    }
    return tops;
  }, [weekDates, dayRowHeights]);

  // Render appointments for a single day (absolute positioned within horizontal scroll container)
  const renderDayAppointments = React.useCallback(
    (date: string) => {
      const dayAppointments = getFilteredAppointments(date);
      if (dayAppointments.length === 0) return null;

      const sorted = [...dayAppointments].sort((a, b) => {
        const aStart = parseInt(a.time.split(':')[0], 10) + parseInt(a.time.split(':')[1], 10) / 60;
        const bStart = parseInt(b.time.split(':')[0], 10) + parseInt(b.time.split(':')[1], 10) / 60;
        return aStart - bStart;
      });

      // Assign vertical rows for overlapping appointments (column coloring)
      const rows: { apts: typeof sorted; lastEnd: number }[] = [];
      for (const apt of sorted) {
        const [h, m] = apt.time.split(':').map(Number);
        const start = h + m / 60;
        const end = start + apt.totalDuration / 60;

        let placed = false;
        for (let ri = 0; ri < rows.length; ri++) {
          if (start >= rows[ri].lastEnd - 0.01) {
            rows[ri].apts.push(apt);
            rows[ri].lastEnd = end;
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push({ apts: [apt], lastEnd: end });
        }
      }

      const effectiveRowHeight = isMobile ? 40 : 15;
      const dayTop = dayRowTopMap[date] ?? 0;

      const result: React.ReactNode[] = [];
      for (let ri = 0; ri < rows.length; ri++) {
        for (const apt of rows[ri].apts) {
          const colors = getAppointmentColor(apt.status);
          const isSelected = selectedAppointment?.id === apt.id;
          const [hours, minutes] = apt.time.split(':').map(Number);
          const startHour = hours + minutes / 60;
          const width = Math.max(apt.totalDuration * HOUR_WIDTH / 60, 30);

          result.push(
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
              aria-label={`${apt.clientName} — ${apt.serviceNames} a las ${apt.time}`}
              className={`absolute rounded-lg px-2 py-0.5 text-[10px] font-medium transition-all duration-150
                cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1
                ${colors.bg} ${colors.text}
                hover:brightness-110 hover:scale-[1.02] hover:z-20
                ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400 z-20' : 'z-10'}
                overflow-hidden whitespace-nowrap`}
              style={{
                left: `${startHour * HOUR_WIDTH - 2}px`,
                top: `${dayTop + headerHeight + 2 + ri * (effectiveRowHeight + APPT_ROW_GAP)}px`,
                width: `${Math.min(width, appointmentsWidth - 4)}px`,
                height: `${effectiveRowHeight}px`,
                pointerEvents: 'auto' as never,
              }}
            >
              <div className="truncate font-medium">{apt.clientName}</div>
              {effectiveRowHeight > 22 && (
                <div className="truncate text-[10px] opacity-75">
                  {apt.time}
                </div>
              )}
            </div>
          );
        }
      }
      return result;
    },
    [getFilteredAppointments, selectedAppointment, handleAppointmentClick, dayRowTopMap, headerHeight, appointmentsWidth]
  );

  // Day label component (reused for sticky column and header)
  const renderDayLabel = (date: string, dayIdx: number, compact: boolean) => {
    const dayDate = new Date(date + 'T00:00:00');
    const isToday = date === todayStr;
    const isSelected = date === selectedDate;
    const count = calendarCountByDate[date] || 0;
    const rowHeight = dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;

    if (compact) {
      // Compact version for the sticky header row (just day name + date)
      return (
        <button
          type="button"
          onClick={() => onDateSelect(date)}
          className={`flex flex-col items-center justify-center px-1.5 py-1 transition-all duration-200
            ${isSelected
              ? isDark ? 'bg-zinc-700' : 'bg-zinc-200'
              : isToday
                ? isDark ? 'bg-zinc-800/80' : 'bg-emerald-50/60'
                : isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-100'
            }`}
          style={{ width: `${HOUR_WIDTH}px` }}
        >
          <span className={`text-[9px] font-bold uppercase tracking-wider
            ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {DAY_NAMES_SHORT[dayIdx]}
          </span>
          <span className={`text-sm font-bold tabular-nums mt-0.5
            ${isToday ? isDark ? 'text-zinc-100' : 'text-zinc-900' : isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {dayDate.getDate()}
          </span>
        </button>
      );
    }

    // Full version for the sticky day labels column
    return (
      <button
        type="button"
        onClick={() => onDateSelect(date)}
        className={`flex flex-col items-center justify-center transition-all duration-200 w-full
          ${isSelected
            ? isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
            : isToday
              ? isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
              : isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
          }`}
        style={{ height: `${rowHeight}px` }}
      >
        <div className={`flex flex-col items-center justify-center mx-auto rounded-lg transition-all duration-200
          ${isToday
            ? isDark ? 'bg-zinc-800/60 border border-zinc-600' : 'bg-emerald-100 border border-emerald-300'
            : 'bg-transparent'
          }
          ${isSelected
            ? isDark ? 'bg-zinc-800/80 border border-zinc-500' : 'bg-zinc-300 border border-zinc-400'
            : ''
          }`}
          style={{
            width: isMobile ? '44px' : '80px',
            height: isMobile ? '80px' : '118px',
          }}>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-md
            ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
            {DAY_NAMES_SHORT[dayIdx]}
          </span>
          <span className={`text-base font-bold mt-0.5 tabular-nums
            ${isToday ? isDark ? 'text-zinc-100' : 'text-zinc-900' : isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {dayDate.getDate()}
          </span>
          {isToday && (
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded-md mt-0.5
              ${isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'}`}>
              HOY
            </span>
          )}
          {count > 0 && (
            <span className={`text-[8px] font-semibold mt-0.5
              ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {count}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Two-axis scroll grid view ── */}
      <div className={`flex-1 min-h-0 rounded-2xl border flex flex-col overflow-clip ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>

        {/* ═══════════════════════════════════════════
            ROW 0: Hour header (always visible, outside scroll)
            ═══════════════════════════════════════════ */}
        <div
          style={{
            height: `${headerHeight}px`,
            borderBottom: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
            backgroundColor: isDark ? '#18181b' : '#fafafa',
          }}
          className="flex shrink-0"
        >
          {/* Corner cell — top-left of day labels column */}
          <div className={`flex-shrink-0 flex items-center justify-center border-r ${isDark ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}
            style={{ width: `${dayLabelWidth}px`, height: `${headerHeight}px` }}>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Día
            </span>
          </div>

          {/* Hour labels — scroll horizontally with appointments */}
          <div
            ref={horizontalScrollRef}
            onScroll={(e) => syncScroll(e.currentTarget)}
            className="flex-1 flex items-stretch overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ minWidth: 0, touchAction: 'pan-y' }}
          >
            <div className="flex" style={{ width: `${appointmentsWidth}px` }}>
              {HOURS_24.map((hour) => (
                <div
                  key={`hour-${hour}`}
                  className={`flex-shrink-0 flex items-center justify-center border-l ${isDark ? 'border-zinc-800/50' : 'border-zinc-200'}`}
                  style={{ width: `${HOUR_WIDTH}px` }}
                >
                  <span className={`text-[10px] font-semibold tabular-nums ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {String(hour).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            ROWS 1+: Scrollable body
            — Vertical scroll: day rows move
            — Horizontal scroll: appointments move, day labels stay
            ═══════════════════════════════════════════ */}
        <div className={`flex-1 min-h-0 overscroll-contain touch-pan-y ${isMobile ? 'overflow-x-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          <div className="flex relative" style={{ height: isMobile ? 'auto' : `${totalHeight - headerHeight}px` }}>

            {/* ── Day row backgrounds (full width) ── */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {weekDates.map((date) => {
                const rowHeight = dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;
                const dayTop = dayRowTopMap[date] ?? 0;
                const isToday = date === todayStr;
                const isSelected = date === selectedDate;
                return (
                  <div
                    key={`bg-${date}`}
                    style={{
                      top: `${dayTop}px`,
                      height: `${rowHeight}px`,
                      backgroundColor: isSelected
                        ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.22)'
                        : isToday
                          ? isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.12)'
                          : 'transparent',
                      zIndex: 0,
                    }}
                  />
                );
              })}
            </div>

            {/* ── Sticky day labels column (left) ── */}
            {/* Stays fixed when scrolling horizontally. */}
            <div
              className="flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-700 relative z-20"
              style={{
                width: `${dayLabelWidth}px`,
                height: isMobile ? 'auto' : `${totalHeight - headerHeight}px`,
              }}
            >
              {weekDates.map((date, dayIdx) => (
                <div key={date} style={{ height: `${dayRowHeights[date] || DAY_ROW_BASE_HEIGHT}px` }}>
                  {renderDayLabel(date, dayIdx, false)}
                </div>
              ))}
            </div>

            {/* ── Appointments grid (scrolls horizontally) ── */}
            <div
              className={`flex-1 relative ${isMobile ? 'overflow-x-scroll' : 'overflow-x-auto'} touch-pan-y`}
              onScroll={(e) => syncScroll(e.currentTarget)}
              style={{
                minWidth: 0,
                WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
              }}
            >
              {/* Full-width background to establish scroll area */}
              <div
                className="absolute inset-0"
                style={{ width: `${appointmentsWidth}px`, zIndex: 0 }}
              />

              {/* Grid background: hour lines + day separators */}
              {/* Hour vertical lines */}
              {HOURS_24.map((hour) => (
                <div
                  key={`grid-${hour}`}
                  className={`absolute border-l ${isDark ? 'border-zinc-800/20' : 'border-zinc-200'}`}
                  style={{
                    left: `${hour * HOUR_WIDTH}px`,
                    top: 0,
                    width: '1px',
                    height: `${totalHeight - headerHeight}px`,
                    zIndex: 0,
                  }}
                />
              ))}

              {/* Day horizontal separators (full width) */}
              {weekDates.map((date) => {
                const rowHeight = dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;
                const dayTop = dayRowTopMap[date] ?? 0;
                return (
                  <div
                    key={`hsep-${date}`}
                    className={`absolute border-b ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}
                    style={{
                      left: 0,
                      right: 0,
                      top: `${dayTop + rowHeight}px`,
                      height: '1px',
                      width: `${appointmentsWidth}px`,
                      zIndex: 0,
                    }}
                  />
                );
              })}

              {/* Appointments — absolutely positioned within this container */}
              {weekDates.map((date) => (
                <React.Fragment key={`apts-${date}`}>
                  {renderDayAppointments(date)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
