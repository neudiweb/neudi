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
  formatDate,
} from '../../utils/helpers';
import { MonthlyCalendar } from '../../components/dashboard/MonthlyCalendar';
import { AgendaSummary } from '../../components/dashboard/AgendaSummary';
import { TimelineView } from '../../components/dashboard/TimelineView';
import { WeeklyView } from '../../components/dashboard/WeeklyView';
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
  const [viewMode, setViewMode] = React.useState<'list' | 'timeline' | 'weekly'>('list');
  const [showPastAppointments, setShowPastAppointments] = React.useState(false);
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

  // Success toast for created appointment
  const [showSuccess, setShowSuccess] = React.useState(false);

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
  } = useAgendaData(businessId, bizTimezone, selectedDate, null);

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

  const fetchRescheduleSlots = React.useCallback(async (date: string, serviceIds: string[], excludeId?: string, totalDuration?: number) => {
    if (!businessSlug || serviceIds.length === 0 || !date) return;
    setRescheduleLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(businessSlug, serviceIds ?? [], date, excludeId ? [excludeId] : undefined, totalDuration);
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
            .select('appointment_services:appointment_services(service_id, duration_minutes)')
            .eq('id', selectedAppointment.id)
            .single() as { data: { appointment_services?: Array<{ service_id: string; duration_minutes: number }> } | null; error: unknown };

          const serviceIds = aptData?.appointment_services?.map(s => s.service_id) || [];
          const totalDuration = aptData?.appointment_services?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 30;
          
          if (serviceIds.length > 0) {
            fetchRescheduleSlots(rescheduleDate, serviceIds, selectedAppointment.id, totalDuration);
          } else {
            fetchRescheduleSlots(rescheduleDate, [], undefined, totalDuration);
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

  const formatMonthLabel = (dateStr: string) => {
    const d = parseLocalDate(dateStr, bizTimezone);
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
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
        .eq('is_deleted', false)
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
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeAddModal();
      }, 1500);
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
          <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800/50 rounded-2xl shadow-xl shadow-red-500/5 dark:shadow-red-500/10 p-5 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md shadow-red-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Horario ocupado</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Ya hay un turno para <strong className="text-zinc-900 dark:text-zinc-100">{slotConflict.occupied}</strong>{slotConflict.endAt ? ` hasta las ${formatTimeInTimezone(slotConflict.endAt, bizTimezone)}` : ''}. Elegí otro horario.
              </p>
            </div>
            <button
              onClick={() => setSlotConflict(null)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
          <div className="max-w-sm w-full" style={{ animation: 'toastIn 0.3s ease-out' }}>
            <div className="bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800/50 rounded-2xl shadow-xl shadow-green-500/10 dark:shadow-green-500/20 p-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Turno creado con éxito</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-start sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center shadow-lg shadow-zinc-300/30 dark:shadow-zinc-900/50 shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900 dark:text-zinc-100">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Agenda</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Gestioná tus turnos de forma organizada</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 w-full sm:w-auto">
          {/* View mode toggle */}
          <div className={`
            sm:w-auto mx-auto inline-flex items-center rounded-xl border p-1 transition-all duration-200
            ${activeTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}
          `}>
            <button
              onClick={() => setViewMode('list')}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-1 sm:flex-none justify-center
                ${viewMode === 'list'
                  ? activeTheme === 'dark'
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : activeTheme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }
              `}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-1 sm:flex-none justify-center
                ${viewMode === 'timeline'
                  ? activeTheme === 'dark'
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : activeTheme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }
              `}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
              Timeline
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-1 sm:flex-none justify-center
                ${viewMode === 'weekly'
                  ? activeTheme === 'dark'
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 text-white shadow-sm'
                  : activeTheme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-900'
                }
              `}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              Semanal
            </button>
          </div>
          {/* Show past appointments toggle (weekly view only) */}
          {viewMode === 'weekly' && (
            <div className={`
              sm:w-auto mx-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
              ${activeTheme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}
            `}>
              <button
                onClick={() => setShowPastAppointments(!showPastAppointments)}
                className={`
                  relative w-9 h-5 rounded-full transition-all duration-200 shrink-0
                  ${showPastAppointments
                    ? activeTheme === 'dark' ? 'bg-zinc-100' : 'bg-zinc-900'
                    : activeTheme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300'
                  }
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm
                    ${showPastAppointments ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${
                showPastAppointments
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                {showPastAppointments ? 'Mostrar todos' : 'Solo futuros'}
              </span>
            </div>
          )}
          <button
            onClick={openAddModal}
            className="sm:w-auto mx-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Agregar turno
          </button>
        </div>
      </div>

{viewMode === 'list' && (
  <AgendaSummary
    todayCount={todayCount}
    weekCount={weekCount}
    pendingCount={totalPendingCount}
  />
)}

{viewMode === 'list' && <div className="mb-10"></div>}

      {/* Main content */}
      {viewMode === 'timeline' ? (
        <TimelineView
          appointmentsByDate={appointmentsByDate}
          calendarCountByDate={calendarCountByDate}
          calendarPendingCountByDate={calendarPendingCountByDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          setFilterStatus={setFilterStatus}
          setSearchQuery={setSearchQuery}
          STATUS_LABELS={STATUS_LABELS}
          bizTimezone={bizTimezone}
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          todayStr={todayStr}
          formatMonthLabel={formatMonthLabel}
          navigateDate={navigateDate}
          goToday={goToday}
          activeTheme={activeTheme}
        />
      ) : viewMode === 'weekly' ? (
        <WeeklyView
          appointmentsByDate={appointmentsByDate}
          calendarCountByDate={calendarCountByDate}
          calendarPendingCountByDate={calendarPendingCountByDate}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          setFilterStatus={setFilterStatus}
          setSearchQuery={setSearchQuery}
          STATUS_LABELS={STATUS_LABELS}
          bizTimezone={bizTimezone}
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          todayStr={todayStr}
          formatMonthLabel={formatMonthLabel}
          navigateDate={navigateDate}
          goToday={goToday}
          activeTheme={activeTheme}
          showPastAppointments={showPastAppointments}
        />
      ) : (
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
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <button
                onClick={() => navigateDate(-1)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Día anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={onDatePickerChange}
                className="flex-1 min-w-[140px] border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 focus:border-zinc-500/50 transition-all duration-200"
              />

              <button
                onClick={() => navigateDate(1)}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Día siguiente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {selectedDate !== todayStr && (
                <button
                  onClick={goToday}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  Hoy
                </button>
              )}

              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize min-w-[140px]">
                {formatDateLabel(selectedDate)}
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="relative max-w-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400/50">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <Input
                  placeholder="Buscar cliente o servicio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'confirmed', 'completed', 'no_show', 'cancelled', 'expired', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                      filterStatus === status
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-300/20 dark:shadow-zinc-900/30'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:border-zinc-700'
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
              <div className="space-y-3">
                {dayAppointments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment({
                      ...apt,
                      service: apt.serviceNames.split(' + ')[0] || apt.serviceNames,
                      services: apt.serviceNames.split(' + '),
                    })}
                    className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-all duration-200 hover:shadow-lg group ${
                      selectedAppointment?.id === apt.id
                        ? 'border-zinc-300 dark:border-zinc-700 shadow-lg shadow-zinc-200/40 dark:shadow-zinc-900/40 ring-1 ring-zinc-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Time */}
                      <div className="text-right shrink-0 min-w-[60px]">
                        <span className="block text-lg font-semibold text-zinc-900 dark:text-zinc-100">{apt.time}</span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{apt.endTime}</span>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800 self-center" />

                      {/* Info */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                              {apt.clientName}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{apt.serviceNames}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="9" />
                                  <path d="M12 7v5l3 3" strokeLinecap="round" />
                                </svg>
                                {apt.time} - {apt.endTime}
                              </span>
                              <span className="shrink-0">·</span>
                              <span className="shrink-0">{apt.totalDuration} min</span>
                              <span className="shrink-0">·</span>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">${apt.totalPrice.toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                          <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'completed' || apt.status === 'no_show' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'}>
                            {STATUS_LABELS[apt.status] || apt.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            {apt.clientPhone}
                          </span>
                          <a
                            href={`https://wa.me/${apt.clientPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hola ${apt.clientName}, recordá que el día ${formatDate(apt.date, bizTimezone)} a las ${apt.time} tenés turno para: ${apt.serviceNames}. ¡Te esperamos!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </a>
                          {apt.requiresDeposit && (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                              Requiere seña
                            </span>
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
      )}

      {/* Appointment detail drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Detalle del turno</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Client info */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Cliente</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-500 flex items-center justify-center text-white font-semibold shrink-0 shadow-lg">
                    {selectedAppointment.clientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedAppointment.clientName}</p>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${selectedAppointment.clientPhone}`} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                        {selectedAppointment.clientPhone}
                      </a>
                      <a
                        href={`https://wa.me/${selectedAppointment.clientPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hola ${selectedAppointment.clientName}, recordá que el día ${formatDate(selectedAppointment.date, bizTimezone)} a las ${selectedAppointment.time} tenés turno para: ${selectedAppointment.serviceNames}. ¡Te esperamos!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service info */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Servicios</h3>
                {selectedAppointment.serviceDetails?.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-zinc-900 dark:text-zinc-100">{svc.name}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">${svc.price.toLocaleString('es-AR')}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Total</span>
                  <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">${selectedAppointment.totalPrice.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" strokeLinecap="round" />
                    </svg>
                    {selectedAppointment.totalDuration} min
                  </span>
                </div>
              </div>

              {/* Time info */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Horario</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{selectedAppointment.time}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Inicio</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(border-zinc-200 dark:border-zinc-800)]">
                      <path d="M5 12h14" strokeLinecap="round" />
                      <path d="M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{selectedAppointment.endTime}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Fin</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Estado</h3>
                <Badge variant={selectedAppointment.status === 'confirmed' ? 'success' : selectedAppointment.status === 'completed' || selectedAppointment.status === 'no_show' ? 'success' : selectedAppointment.status === 'pending' ? 'warning' : 'default'}>
                  {STATUS_LABELS[selectedAppointment.status]}
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                  <button
                    onClick={() => openRescheduleModal(selectedAppointment)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6v6M23 20v-6V4" />
                      <path d="M5.63 20.21a8 8 0 0 1 0-11.71" />
                      <path d="M18.37 20.21a8 8 0 0 0 0-11.71" />
                      <path d="M7.59 7.59A8 8 0 0 1 16.41 7.59" />
                      <path d="M16.41 16.41A8 8 0 0 1 7.59 16.41" />
                    </svg>
                    Reagendar turno
                  </button>
                )}
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'requires_deposit') && (
                  <>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'confirmed'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Confirmar turno
                    </button>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'cancelled'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                      </svg>
                      Cancelar turno
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'completed'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Marcar como completado
                    </button>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'no_show'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                      </svg>
                      Marcar como no asistió
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'completed' && (
                  <button
                    onClick={() => { updateStatus(selectedAppointment.id, 'no_show'); setSelectedAppointment(null); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                    </svg>
                    Marcar como no asistió
                  </button>
                )}
                {selectedAppointment.status === 'no_show' && (
                  <>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'confirmed'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6v6M23 20v-6V4" />
                      </svg>
                      Revertir a confirmado
                    </button>
                    <button
                      onClick={() => { updateStatus(selectedAppointment.id, 'completed'); setSelectedAppointment(null); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Marcar como completado
                    </button>
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeRescheduleModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Reagendar turno</h2>
              <button
                onClick={closeRescheduleModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Current appointment info */}
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Turno actual</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedAppointment.clientName}</span>
                <span className="text-zinc-500 dark:text-zinc-400">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">{selectedAppointment.serviceNames}</span>
                <span className="text-zinc-500 dark:text-zinc-400">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">{selectedAppointment.date} a las {selectedAppointment.time}</span>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* New date */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Nueva fecha *</label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getTodayInTimezone(bizTimezone)}
                  className="rounded-xl"
                />
              </div>

              {/* New time */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Nuevo horario *</label>
                {rescheduleLoadingSlots ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">Cargando horarios...</p>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">No hay horarios disponibles para esta fecha.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {rescheduleSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setRescheduleTime(slot.time)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                          rescheduleTime === slot.time
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                            : slot.available
                            ? 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500'
                            : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400/40 cursor-not-allowed opacity-50'
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
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={closeRescheduleModal}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {rescheduling ? 'Reagendando...' : 'Confirmar reagendamiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add appointment modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Agregar turno</h2>
              <button
                onClick={closeAddModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Client name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Nombre del cliente *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: María García"
                  className="rounded-xl"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Teléfono *</label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej: 11 1234-5678"
                  className="rounded-xl"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Email</label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ej: maria@email.com"
                  className="rounded-xl"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Servicios *</label>
                {services.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">Cargando servicios...</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((s) => {
                      const isSelected = selectedServiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? 'border-zinc-700 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-zinc-500/20 shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:bg-zinc-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100' : 'border-zinc-200 dark:border-zinc-800'
                            }`}>
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">${Number(s.price)?.toLocaleString('es-AR')}</span>
                            <span className="block text-xs text-zinc-500 dark:text-zinc-400">{s.duration_minutes} min</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedServiceIds.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">{selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'servicio' : 'servicios'}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">${totalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    <span>Duración</span>
                    <span>{totalDuration} min</span>
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Fecha *</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Available time slots */}
              {selectedServiceIds.length > 0 && formDate && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Horarios disponibles</label>
                  {addLoadingSlots ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">Cargando horarios...</p>
                  ) : addSlots.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">No hay horarios disponibles para esta fecha con los servicios seleccionados.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {addSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => { setFormTime(slot.time); setAddSlotError(null); }}
                          className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                            formTime === slot.time
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                              : slot.available
                              ? 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500'
                              : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400/40 cursor-not-allowed opacity-50'
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
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observaciones..."
                  rows={3}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 focus:border-zinc-500/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={closeAddModal}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setAddSlotError(null); handleAddAppointment(); }}
                disabled={!formName.trim() || !formPhone.trim() || selectedServiceIds.length === 0 || !formDate || !formTime || savingAppointment}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {savingAppointment ? 'Guardando...' : 'Agregar turno'}
              </button>
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
