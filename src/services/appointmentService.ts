import { supabase, type Service } from '@/lib';
import type { Slot, AppointmentStatus, AppointmentStatusLower } from '../types';
import { buildTimestampISO, parseLocalDate } from '../utils/helpers';

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  REQUIRES_DEPOSIT: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
  COMPLETED: ['NO_SHOW'],
  NO_SHOW: ['CONFIRMED', 'COMPLETED'],
};

export function validateTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return VALID_TRANSITIONS[status] === undefined || VALID_TRANSITIONS[status].length === 0;
}

export function getValidTransitions(from: AppointmentStatus): AppointmentStatus[] {
  return VALID_TRANSITIONS[from] || [];
}

function lowerToUpper(status: AppointmentStatusLower): AppointmentStatus {
  return status.toUpperCase() as AppointmentStatus;
}

export interface CreateAppointmentInput {
  businessSlug: string;
  serviceIds: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (in business timezone)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes?: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  date: string;
  slots: Array<{ time: string; available: boolean }>;
}

export async function getAvailableSlots(
  businessSlug: string,
  serviceIds: string[],
  date: string,
  excludeAppointments?: string[]
): Promise<Slot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_business_slug: businessSlug,
    p_service_ids: serviceIds,
    p_date: date,
    p_exclude_appointment_id: excludeAppointments?.[0] || null,
  } as any) as { data: { success: boolean; slots?: Array<{ time: string; available: boolean }> } | null; error: unknown };

  if (error) {
    console.error('Error fetching available slots:', error);
    return [];
  }

  const slots = data?.slots || [];

  // Return only available slots with the Slot type
  return slots.filter((s) => s.available).map((s) => ({
    time: s.time,
    available: true,
  }));
}

export async function createAppointment(input: CreateAppointmentInput): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    if (input.serviceIds.length === 0) {
      return { success: false, error: 'Debe seleccionar al menos un servicio' };
    }

    // Fetch all services to get total duration and business timezone
    const { data: services, error: svcError } = await supabase
      .from('services')
      .select('duration_minutes, business_id')
      .in('id', input.serviceIds) as { data: Array<{ duration_minutes: number; business_id: string }> | null; error: unknown };

    if (svcError || !services || services.length === 0) {
      return { success: false, error: 'Servicio no encontrado' };
    }

    if (services.length !== input.serviceIds.length) {
      return { success: false, error: 'Uno o más servicios no encontrados' };
    }

    const totalDurationMinutes = services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    
    // Get business timezone
    const { data: business } = await supabase
      .from('businesses')
      .select('timezone')
      .eq('slug', input.businessSlug)
      .single() as { data: { timezone: string } | null; error: unknown };

    const bizTimezone = business?.timezone || 'America/Argentina/Buenos_Aires';

    // Calculate end time in business local timezone (handle day rollover)
    const [startHours, startMinutes] = input.time.split(':').map(Number);
    let endTotalMinutes = startHours * 60 + startMinutes + totalDurationMinutes;
    let endDayOffset = 0;
    if (endTotalMinutes >= 1440) {
      endDayOffset = Math.floor(endTotalMinutes / 1440);
      endTotalMinutes -= endDayOffset * 1440;
    }
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;

    // Parse start date and add day offset for end date (safe timezone handling)
    const startDateObj = parseLocalDate(input.date, bizTimezone);
    const endDateObj = new Date(startDateObj.getTime() + endDayOffset * 86400000);
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: bizTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const endParts = formatter.formatToParts(endDateObj);
    const endYear = endParts.find(p => p.type === 'year')?.value || '';
    const endMonth = endParts.find(p => p.type === 'month')?.value || '';
    const endDay = endParts.find(p => p.type === 'day')?.value || '';
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    // Build timestamps in business timezone → UTC ISO strings
    const startISO = buildTimestampISO(input.date, input.time, bizTimezone);
    const endISO = buildTimestampISO(endDateStr, `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`, bizTimezone);

    const { data, error } = await supabase.rpc('create_public_appointment', {
      p_business_slug: input.businessSlug,
      p_service_ids: input.serviceIds,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_customer_email: input.customerEmail || null,
      p_start_at: startISO,
      p_end_at: endISO,
      p_notes: input.customerNotes ?? null,
      p_exclude_appointment_id: null,
    } as any) as { data: { success: boolean; appointment_id?: string; message?: string; error?: string; total_duration?: number; total_price?: number } | null; error: unknown };

    console.log('[createAppointment] Raw RPC result:', { data, error });

    if (error) {
      const errObj = error as Record<string, unknown>;
      if ('success' in errObj || 'message' in errObj || 'error' in errObj) {
        // Custom error from RPC
        if (errObj.success === false) {
          return { success: false, error: (errObj.message as string) || 'Error al crear la reserva' };
        }
        return { success: false, error: 'Error al crear la reserva' };
      }
      return { success: false, error: 'Error al crear la reserva' };
    }

    if (!data) {
      console.error('[createAppointment] No response from RPC');
      return { success: false, error: 'Error al crear la reserva. Intentá nuevamente.' };
    }

    console.log('[createAppointment] Parsed response:', data);

    if (data.success === false || !data.success) {
      const errMsg = data.message || data.error || 'Error al crear la reserva';
      console.log('[createAppointment] Business error:', errMsg);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      appointmentId: data.appointment_id,
    };
  } catch (e) {
    console.error('Error creating appointment:', e);
    return { success: false, error: String(e) };
  }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('appointments')
      .select('status')
      .eq('id', appointmentId)
      .single() as { data: { status: string } | null; error: unknown };

    if (!existing) {
      return { success: false, error: 'Turno no encontrado' };
    }

    const currentStatus = existing.status as AppointmentStatus;
    const validTargets = VALID_TRANSITIONS[currentStatus];

    if (!validTargets || !validTargets.includes(status)) {
      return {
        success: false,
        error: `Transición inválida: ${currentStatus} → ${status}`,
      };
    }

    const { error } = await ((supabase as any).from('appointments').update({ status }).eq('id', appointmentId) as { error: unknown });

    if (error) {
      console.error('Error updating appointment:', error);
      return { success: false, error: String(error) };
    }

    return { success: true };
  } catch (e) {
    console.error('Error updating appointment:', e);
    return { success: false, error: String(e) };
  }
}

export async function updateAppointmentStatusLower(
  appointmentId: string,
  status: AppointmentStatusLower
): Promise<{ success: boolean; error?: string }> {
  return updateAppointmentStatus(appointmentId, lowerToUpper(status));
}

export async function getBusinessAppointments(
  businessId: string,
  date?: string
): Promise<any[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      services(name, duration_minutes)
    `)
    .eq('business_id', businessId)
    .order('start_at', { ascending: true });

  if (date) {
    // date is YYYY-MM-DD, match start_at::date
    query = query.eq('start_at::date', date);
  }

  const { data, error } = await query as { data: any[] | null; error: string | null };

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  return data || [];
}

export async function getCustomerAppointments(phone: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      services(name, duration_minutes)
    `)
    .eq('customer_phone', phone)
    .order('start_at', { ascending: false }) as { data: any[] | null; error: string | null };

  if (error) {
    console.error('Error fetching customer appointments:', error);
    return [];
  }

  return data || [];
}

export interface RescheduleAppointmentInput {
  appointmentId: string;
  businessSlug: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (in business timezone)
}

export interface RescheduleResult {
  success: boolean;
  appointmentId?: string;
  status?: string;
  startAt?: string;
  endAt?: string;
  error?: string;
}

export async function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<RescheduleResult> {
  try {
    // Fetch the appointment to get total duration from appointment_services
    const { data: apt, error: aptError } = await supabase
      .from('appointments')
      .select(`
        id, business_id,
        appointment_services:appointment_services(duration_minutes)
      `)
      .eq('id', input.appointmentId)
      .single() as { data: { business_id: string; appointment_services: Array<{ duration_minutes: number }> } | null; error: unknown };

    if (aptError || !apt) {
      return { success: false, error: 'Turno no encontrado' };
    }

    const totalDurationMinutes = apt.appointment_services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    if (totalDurationMinutes === 0) {
      return { success: false, error: 'Duración del turno no encontrada' };
    }

    // Get business timezone
    const { data: business } = await supabase
      .from('businesses')
      .select('timezone')
      .eq('slug', input.businessSlug)
      .single() as { data: { timezone: string } | null; error: unknown };

    const bizTimezone = business?.timezone || 'America/Argentina/Buenos_Aires';

    // Calculate end time in business local timezone (handle day rollover)
    const [startHours, startMinutes] = input.time.split(':').map(Number);
    let endTotalMinutes = startHours * 60 + startMinutes + totalDurationMinutes;
    let endDayOffset = 0;
    if (endTotalMinutes >= 1440) {
      endDayOffset = Math.floor(endTotalMinutes / 1440);
      endTotalMinutes -= endDayOffset * 1440;
    }
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMins = endTotalMinutes % 60;

    // Parse start date and add day offset for end date (safe timezone handling)
    const startDateObj = parseLocalDate(input.date, bizTimezone);
    const endDateObj = new Date(startDateObj.getTime() + endDayOffset * 86400000);

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: bizTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const endParts = formatter.formatToParts(endDateObj);
    const endYear = endParts.find(p => p.type === 'year')?.value || '';
    const endMonth = endParts.find(p => p.type === 'month')?.value || '';
    const endDay = endParts.find(p => p.type === 'day')?.value || '';
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    // Build timestamps in business timezone -> UTC ISO strings
    const startISO = buildTimestampISO(input.date, input.time, bizTimezone);
    const endISO = buildTimestampISO(endDateStr, `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`, bizTimezone);

    const { data, error } = await supabase.rpc('reschedule_appointment', {
      p_appointment_id: input.appointmentId,
      p_new_start_at: startISO,
      p_new_end_at: endISO,
    } as any) as { data: { success: boolean; appointment_id?: string; status?: string; start_at?: string; end_at?: string; message?: string; error?: string } | null; error: unknown };

    if (error) {
      const errObj = error as Record<string, unknown>;
      // Check for custom error codes (23P01 = slot conflict, P0001 = business logic)
      if (errObj.code === '23P01' && errObj.message === 'SLOT_UNAVAILABLE') {
        return { success: false, error: 'El horario seleccionado ya no está disponible. Elegí otro horario.' };
      }
      if (errObj.code === 'P0001' && typeof errObj.message === 'string') {
        const message = errObj.message as string;
        switch (message) {
          case 'OUTSIDE_HOURS':
            return { success: false, error: 'El horario seleccionado está fuera del horario comercial.' };
          case 'BUSINESS_CLOSED':
            return { success: false, error: 'El negocio está cerrado ese día.' };
          case 'INVALID_DURATION':
            return { success: false, error: 'La duración del horario no coincide con el servicio.' };
          case 'INVALID_TIME_RANGE':
            return { success: false, error: 'El rango horario seleccionado no es válido.' };
          case 'STATUS_NOT_RESCHEDULABLE':
            return { success: false, error: 'Este turno ya no puede ser reagendado.' };
          case 'APPOINTMENT_NOT_FOUND':
            return { success: false, error: 'El turno ya no existe o fue modificado.' };
          default:
            return { success: false, error: errObj.detail as string || errObj.message as string || 'Error al reagendar el turno.' };
        }
      }
      return { success: false, error: 'Error al reagendar el turno. Intentá de nuevo.' };
    }

    if (!data) {
      return { success: false, error: 'Error al reagendar el turno. Intentá de nuevo.' };
    }

    if (data.success === false || !data.success) {
      const errMsg = data.message || data.error || 'Error al reagendar el turno.';
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      appointmentId: data.appointment_id,
      status: data.status,
      startAt: data.start_at,
      endAt: data.end_at,
    };
  } catch (e) {
    console.error('Error rescheduling appointment:', e);
    return { success: false, error: 'Error al reagendar el turno. Intentá de nuevo.' };
  }
}
