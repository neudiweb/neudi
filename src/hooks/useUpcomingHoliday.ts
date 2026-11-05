import * as React from 'react';
import { getUpcomingHolidays, type Holiday } from '../services/holidayService';
import {
  parseLocalDate,
  getTodayInTimezone,
  BUSINESS_TIMEZONE,
} from '../utils/helpers';

export interface UpcomingHoliday {
  date: string;
  name: string;
  dateObj: Date;
}

function isHolidayToday(dateStr: string): boolean {
  const holidayDate = parseLocalDate(dateStr, BUSINESS_TIMEZONE);
  const todayStr = getTodayInTimezone(BUSINESS_TIMEZONE);
  const holidayStr = parseLocalDate(
    holidayDate.toISOString().split('T')[0],
    BUSINESS_TIMEZONE
  );
  const todayDate = parseLocalDate(todayStr, BUSINESS_TIMEZONE);
  return (
    holidayDate.getFullYear() === todayDate.getFullYear() &&
    holidayDate.getMonth() === todayDate.getMonth() &&
    holidayDate.getDate() === todayDate.getDate()
  );
}

function findUpcomingHolidays(holidays: Holiday[], count: number): UpcomingHoliday[] {
  const todayStr = getTodayInTimezone(BUSINESS_TIMEZONE);
  const todayDate = parseLocalDate(todayStr, BUSINESS_TIMEZONE);
  const results: UpcomingHoliday[] = [];

  for (const holiday of holidays) {
    if (results.length >= count) break;
    const holidayDate = parseLocalDate(holiday.date, BUSINESS_TIMEZONE);
    const isToday = isHolidayToday(holiday.date);
    if (isToday || (
      holidayDate.getFullYear() > todayDate.getFullYear() ||
      (holidayDate.getFullYear() === todayDate.getFullYear() &&
        holidayDate.getMonth() > todayDate.getMonth()) ||
      (holidayDate.getFullYear() === todayDate.getFullYear() &&
        holidayDate.getMonth() === todayDate.getMonth() &&
        holidayDate.getDate() >= todayDate.getDate())
    )) {
      results.push({
        date: holiday.date,
        name: holiday.name,
        dateObj: parseLocalDate(holiday.date, BUSINESS_TIMEZONE),
      });
    }
  }

  return results;
}

export function useUpcomingHoliday(): {
  holidays: UpcomingHoliday[];
  loading: boolean;
  error: boolean;
} {
  const [holidays, setHolidays] = React.useState<UpcomingHoliday[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getUpcomingHolidays()
      .then((holidaysList) => {
        if (cancelled) return;
        const upcoming = findUpcomingHolidays(holidaysList, 3);
        if (upcoming.length > 0) {
          setHolidays(upcoming);
        } else {
          const now = new Date();
          const nextYear = now.getFullYear() + (now.getMonth() > 10 ? 1 : 0);
          setHolidays([
            {
              date: `${nextYear}-12-25`,
              name: 'Navidad',
              dateObj: new Date(nextYear, 11, 25),
            },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { holidays, loading, error };
}
