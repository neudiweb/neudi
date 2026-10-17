import * as React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase, type Service, type Business } from '../../lib/supabase';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, LoadingSpinner } from '../../components/common/States';
import { ErrorModal } from '../../components/ErrorModal';
import type { AppointmentStatusLower } from '../../types/index';
import {
  formatTimeInTimezone,
  getTodayInTimezone,
  getTomorrowInTimezone,
  BUSINESS_TIMEZONE,
  parseLocalDate,
  addDaysToDate,
  buildTimestampISO,
} from '../../utils/helpers';
import { UpcomingHolidayNotice } from '../../components/dashboard/UpcomingHolidayNotice';
import { MonthlyCalendar } from '../../components/dashboard/MonthlyCalendar';
import { AgendaSummary } from '../../components/dashboard/AgendaSummary';
import { useAgendaData } from '../../hooks/useAgendaData';
import { updateAppointmentStatusLower, rescheduleAppointment, getAvailableSlots } from '../../services/appointmentService';

const STATUS_LABELS: Record<AppointmentStatusLower, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  requires_deposit: 'Requiere depósito',
  rejected: 'Rechazado',
  expired: 'Expirado',
  no_show: 'No asistió',
};

export function DashboardAgenda() {
  const { businessSlug } = useAuth();
  const { activeTheme } = useTheme();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [bizTimezone, setBizTimezone] = React.useState(BUSINESS_TIMEZONE);
  const [selectedAppointment, setSelectedAppointment] = React.useState<{
    id: string;
    clientName: string;
    clientPhone: string;
    service: string;
    services: string[];
    serviceNames: string;
    date: string;
    time: string;
    endTime: string;
    totalDuration: number;
    totalPrice: number;
    status: AppointmentStatusLower;
    requiresDeposit: boolean;
    serviceId?: string;
    serviceDetails?: Array<{ name: string; price: number; duration_minutes: number }>;
  } | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const todayStrRef = React.useRef(getTodayInTimezone(BUSINESS_TIMEZONE));
  const [selectedDate, setSelectedDate] = React.useState(() => {
    return getTodayInTimezone(BUSINESS_TIMEZONE);
  });

  const isInitialMount = React.useRef(true);

  // Modal state for adding appointment
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [savingAppointment, setSavingAppointment] = React.useState(false);
  const [services, setServices] = React.useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>([]);
  const [totalDuration, setTotalDuration] = React.useState(0);
  const [totalPrice, setTotalPrice] = React.useState(0);
  const [formName, setFormName] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formDate, setFormDate] = React.useState('');
  const [formTime, setFormTime] = React.useState('09:00');
  const [formNotes, setFormNotes] = React.useState('');

  // Available slots for add modal
  const [addSlots, setAddSlots] = React.useState<Array<{ time: string; available: boolean }>>([]);
  const [addLoadingSlots, setAddLoadingSlots] = React.useState(false);
  const [addSlotError, setAddSlotError] = React.useState<string | null>(null);

  // Slot conflict toast
  const [slotConflict, setSlotConflict] = React.useState<{ occupied: string; endAt: string } | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = React.useState(false);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleTime, setRescheduleTime] = React.useState('');
  const [rescheduleSlots, setRescheduleSlots] = React.useState<Array<{ time: string; available: boolean }>>([]);
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = React.useState(false);

  // Fetch business_id from slug
  React.useEffect(() => {
    if (!businessSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('businesses')
          .select('id, timezone')
          .eq('slug', businessSlug)
          .single() as { data: Business | null; error: string | null };
        if (!cancelled && data) {
          setBusinessId(data.id);
          const tz = data.timezone || 'America/Argentina/Buenos_Aires';
          setBizTimezone(tz);
          todayStrRef.current = getTodayInTimezone(tz);
        }
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [businessSlug]);

  // Agenda data hook — range fetch + local grouping
  const {
    appointmentsByDate,
    calendarCountByDate,
    calendarPendingCountByDate,
    totalPendingCount,
    todayCount,
    weekCount,
    refetch: refetchAgenda,
  } = useAgendaData(businessId, bizTimezone, selectedDate);

  React.useEffect(() => {
    if (businessId && isInitialMount.current) {
      isInitialMount.current = false;
      setLoading(false);
      return;
    }
  }, [businessId]);

  const navigateDate = (dir: number) => {
    const newDate = addDaysToDate(selectedDate, dir, bizTimezone);
    setSelectedDate(newDate);
  };

  const goToday = () => {
    setSelectedDate(getTodayInTimezone(bizTimezone));
  };

  const onDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  const handleDateSelect = React.useCallback(
    (date: string) => {
      setSelectedDate(date);
    },
    []
  );

  const handleMonthChange = React.useCallback(
    (date: string) => {
      setSelectedDate(date);
    },
    []
  );

  // Real-time subscription for appointment changes
  React.useEffect(() => {
    if (!businessId) return;
    
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`,
        },
        () => refetchAgenda()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, refetchAgenda]);

  // Reschedule handlers
  const openRescheduleModal = (apt: typeof selectedAppointment) => {
    if (!apt) return;
    setSelectedAppointment(apt);
    setRescheduleDate(selectedDate);
    setRescheduleTime(apt.time);
    setRescheduleSlots([]);
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleSlots([]);
    setRescheduleLoadingSlots(false);
  };

  const fetchRescheduleSlots = React.useCallback(async (date: string, serviceIds: string[], excludeId?: string) => {
    if (!businessSlug || serviceIds.length === 0 || !date) return;
    setRescheduleLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(businessSlug, serviceIds ?? [], date, excludeId ? [excludeId] : undefined);
      setRescheduleSlots(slots);
    } catch (e) {
      console.error('Error fetching reschedule slots:', e);
      setRescheduleSlots([]);
    } finally {
      setRescheduleLoadingSlots(false);
    }
  }, [businessSlug]);

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime || !businessSlug) return;

    setRescheduling(true);
    try {
      const result = await rescheduleAppointment({
        appointmentId: selectedAppointment.id,
        businessSlug,
        date: rescheduleDate,
        time: rescheduleTime,
      });

      if (!result.success) {
        setActionError(result.error || 'Error al reagendar el turno.');
        return;
      }

      refetchAgenda();
      closeRescheduleModal();
      setSelectedAppointment(null);
    } catch (e) {
      console.error('Error rescheduling appointment:', e);
      setActionError('Error al reagendar el turno. Intentá de nuevo.');
    } finally {
      setRescheduling(false);
    }
  };

  React.useEffect(() => {
    if (showRescheduleModal && rescheduleDate && selectedAppointment) {
      (async () => {
        try {
          const { data: aptData } = await supabase
            .from('appointments')
            .select('appointment_services:appointment_services(service_id)')
            .eq('id', selectedAppointment.id)
            .single() as { data: { appointment_services?: Array<{ service_id: string }> } | null; error: unknown };

          const serviceIds = aptData?.appointment_services?.map(s => s.service_id) || [];
          if (serviceIds.length > 0) {
            fetchRescheduleSlots(rescheduleDate, serviceIds, selectedAppointment.id);
          } else {
            fetchRescheduleSlots(rescheduleDate, [], selectedAppointment.id);
          }
        } catch (e) {
          console.error('Error fetching reschedule services:', e);
        }
      })();
    }
  }, [showRescheduleModal, rescheduleDate, selectedAppointment?.id, fetchRescheduleSlots]);

  const updateStatus = async (id: string, status: AppointmentStatusLower) => {
    try {
      const { success, error } = await updateAppointmentStatusLower(id, status);
      if (!success) {
        console.error('Error updating appointment:', error);
        setActionError(error || 'No se pudo actualizar el turno. Intentá de nuevo.');
        return;
      }
      refetchAgenda();
      setSelectedAppointment(null);
    } catch (e) {
      console.error('Error updating appointment:', e);
      setActionError('No se pudo actualizar el turno. Intentá de nuevo.');
    }
  };

  const dayAppointments = (appointmentsByDate[selectedDate] || []).filter((apt) => {
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        apt.clientName.toLowerCase().includes(q) ||
        apt.serviceNames.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todayStr = getTodayInTimezone(bizTimezone);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getTomorrowInTimezone(bizTimezone);

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hoy';
    if (dateStr === tomorrowStr) return 'Mañana';
    const d = parseLocalDate(dateStr, bizTimezone);
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Default date/time for the add modal based on selected view date
  const openAddModal = () => {
    if (businessId) fetchServices(businessId);
    setFormDate(selectedDate || todayStr);
    setShowAddModal(true);
  };

  // Close modal and reset form
  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedServiceIds([]);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormDate('');
    setFormTime('09:00');
    setFormNotes('');
    setSlotConflict(null);
    setAddSlots([]);
    setAddSlotError(null);
  };

  // Clear slot conflict when time or date changes in the modal
  React.useEffect(() => {
    if (showAddModal) {
      setSlotConflict(null);
    }
  }, [formDate, formTime, selectedServiceIds, showAddModal]);

  // Fetch available slots when date or services change
  React.useEffect(() => {
    if (!showAddModal || !businessSlug || !formDate) {
      setAddSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setAddLoadingSlots(true);
      setAddSlotError(null);
      try {
        const slots = await getAvailableSlots(businessSlug, selectedServiceIds, formDate);
        setAddSlots(slots);
      } catch (e) {
        console.error('Error fetching add slots:', e);
        setAddSlots([]);
      } finally {
        setAddLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [formDate, selectedServiceIds, showAddModal, businessSlug]);

  // When services change, auto-select a valid time
  React.useEffect(() => {
    if (!showAddModal || addSlots.length === 0 || formTime) return;
    const firstAvailable = addSlots.find(s => s.available);
    if (firstAvailable) {
      setFormTime(firstAvailable.time);
    }
  }, [selectedServiceIds, formDate, showAddModal]);

  // Fetch services for the add modal
  const fetchServices = React.useCallback(async (bizId: string) => {
    if (!bizId) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', bizId)
        .eq('is_active', true)
        .order('name') as { data: Service[] | null; error: string | null };

      if (error) throw error;
      setServices(data || []);
    } catch (e) {
      console.error('Error fetching services:', e);
    }
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  React.useEffect(() => {
    const selected = services.filter((s) => selectedServiceIds.includes(s.id));
    setTotalDuration(selected.reduce((sum, s) => sum + (s.duration_minutes || 0), 0));
    setTotalPrice(selected.reduce((sum, s) => sum + (Number(s.price) || 0), 0));
  }, [selectedServiceIds, services]);

  // Submit new appointment via RPC with slot availability check
  const handleAddAppointment = async () => {
    if (!businessSlug || !formName.trim() || !formPhone.trim() || selectedServiceIds.length === 0 || !formDate || !formTime) return;

    setSavingAppointment(true);
    setAddSlotError(null);

    try {
      // Re-verify slot availability right before creating (avoid race condition)
      const currentSlots = await getAvailableSlots(businessSlug, selectedServiceIds, formDate);
      const slotStillAvailable = currentSlots.find(s => s.time === formTime && s.available);
      if (!slotStillAvailable) {
        setAddSlotError('Este horario ya no está disponible. Seleccioná otro horario.');
        // Refresh the slots list to show user what's still available
        setAddSlots(currentSlots);
        return;
      }

      const totalDurationMinutes = totalDuration || services
        .filter((s) => selectedServiceIds.includes(s.id))
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      const startAt = buildTimestampISO(formDate, formTime, bizTimezone);

      const [hours, minutes] = formTime.split(':').map(Number);
      let endTotalMinutes = hours * 60 + minutes + totalDurationMinutes;
      let endDayOffset = 0;
      if (endTotalMinutes >= 1440) {
        endDayOffset = Math.floor(endTotalMinutes / 1440);
      }
      const endTotalMinutesAdj = endTotalMinutes - endDayOffset * 1440;
      const endHours = Math.floor(endTotalMinutesAdj / 60);
      const endMins = endTotalMinutesAdj % 60;

      const startDateObj = parseLocalDate(formDate, bizTimezone);
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

      const endAt = buildTimestampISO(endDateStr, `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`, bizTimezone);

      const result = await supabase.rpc('create_public_appointment', {
        p_business_slug: businessSlug,
        p_service_ids: selectedServiceIds,
        p_customer_name: formName.trim(),
        p_customer_phone: formPhone.trim(),
        p_customer_email: formEmail.trim() || null,
        p_start_at: startAt,
        p_end_at: endAt,
        p_notes: formNotes.trim() || null,
      } as any) as { data: { success: boolean; appointment_id?: string; message?: string; error?: string } | null; error: { message: string; code?: string } | null };

      console.log('[DashboardAgenda] RPC result:', { result, data: result?.data, error: result?.error });

      const appointmentData = result?.data;

      if (!appointmentData?.success) {
        const errorMsg = appointmentData?.message || appointmentData?.error || 'Error al crear el turno';
        if (appointmentData?.error === 'SLOT_UNAVAILABLE' || appointmentData?.message?.includes('reservado')) {
          setAddSlotError('Este horario ya está reservado. Seleccioná otro horario disponible.');
          // Refresh slots to show what's still available
          try {
            const refreshedSlots = await getAvailableSlots(businessSlug, selectedServiceIds, formDate);
            setAddSlots(refreshedSlots);
          } catch {}
        } else {
          setAddSlotError(errorMsg);
        }
        return;
      }

      refetchAgenda();
      closeAddModal();
    } catch (e) {
      console.error('Error creating appointment:', e);
      alert(e instanceof Error ? e.message : 'Error al crear el turno');
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
    <DashboardLayout currentTab="agenda">
      {/* Slot conflict toast */}
      {slotConflict && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in fade-in slide-in-from-top-2" style={{ animation: 'toastIn 0.3s ease-out' }}>
          <div className="bg-white border border-red-200 rounded-xl shadow-lg p-4 flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">Horario ocupado</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ya hay un turno para <strong>{slotConflict.occupied}</strong>{slotConflict.endAt ? ` hasta las ${formatTimeInTimezone(slotConflict.endAt, bizTimezone)}` : ''}. Elegí otro horario.
              </p>
            </div>
            <button
              onClick={() => setSlotConflict(null)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gestioná tus turnos</p>
        </div>
        <Button variant="primary" size="lg" onClick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Agregar turno
        </Button>
      </div>

      <UpcomingHolidayNotice />

      {/* Summary */}
      <AgendaSummary
        todayCount={todayCount}
        weekCount={weekCount}
        pendingCount={totalPendingCount}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="lg:w-[35%] shrink-0">
          <MonthlyCalendar
            currentDate={selectedDate}
            selectedDate={selectedDate}
            appointmentCountByDate={calendarCountByDate}
            pendingCountByDate={calendarPendingCountByDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Appointments list */}
        <div className="flex-1 min-w-0">
          {/* Date navigation */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigateDate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
              aria-label="Día anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={onDatePickerChange}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/40 min-w-0"
            />

            <button
              onClick={() => navigateDate(1)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
              aria-label="Día siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {selectedDate !== todayStr && (
              <button
                onClick={goToday}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors whitespace-nowrap"
              >
                Hoy
              </button>
            )}

            <span className="text-sm font-medium text-neutral-700 capitalize min-w-[140px]">
              {formatDateLabel(selectedDate)}
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <Input
                placeholder="Buscar cliente o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {status === 'all' ? 'Todos' : STATUS_LABELS[status as AppointmentStatusLower]}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments */}
          {loading ? (
            <LoadingSpinner />
          ) : dayAppointments.length === 0 ? (
            <EmptyState
              title="No hay turnos"
              description={searchQuery || filterStatus !== 'all' ? 'Probá con otros filtros.' : 'No tenés turnos programados para esta fecha.'}
            />
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => setSelectedAppointment({
                    ...apt,
                    service: apt.serviceNames.split(' + ')[0] || apt.serviceNames,
                    services: apt.serviceNames.split(' + '),
                  })}
                  className={`w-full text-left bg-white border rounded-xl p-4 transition-all hover:shadow-sm group ${
                    selectedAppointment?.id === apt.id
                      ? 'border-accent-500 ring-2 ring-accent-500/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="text-right shrink-0 min-w-[60px]">
                      <span className="block text-sm font-semibold text-neutral-900">{apt.time}</span>
                      <span className="text-xs text-neutral-400">{apt.endTime}</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-neutral-200 self-center" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium text-neutral-900 group-hover:text-accent-600 transition-colors">
                            {apt.clientName}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">{apt.serviceNames}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                            <span>{apt.time} - {apt.endTime}</span>
                            <span>·</span>
                            <span>{apt.totalDuration} min</span>
                            <span>·</span>
                            <span className="font-medium text-neutral-600">${apt.totalPrice.toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'completed' || apt.status === 'no_show' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'}>
                          {STATUS_LABELS[apt.status] || apt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        <span>{apt.clientPhone}</span>
                        {apt.requiresDeposit && (
                          <span className="text-warning-600 font-medium">Requiere seña</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Appointment detail drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedAppointment(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-semibold text-neutral-900">Detalle del turno</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Client info */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Cliente</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-semibold shrink-0">
                    {selectedAppointment.clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{selectedAppointment.clientName}</p>
                    <a href={`tel:${selectedAppointment.clientPhone}`} className="text-xs text-accent-600 hover:text-accent-700">
                      {selectedAppointment.clientPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Service info */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Servicios</h3>
                {selectedAppointment.serviceDetails?.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-neutral-900">{svc.name}</span>
                    <span className="font-medium text-neutral-900">${svc.price.toLocaleString('es-AR')}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200 text-sm">
                  <span className="font-semibold text-neutral-900">Total</span>
                  <span className="font-bold text-neutral-900">${selectedAppointment.totalPrice.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <span>{selectedAppointment.totalDuration} min</span>
                </div>
              </div>

              {/* Time info */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Horario</h3>
                <div className="flex items-center gap-4 text-sm text-neutral-900">
                  <span>{selectedAppointment.time}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-300">
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>
                  <span>{selectedAppointment.endTime}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Estado</h3>
                <Badge variant={selectedAppointment.status === 'confirmed' ? 'success' : selectedAppointment.status === 'completed' || selectedAppointment.status === 'no_show' ? 'success' : selectedAppointment.status === 'pending' ? 'warning' : 'default'}>
                  {STATUS_LABELS[selectedAppointment.status]}
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-neutral-100">
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                  <Button
                    variant="secondary"
                    onClick={() => openRescheduleModal(selectedAppointment)}
                    className="w-full btn-lg"
                  >
                    Reagendar turno
                  </Button>
                )}
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'requires_deposit') && (
                  <>
                    <Button
                      onClick={() => { updateStatus(selectedAppointment.id, 'confirmed'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Confirmar turno
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => { updateStatus(selectedAppointment.id, 'cancelled'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Cancelar turno
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => { updateStatus(selectedAppointment.id, 'completed'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Marcar como completado
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => { updateStatus(selectedAppointment.id, 'no_show'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Marcar como no asistió
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'completed' && (
                  <Button
                    variant="danger"
                    onClick={() => { updateStatus(selectedAppointment.id, 'no_show'); setSelectedAppointment(null); }}
                    className="w-full btn-lg"
                  >
                    Marcar como no asistió
                  </Button>
                )}
                {selectedAppointment.status === 'no_show' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => { updateStatus(selectedAppointment.id, 'confirmed'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Revertir a confirmado
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { updateStatus(selectedAppointment.id, 'completed'); setSelectedAppointment(null); }}
                      className="w-full btn-lg"
                    >
                      Marcar como completado
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={closeRescheduleModal} />
          <div className="relative w-full max-w-lg bg-white shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Reagendar turno</h2>
              <button
                onClick={closeRescheduleModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Current appointment info */}
            <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200">
              <p className="text-xs font-medium text-neutral-500 mb-1">Turno actual</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-neutral-900">{selectedAppointment.clientName}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-600">{selectedAppointment.serviceNames}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-600">{selectedAppointment.date} a las {selectedAppointment.time}</span>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* New date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nueva fecha *</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getTodayInTimezone(bizTimezone)}
                />
              </div>

              {/* New time */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nuevo horario *</label>
                {rescheduleLoadingSlots ? (
                  <p className="text-xs text-neutral-400 py-2">Cargando horarios...</p>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">No hay horarios disponibles para esta fecha.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setRescheduleTime(slot.time)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          rescheduleTime === slot.time
                            ? 'bg-accent-600 text-white'
                            : slot.available
                            ? 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                            : 'bg-neutral-50 border border-neutral-100 text-neutral-300 cursor-not-allowed'
                        }`}
                        disabled={!slot.available}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeRescheduleModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
              >
                {rescheduling ? 'Reagendando...' : 'Confirmar reagendamiento'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add appointment modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={closeAddModal} />
          <div className="relative w-full max-w-lg bg-white shadow-xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Agregar turno</h2>
              <button
                onClick={closeAddModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Client name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del cliente *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: María García"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono *</label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ej: maria@email.com"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Servicios *</label>
                {services.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">Cargando servicios...</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((s) => {
                      const isSelected = selectedServiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500/20'
                              : 'border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-accent-500 border-accent-500' : 'border-neutral-300'
                            }`}>
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeTheme === 'dark' ? 'white' : 'black'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-medium text-neutral-900">{s.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-accent-600">${Number(s.price)?.toLocaleString('es-AR')}</span>
                            <span className="block text-xs text-neutral-400">{s.duration_minutes} min</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedServiceIds.length > 0 && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'servicio' : 'servicios'}</span>
                    <span className="font-semibold text-neutral-900">${totalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                    <span>Duración</span>
                    <span>{totalDuration} min</span>
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha *</label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Available time slots */}
              {selectedServiceIds.length > 0 && formDate && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Horarios disponibles</label>
                  {addLoadingSlots ? (
                    <p className="text-xs text-neutral-400 py-2">Cargando horarios...</p>
                  ) : addSlots.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-2">No hay horarios disponibles para esta fecha con los servicios seleccionados.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {addSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => { setFormTime(slot.time); setAddSlotError(null); }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formTime === slot.time
                              ? 'bg-accent-600 text-white'
                              : slot.available
                              ? 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              : 'bg-neutral-50 border border-neutral-100 text-neutral-300 cursor-not-allowed'
                          }`}
                          disabled={!slot.available}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observaciones..."
                  rows={3}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/40 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeAddModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => { setAddSlotError(null); handleAddAppointment(); }}
                disabled={!formName.trim() || !formPhone.trim() || selectedServiceIds.length === 0 || !formDate || !formTime || savingAppointment}
              >
                {savingAppointment ? 'Guardando...' : 'Agregar turno'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {(slotConflict || actionError || addSlotError) && (
        <ErrorModal
          message={
            addSlotError ||
            actionError ||
            `Este horario ya está reservado. Elegí otro horario e intentá de nuevo.`
          }
          onClose={() => { setSlotConflict(null); setActionError(null); setAddSlotError(null); }}
        />
      )}
    </DashboardLayout>
  );
}
