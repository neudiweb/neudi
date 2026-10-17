import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  buildTimestampISO,
  formatTimeInBusinessTimezone,
  formatDateTimeInBusinessTimezone,
  getLocalDateInTimezone,
  getTodayInTimezone,
  getTomorrowInTimezone,
  formatDate,
  getTimeSlots,
  isDayOfWeek,
  addDaysToDate,
  jsDayToBusinessDay,
  businessDayToJsDay,
  BUSINESS_TIMEZONE,
} from '../dateTime';

describe('parseLocalDate', () => {
  it('debería parsear una fecha correctamente en timezone de Buenos Aires', () => {
    const result = parseLocalDate('2026-08-20', BUSINESS_TIMEZONE);
    expect(result).toBeInstanceOf(Date);
  });

  it('no debería tener drift UTC — la fecha mostrada debe ser la correcta', () => {
    const result = parseLocalDate('2026-08-20', BUSINESS_TIMEZONE);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(result);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    expect(`${year}-${month}-${day}`).toBe('2026-08-20');
  });

  it('debería manejar fechas a medianoche correctamente', () => {
    const result = parseLocalDate('2026-08-24', BUSINESS_TIMEZONE);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(result);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    expect(hour).toBe(0);
  });
});

describe('buildTimestampISO', () => {
  it('debería construir un ISO string UTC correcto para 09:00 en Buenos Aires', () => {
    const result = buildTimestampISO('2026-08-20', '09:00', BUSINESS_TIMEZONE);
    expect(result).toContain('T');
    expect(result).toContain('.000Z');
  });

  it('el ISO string debería representar la hora correcta en timezone de Buenos Aires', () => {
    const result = buildTimestampISO('2026-08-20', '09:00', BUSINESS_TIMEZONE);
    const date = new Date(result);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    expect(hour).toBe(9);
    expect(minute).toBe(0);
  });

  it('debería manejar 19:00 correctamente', () => {
    const result = buildTimestampISO('2026-08-21', '19:00', BUSINESS_TIMEZONE);
    const date = new Date(result);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    expect(hour).toBe(19);
  });
});

describe('formatTimeInBusinessTimezone', () => {
  it('debería formatear una hora en timezone de Buenos Aires', () => {
    const utcISO = '2026-08-20T12:00:00.000Z';
    const result = formatTimeInBusinessTimezone(utcISO, BUSINESS_TIMEZONE);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('formatDate', () => {
  it('debería formatear una fecha en español', () => {
    const result = formatDate('2026-08-20', BUSINESS_TIMEZONE);
    expect(result).toContain('agosto');
  });

  it('debería manejar diferentes fechas correctamente', () => {
    const result = formatDate('2026-08-24', BUSINESS_TIMEZONE);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('getTimeSlots', () => {
  it('debería generar slots de 30 minutos', () => {
    const slots = getTimeSlots('09:00', '17:00', 30);
    expect(slots).toContain('09:00');
    expect(slots).toContain('10:00');
    expect(slots).toContain('16:30');
    expect(slots.length).toBe(16);
  });

  it('debería generar slots de 15 minutos', () => {
    const slots = getTimeSlots('09:00', '10:00', 15);
    expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45']);
    expect(slots.length).toBe(4);
  });
});

describe('isDayOfWeek', () => {
  it('debería identificar correctamente un lunes', () => {
    const result = isDayOfWeek('2026-08-24', 1, BUSINESS_TIMEZONE);
    expect(result).toBe(true);
  });

  it('debería identificar correctamente un viernes', () => {
    const result = isDayOfWeek('2026-08-28', 5, BUSINESS_TIMEZONE);
    expect(result).toBe(true);
  });

  it('debería identificar correctamente un domingo', () => {
    const result = isDayOfWeek('2026-08-23', 7, BUSINESS_TIMEZONE);
    expect(result).toBe(true);
  });

  it('no debería identificar un lunes como viernes', () => {
    const result = isDayOfWeek('2026-08-24', 5, BUSINESS_TIMEZONE);
    expect(result).toBe(false);
  });
});

describe('addDaysToDate', () => {
  it('debería sumar 1 día correctamente', () => {
    const result = addDaysToDate('2026-08-20', 1, BUSINESS_TIMEZONE);
    expect(result).toBe('2026-08-21');
  });

  it('debería sumar 7 días correctamente', () => {
    const result = addDaysToDate('2026-08-20', 7, BUSINESS_TIMEZONE);
    expect(result).toBe('2026-08-27');
  });

  it('debería manejar el cambio de mes', () => {
    const result = addDaysToDate('2026-08-31', 1, BUSINESS_TIMEZONE);
    expect(result).toBe('2026-09-01');
  });
});

describe('jsDayToBusinessDay', () => {
  it('debería convertir 0 (domingo) a 7', () => {
    expect(jsDayToBusinessDay(0)).toBe(7);
  });

  it('debería convertir 1 (lunes) a 1', () => {
    expect(jsDayToBusinessDay(1)).toBe(1);
  });

  it('debería convertir 5 (viernes) a 5', () => {
    expect(jsDayToBusinessDay(5)).toBe(5);
  });
});

describe('businessDayToJsDay', () => {
  it('debería convertir 7 (domingo) a 0', () => {
    expect(businessDayToJsDay(7)).toBe(0);
  });

  it('debería convertir 1 (lunes) a 1', () => {
    expect(businessDayToJsDay(1)).toBe(1);
  });

  it('debería convertir 5 (viernes) a 5', () => {
    expect(businessDayToJsDay(5)).toBe(5);
  });
});

describe('getTodayInTimezone', () => {
  it('debería devolver una fecha válida', () => {
    const result = getTodayInTimezone(BUSINESS_TIMEZONE);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getTomorrowInTimezone', () => {
  it('debería devolver la fecha de mañana', () => {
    const today = getTodayInTimezone(BUSINESS_TIMEZONE);
    const tomorrow = getTomorrowInTimezone(BUSINESS_TIMEZONE);
    const todayDate = parseLocalDate(today, BUSINESS_TIMEZONE);
    const tomorrowDate = parseLocalDate(tomorrow, BUSINESS_TIMEZONE);
    const diff = tomorrowDate.getTime() - todayDate.getTime();
    expect(diff).toBeCloseTo(86400000, -3);
  });
});

describe('getLocalDateInTimezone', () => {
  it('debería devolver la fecha local correcta', () => {
    const utcISO = '2026-08-20T12:00:00.000Z';
    const result = getLocalDateInTimezone(utcISO, BUSINESS_TIMEZONE);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDateTimeInBusinessTimezone', () => {
  it('debería formatear fecha y hora en español', () => {
    const utcISO = '2026-08-20T12:00:00.000Z';
    const result = formatDateTimeInBusinessTimezone(utcISO, BUSINESS_TIMEZONE);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
