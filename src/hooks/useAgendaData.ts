import * as React from 'react';
import { supabase, type Appointment, type Service } from '../lib/supabase';
import {
  getTodayInTimezone,
  getLocalDateInTimezone,
  formatTimeInTimezone,
} from '../utils/helpers';
import type { AppointmentStatusLower } from '../types/index';

const PENDING_STATUSES = ['PENDING', 'REQUIRES_DEPOSIT'];

function mapDbStatus(status: string): AppointmentStatusLower {
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

export interface AgendaAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  services: string;
  serviceNames: string;
  totalDuration: number;
  totalPrice: number;
  date: string;
  time: string;
  endTime: string;
  status: AppointmentStatusLower;
  requiresDeposit: boolean;
  serviceDetails?: Array<{ name: string; price: number; duration_minutes: number }>;
}

export interface UseAgendaDataReturn {
  appointments: AgendaAppointment[];
  appointmentsByDate: Record<string, AgendaAppointment[]>;
  appointmentCountByDate: Record<string, number>;
  pendingCountByDate: Record<string, number>;
  totalPendingCount: number;
  todayCount: number;
  weekCount: number;
  calendarCountByDate: Record<string, number>;
  calendarPendingCountByDate: Record<string, number>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface MonthData {
  year: number;
  month: number;
  appointments: AgendaAppointment[];
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function useAgendaData(
  businessId: string | null,
  bizTimezone: string,
  selectedDate: string
): UseAgendaDataReturn {
  const [monthData, setMonthData] = React.useState<MonthData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [calendarCountByDate, setCalendarCountByDate] = React.useState<Record<string, number>>({});
  const [calendarPendingCountByDate, setCalendarPendingCountByDate] = React.useState<Record<string, number>>({});

  const fetchRange = React.useCallback(
    async (year: number, month: number, force?: boolean) => {
      if (!businessId) return;

      setLoading(true);
      setError(null);

      const monthKey = getMonthKey(year, month);
      if (monthData.find((d) => getMonthKey(d.year, d.month) === monthKey) && !force) {
        setLoading(false);
        return;
      }

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

      const startStr = firstDay.toISOString();
      const endStr = lastDay.toISOString();

      try {
        const { data, error: err } = await supabase
          .from('appointments')
          .select(
            `
            id, business_id, customer_name, customer_phone, customer_email, notes,
            start_at, end_at, status, created_at, updated_at,
            appointment_services:appointment_services(service_id, price, duration_minutes)
          `
          )
          .eq('business_id', businessId)
          .gte('start_at', startStr)
          .lte('start_at', endStr)
          .order('start_at', { ascending: true });

        if (err) throw err;

        // Collect all service IDs to fetch names in batch
        const allServiceIds = new Set<string>();
        const aptWithServices = (data || []).map((apt: any) => {
          if (apt.appointment_services) {
            apt.appointment_services.forEach((aps: any) => allServiceIds.add(aps.service_id));
          }
          return apt;
        });

        // Fetch all service names
        let serviceMap: Record<string, string> = {};
        if (allServiceIds.size > 0) {
          const { data: svcData } = await supabase
            .from('services')
            .select('id, name')
            .in('id', Array.from(allServiceIds)) as { data: Array<{ id: string; name: string }> | null; error: unknown };

          if (svcData) {
            svcData.forEach(s => { serviceMap[s.id] = s.name; });
          }
        }

        const mapped: AgendaAppointment[] = aptWithServices.map(
          (apt: any) => {
            const serviceNames: string[] = [];
            const serviceDetails: Array<{ name: string; price: number; duration_minutes: number }> = [];
            let totalDuration = 0;
            let totalPrice = 0;

            if (apt.appointment_services && apt.appointment_services.length > 0) {
              for (const aps of apt.appointment_services) {
                const svcName = serviceMap[aps.service_id] || 'Servicio eliminado';
                serviceNames.push(svcName);
                serviceDetails.push({
                  name: svcName,
                  price: Number(aps.price) || 0,
                  duration_minutes: aps.duration_minutes || 0,
                });
                totalDuration += aps.duration_minutes || 0;
                totalPrice += Number(aps.price) || 0;
              }
            }

            return {
              id: apt.id,
              clientName: apt.customer_name,
              clientPhone: apt.customer_phone,
              services: serviceNames.length > 0 ? serviceNames.join(' + ') : 'Servicio eliminado',
              serviceNames: serviceNames.length > 0 ? serviceNames.join(' + ') : 'Servicio eliminado',
              totalDuration,
              totalPrice,
              date: getLocalDateInTimezone(apt.start_at, bizTimezone),
              time: formatTimeInTimezone(apt.start_at, bizTimezone),
              endTime: formatTimeInTimezone(apt.end_at, bizTimezone),
              status: mapDbStatus(apt.status),
              requiresDeposit: false,
              serviceDetails: serviceDetails.length > 0 ? serviceDetails : undefined,
            };
          }
        );

        setMonthData((prev) => [
          ...prev.filter((d) => getMonthKey(d.year, d.month) !== monthKey),
          { year, month, appointments: mapped },
        ]);

        // Fetch ALL statuses for calendar historical counts
        const { data: allData, error: allErr } = await supabase
          .from('appointments')
          .select('start_at, status')
          .eq('business_id', businessId)
          .gte('start_at', startStr)
          .lte('start_at', endStr) as { data: Array<{ start_at: string; status: string }> | null; error: unknown };

        if (allErr) throw allErr;

        const allCounts: Record<string, number> = {};
        const allPendingCounts: Record<string, number> = {};
        const allAppts = allData || [];

        for (const apt of allAppts) {
          const day = getLocalDateInTimezone(apt.start_at as string, bizTimezone);
          allCounts[day] = (allCounts[day] || 0) + 1;
          const status = (apt.status as string).toUpperCase();
          if (PENDING_STATUSES.includes(status)) {
            allPendingCounts[day] = (allPendingCounts[day] || 0) + 1;
          }
        }

        setCalendarCountByDate((prev) => ({ ...prev, ...allCounts }));
        setCalendarPendingCountByDate((prev) => ({ ...prev, ...allPendingCounts }));
      } catch (e) {
        console.error('Error fetching appointments:', e);
        setError('Error al cargar la agenda.');
      } finally {
        setLoading(false);
      }
    },
    [businessId, bizTimezone, monthData]
  );

  const ensureMonthLoaded = React.useCallback(
    (year: number, month: number) => {
      const monthKey = getMonthKey(year, month);
      if (!monthData.find((d) => getMonthKey(d.year, d.month) === monthKey)) {
        fetchRange(year, month);
      }
    },
    [monthData, fetchRange]
  );

  const ensureTodayLoaded = React.useCallback(() => {
    const todayStr = getTodayInTimezone(bizTimezone);
    const todayDate = new Date(todayStr + 'T00:00:00');
    const year = todayDate.getFullYear();
    const month = todayDate.getMonth();
    ensureMonthLoaded(year, month);
  }, [bizTimezone, ensureMonthLoaded]);

  React.useEffect(() => {
    if (!businessId) return;
    ensureTodayLoaded();
  }, [businessId, ensureTodayLoaded]);

  React.useEffect(() => {
    if (!businessId || !selectedDate) return;
    const d = new Date(selectedDate + 'T00:00:00');
    ensureMonthLoaded(d.getFullYear(), d.getMonth());
  }, [businessId, selectedDate, ensureMonthLoaded]);

  const allAppointments = React.useMemo(() => {
    return monthData.flatMap((d) => d.appointments);
  }, [monthData]);

  const appointmentsByDate = React.useMemo(() => {
    const grouped: Record<string, AgendaAppointment[]> = {};
    for (const apt of allAppointments) {
      if (!grouped[apt.date]) grouped[apt.date] = [];
      grouped[apt.date].push(apt);
    }
    return grouped;
  }, [allAppointments]);

  const appointmentCountByDate = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [date, apts] of Object.entries(appointmentsByDate)) {
      counts[date] = apts.length;
    }
    return counts;
  }, [appointmentsByDate]);

  const pendingCountByDate = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const apt of allAppointments) {
      if (PENDING_STATUSES.includes(apt.status.toUpperCase())) {
        counts[apt.date] = (counts[apt.date] || 0) + 1;
      }
    }
    return counts;
  }, [allAppointments]);

  const totalPendingCount = React.useMemo(() => {
    return Object.values(pendingCountByDate).reduce((sum, c) => sum + c, 0);
  }, [pendingCountByDate]);

  const todayStr = React.useMemo(() => getTodayInTimezone(bizTimezone), [bizTimezone]);
  const todayCount = React.useMemo(
    () => appointmentCountByDate[todayStr] || 0,
    [appointmentCountByDate, todayStr]
  );

  const weekCount = React.useMemo(() => {
    const date = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(date.getTime() - daysSinceMonday * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

    const startStr = weekStart.toISOString();
    const endStr = weekEnd.toISOString();

    return Object.entries(appointmentCountByDate).reduce((sum, [date, count]) => {
      if (date >= startStr.slice(0, 10) && date <= endStr.slice(0, 10)) {
        return sum + count;
      }
      return sum;
    }, 0);
  }, [appointmentCountByDate, todayStr]);

  return {
    appointments: allAppointments,
    appointmentsByDate,
    appointmentCountByDate,
    pendingCountByDate,
    totalPendingCount,
    todayCount,
    weekCount,
    calendarCountByDate,
    calendarPendingCountByDate,
    loading,
    error,
    refetch: () => {
      if (businessId) {
        const d = new Date(selectedDate + 'T00:00:00');
        fetchRange(d.getFullYear(), d.getMonth(), true);
      }
    },
  };
}
