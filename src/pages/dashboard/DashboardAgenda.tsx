import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '@/hooks/useBusiness';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingSpinner } from '@/components/common/States';
import { ErrorModal } from '@/components/ErrorModal';
import type { AppointmentStatusLower, SelectedAppointment } from '@/types/index';
import {
  getTodayInTimezone,
  getTomorrowInTimezone,
  BUSINESS_TIMEZONE,
  parseLocalDate,
  addDaysToDate,
  formatDate,
} from '@/utils/dateTime';
import { MonthlyCalendar } from '@/components/dashboard/MonthlyCalendar';
import { AgendaSummary } from '@/components/dashboard/AgendaSummary';
import { WeeklyView } from '@/components/dashboard/WeeklyView';
import { useAgendaData } from '@/hooks/useAgendaData';
import { updateAppointmentStatusLower } from '@/services/appointmentService';
import { STATUS_LABELS } from '@/utils/status';
import { Toast } from '@/components/ui/Toast';
import { AgendaFilters } from '@/components/dashboard/AgendaFilters';
import { AppointmentDrawer } from '@/components/dashboard/AppointmentDrawer';
import { RescheduleModal } from '@/components/dashboard/RescheduleModal';
import { AddAppointmentModal } from '@/components/dashboard/AddAppointmentModal';

const STATUS_BAR_COLORS: Record<AppointmentStatusLower, { light: string; dark: string }> = {
  pending: { light: 'bg-amber-400', dark: 'bg-amber-400' },
  confirmed: { light: 'bg-emerald-400', dark: 'bg-emerald-400' },
  completed: { light: 'bg-emerald-400', dark: 'bg-emerald-400' },
  cancelled: { light: 'bg-zinc-300', dark: 'bg-zinc-600' },
  requires_deposit: { light: 'bg-amber-400', dark: 'bg-amber-400' },
  rejected: { light: 'bg-red-500', dark: 'bg-red-400' },
  expired: { light: 'bg-zinc-300', dark: 'bg-zinc-600' },
  no_show: { light: 'bg-red-500', dark: 'bg-red-400' },
};

export function DashboardAgenda() {
  const { businessSlug } = useAuth();
  const { activeTheme } = useTheme();
  const { businessId, timezone: bizTimezone } = useBusiness(businessSlug);
  const [selectedAppointment, setSelectedAppointment] = React.useState<SelectedAppointment | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'weekly'>('list');
  const [showPastAppointments, setShowPastAppointments] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [selectedDate, setSelectedDate] = React.useState(() => {
    return getTodayInTimezone(BUSINESS_TIMEZONE);
  });

  const isInitialMount = React.useRef(true);
  // Modal state for adding appointment
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addSlotError, setAddSlotError] = React.useState<string | null>(null);

  // Error modal
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Success toast for created appointment
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = React.useState(false);
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

  // Reschedule modal callbacks
  const openRescheduleModal = (apt: SelectedAppointment | null) => {
    if (!apt) return;
    setSelectedAppointment(apt);
    setShowRescheduleModal(true);
  };

  const closeRescheduleModal = () => {
    setShowRescheduleModal(false);
  };

  const handleRescheduleSaved = () => {
    refetchAgenda();
    closeRescheduleModal();
    setSelectedAppointment(null);
  };

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

  // Add modal callbacks
  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddSaved = () => {
    refetchAgenda();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowAddModal(false);
    }, 1500);
  };

  return (
    <DashboardLayout currentTab="agenda">
      {/* Success toast */}
      {showSuccess && (
        <Toast variant="success" position="center" title="Turno creado con éxito" />
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

{viewMode === 'list' && <div className="mb-4"></div>}

      {/* Main content */}
      {viewMode === 'weekly' ? (
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
          setShowPastAppointments={setShowPastAppointments}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar */}
          <div className="w-full lg:w-[35%] shrink-0">
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
                className="flex-1 min-w-0 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20 focus:border-zinc-500/50 transition-all duration-200"
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

              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize min-w-0 flex-1">
                {formatDateLabel(selectedDate)}
              </span>
            </div>

            {/* Filters */}
            <AgendaFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
            />

            {/* Appointments */}
            {loading ? (
              <LoadingSpinner />
            ) : dayAppointments.length === 0 ? (
              <EmptyState
                title="No hay turnos"
                description={searchQuery || filterStatus !== 'all' ? 'Probá con otros filtros.' : 'No tenés turnos programados para esta fecha.'}
              />
            ) : (
              <div className="space-y-1.5">
                {dayAppointments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment({
                      ...apt,
                      service: apt.serviceNames.split(' + ')[0] || apt.serviceNames,
                      services: apt.serviceNames.split(' + '),
                    })}
                    className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-xl py-2 px-3 transition-all duration-200 hover:shadow-lg group ${
                      selectedAppointment?.id === apt.id
                        ? 'border-zinc-300 dark:border-zinc-700 shadow-lg shadow-zinc-200/40 dark:shadow-zinc-900/40 ring-1 ring-zinc-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg hover:shadow-zinc-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Time */}
                      <div className="text-right shrink-0 min-w-0">
                        <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">{apt.time}</span>
                      </div>

                      {/* Status color bar */}
                      <div
                        className={`w-1 h-6 self-center rounded-full ${
                          activeTheme === 'dark'
                            ? STATUS_BAR_COLORS[apt.status]?.dark ?? 'bg-zinc-600'
                            : STATUS_BAR_COLORS[apt.status]?.light ?? 'bg-zinc-300'
                        }`}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {apt.clientName}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{apt.clientPhone}</span>
                            <a
                              href={`https://wa.me/${apt.clientPhone.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent(`Hola ${apt.clientName}, recordá que el día ${formatDate(apt.date, bizTimezone)} a las ${apt.time} tenés turno para: ${apt.serviceNames}. ¡Te esperamos!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{apt.serviceNames}</p>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                            <span className="inline-flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 3" strokeLinecap="round" />
                              </svg>
                              {apt.time} - {apt.endTime}
                            </span>
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">{apt.totalDuration} min</span>
                          </div>
                        </div>
                      </div>

                      <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'completed' || apt.status === 'no_show' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'}>
                        {STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
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
        <AppointmentDrawer
          appointment={selectedAppointment}
          bizTimezone={bizTimezone}
          onClose={() => setSelectedAppointment(null)}
          onReschedule={openRescheduleModal}
          onUpdateStatus={updateStatus}
        />
      )}

      {/* Reschedule modal */}
      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          appointment={selectedAppointment}
          initialDate={selectedDate}
          initialTime={selectedAppointment.time}
          businessSlug={businessSlug}
          bizTimezone={bizTimezone}
          onClose={closeRescheduleModal}
          onSaved={handleRescheduleSaved}
          onError={setActionError}
        />
      )}

      {/* Add appointment modal */}
      {showAddModal && (
        <AddAppointmentModal
          initialDate={selectedDate || todayStr}
          businessSlug={businessSlug}
          businessId={businessId}
          bizTimezone={bizTimezone}
          onClose={closeAddModal}
          onSaved={handleAddSaved}
          onError={setAddSlotError}
        />
      )}

      {(actionError || addSlotError) && (
        <ErrorModal
          message={addSlotError || actionError || 'Este horario ya está reservado. Elegí otro horario e intentá de nuevo.'}
          onClose={() => { setActionError(null); setAddSlotError(null); }}
        />
      )}

    </DashboardLayout>
  );
}
