import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase, type Service } from '@/lib/supabase';
import { getAvailableSlots } from '@/services/appointmentService';
import { buildTimestampISO, parseLocalDate } from '@/utils/dateTime';

interface AddAppointmentModalProps {
  initialDate: string;
  businessSlug: string;
  businessId: string | null;
  bizTimezone: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}

export function AddAppointmentModal({
  initialDate,
  businessSlug,
  businessId,
  bizTimezone,
  onClose,
  onSaved,
  onError,
}: AddAppointmentModalProps) {
  const [savingAppointment, setSavingAppointment] = React.useState(false);
  const [services, setServices] = React.useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>([]);
  const [totalDuration, setTotalDuration] = React.useState(0);
  const [totalPrice, setTotalPrice] = React.useState(0);
  const [formName, setFormName] = React.useState('');
  const [formPhone, setFormPhone] = React.useState('');
  const [formEmail, setFormEmail] = React.useState('');
  const [formDate, setFormDate] = React.useState(initialDate);
  const [formTime, setFormTime] = React.useState('09:00');
  const [formNotes, setFormNotes] = React.useState('');
  const [addSlots, setAddSlots] = React.useState<Array<{ time: string; available: boolean }>>([]);
  const [addLoadingSlots, setAddLoadingSlots] = React.useState(false);

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

  React.useEffect(() => {
    if (businessId) fetchServices(businessId);
  }, [businessId, fetchServices]);

  // Fetch available slots when date or services change
  React.useEffect(() => {
    if (!businessSlug || !formDate) {
      setAddSlots([]);
      return;
    }
    const fetchSlots = async () => {
      setAddLoadingSlots(true);
      onError(null);
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
  }, [formDate, selectedServiceIds, businessSlug, onError]);

  // When services change, auto-select a valid time
  React.useEffect(() => {
    if (addSlots.length === 0 || formTime) return;
    const firstAvailable = addSlots.find(s => s.available);
    if (firstAvailable) {
      setFormTime(firstAvailable.time);
    }
  }, [selectedServiceIds, formDate]);

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

  const closeModal = () => {
    onError(null);
    onClose();
  };

  // Submit new appointment via RPC with slot availability check
  const handleAddAppointment = async () => {
    if (!businessSlug || !formName.trim() || !formPhone.trim() || selectedServiceIds.length === 0 || !formDate || !formTime) return;

    setSavingAppointment(true);
    onError(null);

    try {
      // Re-verify slot availability right before creating (avoid race condition)
      const currentSlots = await getAvailableSlots(businessSlug, selectedServiceIds, formDate);
      const slotStillAvailable = currentSlots.find(s => s.time === formTime && s.available);
      if (!slotStillAvailable) {
        onError('Este horario ya no está disponible. Seleccioná otro horario.');
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
          onError('Este horario ya está reservado. Seleccioná otro horario disponible.');
          // Refresh slots to show what's still available
          try {
            const refreshedSlots = await getAvailableSlots(businessSlug, selectedServiceIds, formDate);
            setAddSlots(refreshedSlots);
          } catch {}
        } else {
          onError(errorMsg);
        }
        return;
      }

      onSaved();
    } catch (e) {
      console.error('Error creating appointment:', e);
      alert(e instanceof Error ? e.message : 'Error al crear el turno');
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
        <Modal
      shellClassName="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      backdropClassName="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onBackdropClick={closeModal}
      panelClassName="relative w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
    >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Agregar turno</h2>
          <button
            onClick={closeModal}
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
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-zinc-900 dark:bg-zinc-900 border-zinc-600 dark:border-zinc-400' : 'border-zinc-200 dark:border-zinc-700'
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
                      onClick={() => { setFormTime(slot.time); onError(null); }}
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
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onError(null); handleAddAppointment(); }}
            disabled={!formName.trim() || !formPhone.trim() || selectedServiceIds.length === 0 || !formDate || !formTime || savingAppointment}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {savingAppointment ? 'Guardando...' : 'Agregar turno'}
          </button>
        </div>
    </Modal>
  );
}
