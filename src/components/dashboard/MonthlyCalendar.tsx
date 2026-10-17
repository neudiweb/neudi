import * as React from 'react';
import { parseLocalDate, BUSINESS_TIMEZONE } from '../../utils/helpers';

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
    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-primary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)]">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] transition-colors"
          aria-label="Mes anterior"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] transition-colors"
          aria-label="Mes siguiente"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border-primary)]">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 p-2 gap-0.5">
        {calendarDays.map((dayInfo, idx) => {
          const count = appointmentCountByDate[dayInfo.date] || 0;
          const pending = pendingCountByDate[dayInfo.date] || 0;

          let cellClass =
            'relative flex flex-col items-center justify-center rounded-lg h-9 text-xs transition-colors cursor-pointer ';

          if (dayInfo.isDisabled) {
            cellClass += 'text-[var(--color-text-secondary)] cursor-default ';
          } else if (dayInfo.isSelected) {
            cellClass += 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] font-semibold ';
          } else if (dayInfo.isToday) {
            cellClass += 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] font-semibold ';
          } else {
            cellClass += 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-hover)] ';
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
              <span>{dayInfo.day}</span>
              {count > 0 && !dayInfo.isDisabled && (
                <span
                  className={`absolute bottom-0.5 text-[9px] ${
                    dayInfo.isSelected
                      ? 'text-white/70'
                      : dayInfo.isToday
                      ? 'text-[var(--color-accent-500)]'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {count}
                </span>
              )}
              {pending > 0 && !dayInfo.isDisabled && (
                <span
                  className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    dayInfo.isSelected ? 'bg-amber-300' : 'bg-amber-400'
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
