import * as React from 'react';
import { useUpcomingHoliday } from '../../hooks/useUpcomingHoliday';
import {
  parseLocalDate,
  getTodayInTimezone,
  BUSINESS_TIMEZONE,
} from '../../utils/helpers';

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function UpcomingHolidayNotice() {
  const { holiday, loading } = useUpcomingHoliday();
  const todayStr = getTodayInTimezone(BUSINESS_TIMEZONE);

  if (loading || !holiday) return null;

  const date = parseLocalDate(holiday.date, BUSINESS_TIMEZONE);
  const dayName = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];

  const isToday = holiday.date === todayStr;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-300 dark:to-blue-500 text-white dark:text-blue-900 shadow-md shadow-blue-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            {isToday ? 'Hoy es feriado' : 'Próximo feriado'}
          </p>
          <p className="text-sm font-bold text-blue-900 dark:text-blue-200 truncate">
            {dayName} {day} de {month}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 truncate">
            {holiday.name}
          </p>
        </div>
      </div>
    </div>
  );
}
