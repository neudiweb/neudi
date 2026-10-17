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

function findNextHoliday(holidays: Holiday[]): UpcomingHoliday | null {
  const todayStr = getTodayInTimezone(BUSINESS_TIMEZONE);
  const todayDate = parseLocalDate(todayStr, BUSINESS_TIMEZONE);

  for (const holiday of holidays) {
    if (isHolidayToday(holiday.date)) {
      return {
        date: holiday.date,
        name: holiday.name,
        dateObj: parseLocalDate(holiday.date, BUSINESS_TIMEZONE),
      };
    }
    const holidayDate = parseLocalDate(holiday.date, BUSINESS_TIMEZONE);
    if (
      holidayDate.getFullYear() > todayDate.getFullYear() ||
      (holidayDate.getFullYear() === todayDate.getFullYear() &&
        holidayDate.getMonth() > todayDate.getMonth()) ||
      (holidayDate.getFullYear() === todayDate.getFullYear() &&
        holidayDate.getMonth() === todayDate.getMonth() &&
        holidayDate.getDate() >= todayDate.getDate())
    ) {
      return {
        date: holiday.date,
        name: holiday.name,
        dateObj: parseLocalDate(holiday.date, BUSINESS_TIMEZONE),
      };
    }
  }

  return null;
}

export function useUpcomingHoliday(): {
  holiday: UpcomingHoliday | null;
  loading: boolean;
  error: boolean;
} {
  const [holiday, setHoliday] = React.useState<UpcomingHoliday | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getUpcomingHolidays()
      .then((holidays) => {
        if (cancelled) return;
        const next = findNextHoliday(holidays);
        setHoliday(next);
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

  return { holiday, loading, error };
}
