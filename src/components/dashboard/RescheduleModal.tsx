import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { rescheduleAppointment, getAvailableSlots } from '@/services/appointmentService';
import { getTodayInTimezone } from '@/utils/dateTime';
import type { SelectedAppointment } from '@/types/index';

interface RescheduleModalProps {
  appointment: SelectedAppointment;
  initialDate: string;
  initialTime: string;
  businessSlug: string;
  bizTimezone: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}

export function RescheduleModal({
  appointment,
  initialDate,
  initialTime,
  businessSlug,
  bizTimezone,
  onClose,
  onSaved,
  onError,
}: RescheduleModalProps) {
  const [rescheduleDate, setRescheduleDate] = React.useState(initialDate);
  const [rescheduleTime, setRescheduleTime] = React.useState(initialTime);
  const [rescheduleSlots, setRescheduleSlots] = React.useState<Array<{ time: string; available: boolean }>>([]);
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = React.useState(false);
  const [rescheduling, setRescheduling] = React.useState(false);

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
    if (!appointment || !rescheduleDate || !rescheduleTime || !businessSlug) return;

    setRescheduling(true);
    try {
      const result = await rescheduleAppointment({
        appointmentId: appointment.id,
        businessSlug,
        date: rescheduleDate,
        time: rescheduleTime,
      });

      if (!result.success) {
        onError(result.error || 'Error al reagendar el turno.');
        return;
      }

      onSaved();
    } catch (e) {
      console.error('Error rescheduling appointment:', e);
      onError('Error al reagendar el turno. Intentá de nuevo.');
    } finally {
      setRescheduling(false);
    }
  };

  React.useEffect(() => {
    if (rescheduleDate && appointment) {
      (async () => {
        try {
          const { data: aptData } = await supabase
            .from('appointments')
            .select('appointment_services:appointment_services(service_id, duration_minutes)')
            .eq('id', appointment.id)
            .single() as { data: { appointment_services?: Array<{ service_id: string; duration_minutes: number }> } | null; error: unknown };

          const serviceIds = aptData?.appointment_services?.map(s => s.service_id) || [];
          const totalDuration = aptData?.appointment_services?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 30;

          if (serviceIds.length > 0) {
            fetchRescheduleSlots(rescheduleDate, serviceIds, appointment.id, totalDuration);
          } else {
            fetchRescheduleSlots(rescheduleDate, [], undefined, totalDuration);
          }
        } catch (e) {
          console.error('Error fetching reschedule services:', e);
        }
      })();
    }
  }, [rescheduleDate, appointment?.id, fetchRescheduleSlots]);

  return (
        <Modal
      shellClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      backdropClassName="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onBackdropClick={onClose}
      panelClassName="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Reagendar turno</h2>
          <button
            onClick={onClose}
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
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{appointment.clientName}</span>
            <span className="text-zinc-500 dark:text-zinc-400">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">{appointment.serviceNames}</span>
            <span className="text-zinc-500 dark:text-zinc-400">·</span>
            <span className="text-zinc-500 dark:text-zinc-400">{appointment.date} a las {appointment.time}</span>
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
            onClick={onClose}
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
    </Modal>
  );
}
