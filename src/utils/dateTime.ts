/**
 * Utilidades centralizadas para manejo de fechas/horas en la timezone del negocio.
 * 
 * Regla de oro: NUNCA usar `new Date("YYYY-MM-DD")` directamente porque
 * interpreta la fecha como UTC medianoche, lo que causa drift cuando el cliente
 * está en otra timezone.
 * 
 * Siempre usar las funciones exportadas para parsing/conversión.
 */

export const BUSINESS_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Mapeo: JS getDay() (0=Dom) → día de negocio (1=Lun, 2=Mar, ..., 7=Dom)
export function jsDayToBusinessDay(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

// Mapeo inverso: día de negocio → JS getDay()
export function businessDayToJsDay(bizDay: number): number {
  return bizDay === 7 ? 0 : bizDay;
}

/**
 * Encuentra el offset UTC (en ms) de una timezone para una fecha específica.
 * El offset es la cantidad que hay que RESTAR de la hora local para obtener UTC.
 * Ejemplo: Argentina UTC-3 → offset = -3 horas → UTC = local - (-3h) = local + 3h
 */
function getTimezoneOffsetMs(dateStr: string, timezone: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Usar 12:00 UTC del día como referencia (menos probable que cruce día)
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(new Date(utcNoon));
  let localHour = 0, localMinute = 0, localSecond = 0;
  let localDay = 0;
  
  for (const part of parts) {
    const val = parseInt(part.value, 10);
    switch (part.type) {
      case 'day': localDay = val; break;
      case 'hour': localHour = val; break;
      case 'minute': localMinute = val; break;
      case 'second': localSecond = val; break;
    }
  }
  
  // Calcular la diferencia en horas
  // Si UTC noon (12:00) muestra 09:00 en la timezone, significa que la timezone está 3 horas atrás de UTC
  // offset = local - UTC = 9 - 12 = -3 horas
  // Para convertir local a UTC: UTC = local - offset = local - (-3h) = local + 3h
  const utcHour = 12;
  const utcMinute = 0;
  
  let offsetMs = (localHour - utcHour) * 3600 * 1000 + (localMinute - utcMinute) * 60 * 1000;
  
  // Ajustar si hay cambio de día
  if (localDay !== day) {
    const diffDays = localDay - day;
    offsetMs -= diffDays * 86400000;
  }
  
  return offsetMs;
}

/**
 * Parsea una string YYYY-MM-DD y devuelve un Date object que representa
 * medianoche EN LA TIMEZONE del negocio, no UTC.
 */
export function parseLocalDate(dateStr: string, timezone: string = BUSINESS_TIMEZONE): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Medianoche local en ms (usando UTC como referencia)
  const localMidnightMs = Date.UTC(year, month - 1, day, 0, 0, 0);
  
  // Obtener el offset de la timezone
  const offsetMs = getTimezoneOffsetMs(dateStr, timezone);
  
  // UTC = local - offset
  // Ejemplo: Argentina UTC-3, offset = -3h → UTC = 00:00 - (-3h) = 03:00 UTC
  return new Date(localMidnightMs - offsetMs);
}

/**
 * Dado un date/time en la timezone del negocio, devuelve el ISO string UTC.
 * 
 * Ejemplo: date='2026-08-20', time='09:00', tz='America/Argentina/Buenos_Aires'
 * → '2026-08-20T12:00:00.000Z' (porque Argentina es UTC-3 en agosto)
 */
export function buildTimestampISO(
  dateStr: string,
  timeStr: string,
  timezone: string = BUSINESS_TIMEZONE
): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Medianoche local en ms
  const localMidnightMs = Date.UTC(year, month - 1, day, 0, 0, 0);
  
  // Obtener el offset de la timezone
  const offsetMs = getTimezoneOffsetMs(dateStr, timezone);
  
  // La hora local deseada en ms desde medianoche
  const localTimeMs = (hours * 3600 + minutes * 60) * 1000;
  
  // UTC = local - offset
  const utcMs = localMidnightMs - offsetMs + localTimeMs;
  
  return new Date(utcMs).toISOString();
}

/**
 * Dado un date/time en la timezone del negocio, devuelve el Date object UTC.
 */
export function buildTimestampDate(
  dateStr: string,
  timeStr: string,
  timezone: string = BUSINESS_TIMEZONE
): Date {
  return new Date(buildTimestampISO(dateStr, timeStr, timezone));
}

/**
 * Formatea un timestamp ISO (UTC) a la hora local del negocio.
 */
export function formatTimeInBusinessTimezone(
  isoString: string,
  timezone: string = BUSINESS_TIMEZONE,
  options?: { hour12?: boolean }
): string {
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: options?.hour12 ?? true,
  }).format(date);
}

/**
 * Formatea un timestamp ISO (UTC) a la hora local del negocio con fecha.
 */
export function formatDateTimeInBusinessTimezone(
  isoString: string,
  timezone: string = BUSINESS_TIMEZONE
): string {
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Returns the local date string (YYYY-MM-DD) for a given timezone.
 * Uses Intl to correctly handle DST transitions.
 */
export function getLocalDateInTimezone(isoString: string, timezone: string = BUSINESS_TIMEZONE): string {
  const date = new Date(isoString);
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Returns the local date string (YYYY-MM-DD) for today in a given timezone.
 */
export function getTodayInTimezone(timezone: string = BUSINESS_TIMEZONE): string {
  return getLocalDateInTimezone(new Date().toISOString(), timezone);
}

/**
 * Returns the local date string (YYYY-MM-DD) for tomorrow in a given timezone.
 */
export function getTomorrowInTimezone(timezone: string = BUSINESS_TIMEZONE): string {
  const today = getTodayInTimezone(timezone);
  const todayDate = parseLocalDate(today, timezone);
  const tomorrowDate = new Date(todayDate.getTime() + 86400000);
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(tomorrowDate);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Format an ISO timestamp to time string (HH:MM) in the business timezone.
 */
export function formatTimeInTimezone(isoString: string, timezone: string = BUSINESS_TIMEZONE): string {
  if (!isoString || isNaN(new Date(isoString).getTime())) {
    return '';
  }
  
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Format an ISO timestamp to date string (DD/MM) in the business timezone.
 */
export function formatDateShortInTimezone(isoString: string, timezone: string = BUSINESS_TIMEZONE): string {
  const date = new Date(isoString);
  
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

/**
 * Formatea un date string (YYYY-MM-DD) a formato legible en español.
 * Usa Intl para parsing correcto sin drift UTC.
 */
export function formatDate(dateStr: string, timezone: string = BUSINESS_TIMEZONE): string {
  const date = parseLocalDate(dateStr, timezone);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

/**
 * Formatea un timestamp ISO a formato legible.
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek];
}

export function getTimeSlots(
  openTime: string,
  closeTime: string,
  stepMinutes = 30
): string[] {
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;
  const slots: string[] = [];

  while (currentMin < closeMin) {
    slots.push(
      `${String(Math.floor(currentMin / 60)).padStart(2, '0')}:${String(currentMin % 60).padStart(2, '0')}`
    );
    currentMin += stepMinutes;
  }

  return slots;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Agrega N días a un date string YYYY-MM-DD y devuelve el nuevo string.
 * Safe para usar con cualquier timezone.
 */
export function addDaysToDate(dateStr: string, days: number, timezone: string = BUSINESS_TIMEZONE): string {
  const date = parseLocalDate(dateStr, timezone);
  const result = new Date(date.getTime() + days * 86400000);
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(result);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha YYYY-MM-DD cae en un día de negocio específico.
 * 
 * Ejemplo: isDayOfWeek('2026-08-24', 1, 'America/Argentina/Buenos_Aires')
 * → true si el 24/08/2026 es Lunes en esa timezone
 */
export function isDayOfWeek(dateStr: string, businessDay: number, timezone: string = BUSINESS_TIMEZONE): boolean {
  const date = parseLocalDate(dateStr, timezone);
  const jsDay = date.getDay();
  const bizDay = jsDayToBusinessDay(jsDay);
  return bizDay === businessDay;
}

/**
 * Convert time string HH:mm to total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes from midnight to time string HH:mm.
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate time slots for a single time range.
 */
export function generateSlotsForRange(
  startTime: string,
  endTime: string,
  stepMinutes: number = 15
): string[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const slots: string[] = [];

  let currentMin = startMin;
  while (currentMin < endMin) {
    slots.push(minutesToTime(currentMin));
    currentMin += stepMinutes;
  }

  return slots;
}

/**
 * Generate all available time slots for multiple time ranges.
 * Returns sorted array of unique time strings.
 */
export function generateSlotsForRanges(
  ranges: Array<{ startTime: string; endTime: string }>,
  stepMinutes: number = 15
): string[] {
  const allSlots = new Set<string>();

  for (const range of ranges) {
    const slots = generateSlotsForRange(range.startTime, range.endTime, stepMinutes);
    slots.forEach(slot => allSlots.add(slot));
  }

  // Sort by time
  return Array.from(allSlots).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

/**
 * Validate time ranges for a given day.
 * Returns array of error messages (empty if valid).
 */
export function validateTimeRanges(ranges: Array<{ startTime: string; endTime: string }>): string[] {
  const errors: string[] = [];

  // Check each range
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const startMin = timeToMinutes(range.startTime);
    const endMin = timeToMinutes(range.endTime);

    if (startMin >= endMin) {
      errors.push(`La franja ${i + 1} debe tener start_time < end_time`);
    }
  }

  // Check for overlaps using original indices
  const indexedRanges = ranges.map((r, i) => ({ ...r, originalIndex: i }));
  const sortedRanges = [...indexedRanges].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  for (let i = 0; i < sortedRanges.length - 1; i++) {
    const currentEnd = timeToMinutes(sortedRanges[i].endTime);
    const nextStart = timeToMinutes(sortedRanges[i + 1].startTime);

    if (currentEnd > nextStart) {
      const firstLabel = sortedRanges[i].originalIndex + 1;
      const secondLabel = sortedRanges[i + 1].originalIndex + 1;
      errors.push(`Las franjas ${firstLabel} y ${secondLabel} se superponen`);
    }
  }

  return errors;
}
