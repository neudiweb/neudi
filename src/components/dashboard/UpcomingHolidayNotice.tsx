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
    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-700">
            {isToday ? 'Hoy es feriado' : 'Próximo feriado'}
          </p>
          <p className="text-sm font-semibold text-blue-900 truncate">
            {dayName} {day} de {month}
          </p>
          <p className="text-xs text-blue-600 truncate">
            {holiday.name}
          </p>
        </div>
      </div>
    </div>
  );
}
