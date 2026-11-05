import * as React from 'react';
import { useUpcomingHoliday } from '../../hooks/useUpcomingHoliday';
import { parseLocalDate, BUSINESS_TIMEZONE } from '../../utils/helpers';

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
];
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function HolidaysNotice() {
  const { holidays, loading } = useUpcomingHoliday();

  if (loading || holidays.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 px-5 py-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {holidays.map((holiday, idx) => {
          const date = parseLocalDate(holiday.date, BUSINESS_TIMEZONE);
          const dayName = DAY_NAMES[date.getDay()];
          const day = date.getDate();
          const month = MONTH_NAMES[date.getMonth()];

          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-300 dark:to-blue-500 text-white dark:text-blue-900 text-sm font-bold shadow-md shadow-blue-500/20">
                {day}
              </span>
              <div className="text-center">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 leading-tight">
                  {dayName} {day} de {month}
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-tight mt-0.5">
                  {holiday.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
