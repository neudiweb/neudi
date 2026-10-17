import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, type Service, type BusinessHour } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/common/States';
import { ErrorModal } from '../components/ErrorModal';
import { parseLocalDate, buildTimestampISO } from '../utils/helpers';

type Step = 'service' | 'datetime' | 'details' | 'confirmation';

interface BookingData {
  serviceIds: string[];
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface ServiceSummary {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export function BookingWizard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<Step>('service');
  const [booking, setBooking] = React.useState<BookingData>({
    serviceIds: [],
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [bizTimezone, setBizTimezone] = React.useState('America/Argentina/Buenos_Aires');
  const [services, setServices] = React.useState<Service[]>([]);
  const [businessHours, setBusinessHours] = React.useState<Record<number, TimeRange[]>>({});
  const [availableSlots, setAvailableSlots] = React.useState<Set<string>>(new Set());
  const [selectedServiceSummaries, setSelectedServiceSummaries] = React.useState<ServiceSummary[]>([]);

  React.useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id, timezone')
          .eq('slug', slug)
          .single() as { data: { id: string; timezone: string } | null; error: string | null };

        if (!cancelled && biz) {
          setBusinessId(biz.id);
          setBizTimezone(biz.timezone || 'America/Argentina/Buenos_Aires');

          const { data: svcs } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', biz.id)
            .eq('is_active', true)
            .order('name', { ascending: true }) as { data: Service[] | null; error: string | null };

          if (!cancelled && svcs) setServices(svcs);

          const { data: bhData } = await supabase
            .from('business_hours')
            .select('*')
            .eq('business_id', biz.id)
            .eq('is_active', true) as { data: BusinessHour[] | null; error: string | null };

          if (!cancelled && bhData) {
            const hoursMap: Record<number, TimeRange[]> = {};
            for (const h of bhData) {
              const day = h.day_of_week;
              if (!hoursMap[day]) hoursMap[day] = [];
              hoursMap[day].push({ startTime: h.start_time, endTime: h.end_time });
            }
            setBusinessHours(hoursMap);
          }
        }
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  React.useEffect(() => {
    const summaries = services
      .filter(s => booking.serviceIds.includes(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price) || 0,
        durationMinutes: s.duration_minutes || 0,
      }));
    setSelectedServiceSummaries(summaries);
  }, [booking.serviceIds, services]);

  React.useEffect(() => {
    if (!businessId || !booking.date) {
      setAvailableSlots(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_available_slots_for_date', {
          p_business_id: businessId,
          p_date: booking.date,
          p_service_ids: booking.serviceIds.length > 0 ? booking.serviceIds : null,
        } as any) as { data: Array<{ time: string; available: boolean }> | null; error: unknown };

        if (!cancelled && !error && data) {
          const slotTimes = data.filter(s => s.available).map(s => s.time);
          setAvailableSlots(new Set(slotTimes));
        } else {
          setAvailableSlots(new Set());
        }
      } catch (e) {
        console.error('Error fetching available slots:', e);
        setAvailableSlots(new Set());
      }
    })();
    return () => { cancelled = true; };
  }, [businessId, booking.date, booking.serviceIds]);

  const generateTimeSlots = React.useCallback((): TimeSlot[] => {
    if (!booking.date) return [];

    const dateObj = parseLocalDate(booking.date, bizTimezone);
    const dow = dateObj.getDay();

    const dayRanges = businessHours[dow];
    if (!dayRanges || dayRanges.length === 0) return [];

    const allSlots: string[] = [];
    for (const range of dayRanges) {
      const [startH, startM] = range.startTime.split(':').map(Number);
      const [endH, endM] = range.endTime.split(':').map(Number);
      let current = startH * 60 + startM;
      const end = endH * 60 + endM;
      while (current < end) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        current += 15;
      }
    }

    return allSlots.map(time => ({
      time,
      available: availableSlots.has(time),
    }));
  }, [booking.date, businessHours, availableSlots]);

  const totalDuration = selectedServiceSummaries.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServiceSummaries.reduce((sum, s) => sum + s.price, 0);
  const formattedDuration = totalDuration >= 60
    ? `${Math.floor(totalDuration / 60)} h ${totalDuration % 60 > 0 ? (totalDuration % 60) + ' min' : ''}`.trim()
    : `${totalDuration} min`;

  const canProceed = () => {
    switch (step) {
      case 'service': return booking.serviceIds.length > 0;
      case 'datetime': return !!booking.date && !!booking.time;
      case 'details': return !!booking.name.trim() && !!booking.phone.trim();
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    const steps: Step[] = ['service', 'datetime', 'details', 'confirmation'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const toggleService = (serviceId: string) => {
    setBooking(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const handleSubmit = async () => {
    if (!businessId || booking.serviceIds.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const [slotHours, slotMinutes] = booking.time.split(':').map(Number);
      const totalEndMinutes = slotHours * 60 + slotMinutes + totalDuration;

      let endDayOffset = 0;
      if (totalEndMinutes >= 1440) {
        endDayOffset = Math.floor(totalEndMinutes / 1440);
      }
      const endTotalMinutes = totalEndMinutes - endDayOffset * 1440;
      const endHours = Math.floor(endTotalMinutes / 60);
      const endMins = totalEndMinutes % 60;

      const startDateObj = parseLocalDate(booking.date, bizTimezone);
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

      const startAt = buildTimestampISO(booking.date, booking.time, bizTimezone);
      const endAt = buildTimestampISO(endDateStr, `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`, bizTimezone);

      const { data: rpcData, error: rpcError } = await supabase.rpc('create_public_appointment', {
        p_business_slug: slug,
        p_service_ids: booking.serviceIds,
        p_start_at: startAt,
        p_end_at: endAt,
        p_customer_name: booking.name.trim(),
        p_customer_phone: booking.phone.trim(),
        p_customer_email: booking.email?.trim() || null,
        p_notes: null,
        p_exclude_appointment_id: null,
      } as any) as { data: { success: boolean; appointment_id?: string; message?: string; error?: string } | null; error: unknown };

      if (rpcError) {
        const errObj = rpcError as Record<string, unknown>;
        if (errObj.code === '23P01' && errObj.message === 'TIME_SLOT_UNAVAILABLE') {
          setSubmitError('Este horario ya está reservado. Elegí otro horario e intentá de nuevo.');
        } else {
          const msg = typeof rpcError === 'object' && rpcError && 'message' in rpcError ? String((rpcError as any).message) : 'Error al crear la reserva. Intentá nuevamente.';
          setSubmitError(msg);
        }
        return;
      }

      if (!rpcData || !rpcData.success) {
        const msg = rpcData?.message || rpcData?.error || 'Error al crear la reserva. Intentá nuevamente.';
        setSubmitError(msg);
        return;
      }

      setStep('confirmation');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear la reserva. Intentá nuevamente.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedNames = selectedServiceSummaries.map(s => s.name).join(' + ') || '';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href={`/${slug}`} className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" strokeLinecap="round" />
              <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </a>
          <div className="flex items-center gap-1.5">
            {(['service', 'datetime', 'details'] as Step[]).map((s) => (
              <div key={s} className={`w-2 h-2 rounded-full ${
                step === s ? 'bg-accent-500' : ['service', 'datetime', 'details'].indexOf(s) < ['service', 'datetime', 'details'].indexOf(step) ? 'bg-success-500' : 'bg-neutral-300'
              }`} />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {step === 'service' && (
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Elegí tus servicios</h1>
            <p className="text-sm text-neutral-500 mb-6">Seleccioná uno o más servicios para tu turno.</p>
            {services.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No hay servicios disponibles.</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => {
                  const isSelected = booking.serviceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full text-left card p-4 flex items-center justify-between transition-all ${
                        isSelected ? 'border-accent-500 ring-2 ring-accent-500/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-accent-500 border-accent-500' : 'border-neutral-300'
                        }`}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-neutral-900">{service.name}</h3>
                          <p className="text-xs text-neutral-400 mt-0.5">{service.duration_minutes} min</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-accent-600">${Number(service.price)?.toLocaleString('es-AR')}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selection summary */}
            {booking.serviceIds.length > 0 && (
              <div className="mt-4 card p-4 bg-neutral-50 border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">
                    {booking.serviceIds.length} {booking.serviceIds.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                  <span className="text-sm font-semibold text-accent-600">${totalPrice.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Duración</span>
                  <span className="text-xs text-neutral-600">{formattedDuration}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'datetime' && (
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Elegí fecha y hora</h1>
            <p className="text-sm text-neutral-500 mb-1">{selectedNames}</p>
            <p className="text-xs text-neutral-400 mb-6">{formattedDuration}</p>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Fecha</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={booking.date}
                onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                className="input"
              />
            </div>

            {/* Time slots */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Horarios disponibles</label>
              {!booking.date ? (
                <p className="text-xs text-neutral-400 mb-3">Seleccioná una fecha para ver los horarios disponibles.</p>
              ) : generateTimeSlots().length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">No hay horarios disponibles para esta fecha. El negocio está cerrado.</p>
              ) : (
                <>
                  <p className="text-xs text-neutral-400 mb-3">Seleccioná un horario en intervalos de 15 minutos.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {generateTimeSlots().map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setBooking({ ...booking, time: slot.time })}
                        disabled={!slot.available}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          booking.time === slot.time
                            ? 'bg-accent-500 text-white'
                            : slot.available
                              ? 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-400'
                              : 'bg-neutral-100 border border-neutral-100 text-neutral-300 cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Tus datos</h1>
            <p className="text-sm text-neutral-500 mb-6">Completá tus datos para confirmar el turno.</p>

            <div className="space-y-4">
              <Input
                id="name"
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={booking.name}
                onChange={(e) => setBooking({ ...booking, name: e.target.value })}
              />
              <Input
                id="phone"
                type="tel"
                label="Teléfono"
                placeholder="+54 9 11 2345-6789"
                value={booking.phone}
                onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
              />
              <Input
                id="email"
                type="email"
                label="Email (opcional)"
                placeholder="tu@email.com"
                value={booking.email || ''}
                onChange={(e) => setBooking({ ...booking, email: e.target.value })}
              />

              {/* Summary */}
              <div className="card p-4 bg-neutral-50">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Resumen</h3>
                <p className="text-sm font-medium text-neutral-900">{selectedNames}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-neutral-400">
                    {booking.date} a las {booking.time}
                  </p>
                  <span className="text-xs text-neutral-500">{formattedDuration}</span>
                </div>
                <div className="border-t border-neutral-200 mt-2 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900">Total</span>
                  <span className="text-sm font-bold text-accent-600">${totalPrice.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-600">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">¡Turno confirmado!</h1>
            <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-8">
              Te enviamos un mensaje de confirmación. Nos vemos pronto en {slug}.
            </p>

            <div className="card p-4 inline-block text-left max-w-sm w-full mb-6">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Detalle</h3>
              <p className="text-sm font-medium text-neutral-900">{selectedNames}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {booking.date} a las {booking.time} — {formattedDuration}
              </p>
              <div className="border-t border-neutral-200 mt-2 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-900">Total</span>
                <span className="text-sm font-bold text-accent-600">${totalPrice.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <br />
            <a href={`/${slug}`} className="btn btn-primary btn-md inline-flex gap-2">
              Volver al inicio
            </a>
          </div>
        )}

        {/* Navigation buttons */}
        {step !== 'confirmation' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
            <button
              onClick={() => {
                const steps: Step[] = ['service', 'datetime', 'details'];
                const idx = steps.indexOf(step);
                if (idx > 0) setStep(steps[idx - 1]);
              }}
              disabled={step === 'service'}
              className="btn btn-ghost btn-md"
            >
              Volver
            </button>

            {step !== 'details' ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="btn-md gap-2">
                Continuar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="btn-md gap-2">
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Confirmar turno'}
              </Button>
            )}
          </div>
        )}
      </main>

      {submitError && <ErrorModal message={submitError} onClose={() => setSubmitError(null)} />}
    </div>
  );
}
