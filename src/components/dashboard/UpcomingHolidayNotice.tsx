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

export function UpcomingHolidayNotice() {
  const { holidays, loading } = useUpcomingHoliday();

  if (loading || holidays.length === 0) return null;

  return (
    <div className="mb-2 text-center">
      <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">
        <span className="hidden sm:inline">Próximos 3 feriados:</span>
        <span className="sm:hidden">Próximos feriados:</span>
        {' '}{holidays.map((holiday, idx) => {
          const date = parseLocalDate(holiday.date, BUSINESS_TIMEZONE);
          const dayName = DAY_NAMES[date.getDay()];
          const day = date.getDate();
          const month = MONTH_NAMES[date.getMonth()];
          return (
            <span key={idx}>
              {idx > 0 ? (idx === holidays.length - 1 ? ' y ' : ', ') : ''}
              {dayName} {day} de {month} ({holiday.name})
            </span>
          );
        })}
      </p>
    </div>
  );
}
