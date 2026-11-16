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
const DAY_ROW_BASE_HEIGHT = 120;
const APPT_ROW_HEIGHT = 30;
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
}: HorizontalViewProps) {
  const isDark = activeTheme === 'dark';
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 8 * HOUR_WIDTH;
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
      heights[date] = Math.max(DAY_ROW_BASE_HEIGHT, maxRows * (15 + APPT_ROW_GAP));
    }
    return heights;
  }, [weekDates, getFilteredAppointments]);

  const totalHeight = 36 + weekDates.reduce(
    (sum, date) => sum + (dayRowHeights[date] || DAY_ROW_BASE_HEIGHT), 0
  );

  // Render appointments for a single day
  const renderDayAppointments = React.useCallback(
    (date: string, dayIdx: number, rowHeight: number, dayRowTop: number) => {
      const dayAppointments = getFilteredAppointments(date);
      if (dayAppointments.length === 0) return null;

      // Sort by start time
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

      // Fixed 15px for every appointment row
      const effectiveRowHeight = 15;

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
                left: `${80 + startHour * HOUR_WIDTH + 2}px`,
                top: `${dayRowTop + 2 + ri * (effectiveRowHeight + APPT_ROW_GAP)}px`,
                width: `${Math.min(width, 80 + 24 * HOUR_WIDTH - 84)}px`,
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
    [getFilteredAppointments, selectedAppointment, handleAppointmentClick]
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Horizontal grid view ── */}
      <div className={`flex-1 min-h-0 rounded-2xl border overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto scrollbar-hide">
          <div className="relative" style={{ width: 80 + 24 * HOUR_WIDTH, height: totalHeight }}>
            {/* ── Hour header (top row) ── */}
            <div
              className={`absolute left-0 right-0 z-20 grid border-b ${isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-200 bg-zinc-50/80'} backdrop-blur-sm`}
              style={{
                top: 0,
                height: '36px',
                gridTemplateColumns: `80px repeat(24, ${HOUR_WIDTH}px)`,
              }}
            >
              <div className={`flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Día
              </div>
              {HOURS_24.map((hour) => (
                <div
                  key={`hour-${hour}`}
                  className={`flex items-center justify-center text-[10px] font-semibold tabular-nums ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
                >
                  {String(hour).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* ── Hour grid lines (rendered once, behind everything) ── */}
            {HOURS_24.map((hour) => (
              <div
                key={`grid-${hour}`}
                className={`absolute border-l ${isDark ? 'border-zinc-800/20' : 'border-zinc-200'}`}
                style={{
                  left: `${80 + hour * HOUR_WIDTH}px`,
                  top: '36px',
                  width: '1px',
                  height: `${totalHeight - 36}px`,
                  zIndex: 0,
                }}
              />
            ))}

            {/* ── Horizontal day separators (full width, behind appointments) ── */}
            {weekDates.map((date, dayIdx) => {
              const rowHeight = dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;
              const dayRowTop = 36 + weekDates.slice(0, dayIdx).reduce(
                (sum, d) => sum + (dayRowHeights[d] || DAY_ROW_BASE_HEIGHT), 0
              );
              return (
                <div
                  key={`hsep-${date}`}
                  className={`absolute left-0 right-0 border-b ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}
                  style={{
                    top: `${dayRowTop + rowHeight}px`,
                    height: '1px',
                    zIndex: 0,
                  }}
                />
              );
            })}

            {/* ── Day rows ── */}
            {weekDates.map((date, dayIdx) => {
              const dayDate = new Date(date + 'T00:00:00');
              const isToday = date === todayStr;
              const isSelected = date === selectedDate;
              const count = calendarCountByDate[date] || 0;
              const rowHeight = dayRowHeights[date] || DAY_ROW_BASE_HEIGHT;
              const dayRowTop = 36 + weekDates.slice(0, dayIdx).reduce(
                (sum, d) => sum + (dayRowHeights[d] || DAY_ROW_BASE_HEIGHT), 0
              );

              return (
                <React.Fragment key={date}>
                  {/* Day row background */}
                  <div
                    className={`absolute left-0 right-0 ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}
                    style={{
                      top: `${dayRowTop}px`,
                      height: `${rowHeight}px`,
                      backgroundColor: isToday
                        ? isDark ? 'rgba(255,255,255,0.02)' : 'rgba(16,185,129,0.03)'
                        : 'transparent',
                      zIndex: 0,
                    }}
                  />

                  {/* Day label (left column) */}
                  <button
                    type="button"
                    onClick={() => onDateSelect(date)}
                    className={`absolute flex flex-col items-center justify-center px-2 transition-all duration-200 border-r z-10
                      ${isSelected
                        ? isDark ? 'bg-zinc-800' : 'bg-zinc-50'
                        : isToday
                          ? isDark ? 'bg-zinc-900/60' : 'bg-emerald-50/40'
                          : isDark ? 'hover:bg-zinc-900/30' : 'hover:bg-zinc-50'
                      }
                      ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                    style={{
                      left: 0,
                      top: `${dayRowTop}px`,
                      width: '80px',
                      height: `${rowHeight}px`,
                    }}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md
                      ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}>
                      {DAY_NAMES_SHORT[dayIdx]}
                    </span>
                    <span className={`text-lg font-bold mt-0.5 tabular-nums
                      ${isToday ? isDark ? 'text-zinc-100' : 'text-zinc-900' : isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {dayDate.getDate()}
                    </span>
                    {isToday && (
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded-md mt-0.5
                        ${isDark ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'}`}>
                        HOY
                      </span>
                    )}
                    {count > 0 && (
                      <span className={`text-[9px] font-semibold mt-0.5
                        ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>

                  {/* Appointments */}
                  {renderDayAppointments(date, dayIdx, rowHeight, dayRowTop)}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
