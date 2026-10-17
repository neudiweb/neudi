// Re-exportar todas las utilidades de dateTime.ts para mantener compatibilidad
export {
  BUSINESS_TIMEZONE,
  jsDayToBusinessDay,
  businessDayToJsDay,
  parseLocalDate,
  buildTimestampISO,
  buildTimestampDate,
  formatTimeInBusinessTimezone,
  formatDateTimeInBusinessTimezone,
  getLocalDateInTimezone,
  getTodayInTimezone,
  getTomorrowInTimezone,
  formatTimeInTimezone,
  formatDateShortInTimezone,
  formatDate,
  formatDateTime,
  getDayName,
  getTimeSlots,
  getDaysInMonth,
  isToday,
  addDaysToDate,
  isDayOfWeek,
  timeToMinutes,
  minutesToTime,
  generateSlotsForRange,
  generateSlotsForRanges,
  validateTimeRanges,
} from './dateTime';

// Funciones legacy que no están en dateTime.ts
export function formatPrice(price: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(price);
}
