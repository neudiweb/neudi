import type { AppointmentStatus, AppointmentStatusLower } from '@/types/index';

/**
 * Statuses considered "pending" (used for counts and calendar badges).
 * Stored uppercase, matching the DB values.
 */
export const PENDING_STATUSES = ['PENDING', 'REQUIRES_DEPOSIT'];

/**
 * Maps a raw DB status (uppercase) to the lowercase status used in the app.
 * Unknown values fall back to 'pending'.
 */
export function mapDbStatus(status: string): AppointmentStatusLower {
  const mapping: Record<string, AppointmentStatusLower> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REQUIRES_DEPOSIT: 'requires_deposit',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    NO_SHOW: 'no_show',
  };
  return mapping[status] ?? ('pending' as AppointmentStatusLower);
}

/** Human-readable labels for lowercase statuses. */
export const STATUS_LABELS: Record<AppointmentStatusLower, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  requires_deposit: 'Requiere depósito',
  rejected: 'Rechazado',
  expired: 'Expirado',
  no_show: 'No asistió',
};

/**
 * Converts a lowercase app status to the uppercase DB status.
 */
export function toDbStatus(status: AppointmentStatusLower): AppointmentStatus {
  return status.toUpperCase() as AppointmentStatus;
}
