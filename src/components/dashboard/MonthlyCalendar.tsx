import * as React from 'react';
import { parseLocalDate, BUSINESS_TIMEZONE } from '../../utils/helpers';
import { useTheme } from '../../contexts/ThemeContext';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface MonthlyCalendarProps {
  currentDate: string;
  selectedDate: string;
  appointmentCountByDate: Record<string, number>;
  pendingCountByDate: Record<string, number>;
  onDateSelect: (date: string) => void;
  onMonthChange?: (date: string) => void;
}

export function MonthlyCalendar({
  currentDate,
  selectedDate,
  appointmentCountByDate,
  pendingCountByDate,
  onDateSelect,
  onMonthChange,
}: MonthlyCalendarProps) {
  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';
  const [viewYear, setViewYear] = React.useState(() => {
    return new Date(currentDate + 'T00:00:00').getFullYear();
  });
  const [viewMonth, setViewMonth] = React.useState(() => {
    return new Date(currentDate + 'T00:00:00').getMonth();
  });

  React.useEffect(() => {
    const targetDate = new Date(currentDate + 'T00:00:00');
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
  }, [currentDate]);

  const todayStr = React.useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const navigateMonth = React.useCallback(
    (dir: number) => {
      let newYear = viewYear;
      let newMonth = viewMonth + dir;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setViewYear(newYear);
      setViewMonth(newMonth);
      const firstDay = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-01`;
      onMonthChange?.(firstDay);
    },
    [viewYear, viewMonth, onMonthChange]
  );

  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const prevMonthLast = new Date(viewYear, viewMonth, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLast.getDate() - i;
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isDisabled: true,
      });
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isDisabled: false,
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = 1; days.length < totalCells; i++) {
      const month = viewMonth + 1;
      const year = month > 11 ? viewYear + 1 : viewYear;
      const actualMonth = month > 11 ? 0 : month;
      const dateStr = `${year}-${String(actualMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isDisabled: true,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, todayStr]);

  const handleDateClick = React.useCallback(
    (date: string) => {
      if (!date) return;
      const parsed = parseLocalDate(date, BUSINESS_TIMEZONE);
      if (isNaN(parsed.getTime())) return;
      onDateSelect(date);
    },
    [onDateSelect]
  );

  return (
    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Mes anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Mes siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border-primary)]">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {calendarDays.map((dayInfo, idx) => {
          const count = appointmentCountByDate[dayInfo.date] || 0;
          const pending = pendingCountByDate[dayInfo.date] || 0;

          let cellClass =
            'relative flex flex-col items-center justify-center rounded-xl h-10 text-xs transition-all duration-200 cursor-pointer ';

          if (dayInfo.isDisabled) {
            cellClass += isDark ? 'text-zinc-600 cursor-default ' : 'text-zinc-300 cursor-default ';
          } else {
            cellClass += isDark
              ? 'bg-zinc-800 text-zinc-50 border border-transparent hover:bg-zinc-700 hover:scale-105 '
              : 'bg-white text-black border border-zinc-200 hover:bg-zinc-50 hover:scale-105 ';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={dayInfo.isDisabled}
              onClick={() => handleDateClick(dayInfo.date)}
              className={cellClass}
              aria-label={`${dayInfo.day} de ${MONTH_NAMES[viewMonth]}${dayInfo.isDisabled ? ', deshabilitado' : ''}`}
            >
              <span className={isDark ? 'text-zinc-50' : 'text-black'}>{dayInfo.day}</span>
              {count > 0 && !dayInfo.isDisabled && (
                <span
                  className={`absolute bottom-0.5 text-[8px] font-bold ${
                    dayInfo.isSelected
                      ? 'text-red-300'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {count}
                </span>
              )}
              {pending > 0 && !dayInfo.isDisabled && (
                <span
                  className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    dayInfo.isSelected ? 'bg-red-300' : 'bg-red-500 dark:bg-red-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
