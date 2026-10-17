import { getBusiness, type BusinessData } from '../../services/businessService';
import { getAvailableSlots, createAppointment } from '../../services/appointmentService';
import { useParams } from 'react-router-dom';
import * as React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { formatPrice, BUSINESS_TIMEZONE, parseLocalDate, formatDate } from '../../utils/helpers';

const STEPS = [
  { label: 'Servicio', num: 1 },
  { label: 'Fecha', num: 2 },
  { label: 'Horario', num: 3 },
  { label: 'Datos', num: 4 },
  { label: 'Confirmar', num: 5 },
];

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [businessData, setBusinessData] = React.useState<BusinessData | null>(null);
  const [businessLoading, setBusinessLoading] = React.useState(true);
  const [businessError, setBusinessError] = React.useState(false);

  const [step, setStep] = React.useState(1);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [selectedTime, setSelectedTime] = React.useState<string>('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const [slots, setSlots] = React.useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getBusiness(slug);
        if (!cancelled && data) {
          setBusinessData(data);
        } else {
          setBusinessError(true);
        }
      } catch (e) {
        console.error(e);
        setBusinessError(true);
      } finally {
        if (!cancelled) setBusinessLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  React.useEffect(() => {
    if (!selectedDate || !selectedServiceId || !slug) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const available = await getAvailableSlots(
          slug,
          selectedServiceId ? [selectedServiceId] : [],
          selectedDate
        );
        if (!cancelled) {
          setSlots(available.map((s) => s.time));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate, selectedServiceId, slug]);

  const business = businessData;

  if (businessLoading) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full mx-auto" />
        </div>
      </PublicLayout>
    );
  }

  if (!business || businessError) {
    return (
      <PublicLayout>
        <div className="max-w-6xl mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Negocio no encontrado</h1>
        </div>
      </PublicLayout>
    );
  }

  const selectedService = business.services.find((s) => s.id === selectedServiceId);

  const dates = React.useMemo(() => {
    const result: { dateStr: string; label: string; dayNum: number; month: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result.push({
        dateStr,
        label: new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d),
        dayNum: d.getDate(),
        month: new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(d),
      });
    }
    return result;
  }, []);

  const isDateAvailable = React.useCallback((dateStr: string) => {
    const dateObj = parseLocalDate(dateStr, BUSINESS_TIMEZONE);
    const jsDay = dateObj.getDay();
    return business.businessHours.some((bh) => bh.dayOfWeek === jsDay && bh.ranges.length > 0);
  }, [business.businessHours]);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setStep(2);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !slug) return;
    setSubmitting(true);

    try {
      const result = await createAppointment({
        businessSlug: slug,
        serviceIds: [selectedService.id],
        date: selectedDate,
        time: selectedTime,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        customerNotes: notes || undefined,
      });

      if (result.success) {
        setStep(6);
      } else {
        setToastMessage(result.error || 'Error al crear la reserva. Intentá nuevamente.');
      }
    } catch (e) {
      console.error(e);
      setToastMessage('Error al crear la reserva. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedServiceId;
      case 2: return !!selectedDate;
      case 3: return !!selectedTime;
      case 4: return name.trim() && phone.trim() && email.trim();
      default: return false;
    }
  };

  if (step === 6) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">Solicitud enviada</h1>
          <p className="text-[var(--color-text-secondary)] mb-10 max-w-md mx-auto">Tu solicitud fue recibida y queda pendiente de confirmación por parte del negocio.</p>

          <div className="text-left bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 space-y-4 max-w-sm mx-auto mb-8">
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Servicio</p>
              <p className="font-medium text-[var(--color-text-primary)]">{selectedService?.name}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Fecha y hora</p>
              <p className="font-medium text-[var(--color-text-primary)]">
                {formatDate(selectedDate, BUSINESS_TIMEZONE)} a las {selectedTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Cliente</p>
              <p className="font-medium text-[var(--color-text-primary)]">{name}</p>
            </div>
            <div>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDIENTE</span>
            </div>
          </div>

          <a href="/" className="inline-flex items-center justify-center bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] font-medium rounded-xl px-8 py-3 text-base hover:bg-[var(--color-bg-surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2">
            Volver al inicio
          </a>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm" style={{ animation: 'toastIn 0.3s ease-out' }}>
          <div className="bg-[var(--color-bg-surface)] border border-red-500/30 rounded-xl shadow-lg p-4 flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">No se pudo reservar</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
        <nav aria-label="Progreso de reserva" className="mb-10">
          <ol className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                  step >= s.num ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)]'
                }`}>
                  {step > s.num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : s.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${step > s.num ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border-primary)]'}`} />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">Elegí un servicio</h1>
            <p className="text-[var(--color-text-secondary)] mb-8">{business.name}</p>
            <div className="space-y-3">
              {business.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleServiceSelect(s.id)}
                  className={`w-full text-left rounded-xl border p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] ${
                    selectedServiceId === s.id ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-text-primary)]' : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent-500)] bg-[var(--color-bg-surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--color-text-primary)]">{s.name}</span>
                    <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatPrice(s.price)}</span>
                  </div>
                  {s.description && <p className="text-sm text-[var(--color-text-secondary)] mb-2">{s.description}</p>}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {s.duration_minutes} min
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 flex items-center gap-1">
              &larr; Volver
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">Elegí una fecha</h1>
            <p className="text-[var(--color-text-secondary)] mb-6">{selectedService?.name} &middot; {selectedService && formatPrice(selectedService.price)}</p>

            <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:flex-wrap sm:overflow-visible">
              {dates.map((d) => {
                const available = isDateAvailable(d.dateStr);
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => available && handleDateSelect(d.dateStr)}
                    disabled={!available}
                    className={`flex-shrink-0 flex flex-col items-center rounded-xl border p-3 min-w-[64px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] ${
                      selectedDate === d.dateStr
                        ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                        : available
                          ? 'border-[var(--color-border-primary)] hover:border-[var(--color-accent-500)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
                          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)] cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs">{d.label.charAt(0).toUpperCase() + d.label.slice(1)}</span>
                    <span className="text-lg font-bold mt-0.5">{d.dayNum}</span>
                    <span className="text-xs mt-0.5">{d.month.charAt(0).toUpperCase() + d.month.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 flex items-center gap-1">
              &larr; Volver
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">Elegí un horario</h1>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {formatDate(selectedDate, BUSINESS_TIMEZONE)}
            </p>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--color-text-primary)] border-t-transparent rounded-full" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] mt-4">No hay horarios disponibles para esta fecha.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slots.map((time) => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`py-3 px-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] ${
                      selectedTime === time
                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                        : 'border border-[var(--color-border-primary)] hover:border-[var(--color-accent-500)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 flex items-center gap-1">
              &larr; Volver
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">Tus datos</h1>
            <p className="text-[var(--color-text-secondary)] mb-6">Completá tus datos para reservar.</p>

            <div className="space-y-4 max-w-md">
              <Field id="name" label="Nombre *" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Tu nombre completo" required />
              <Field id="phone" label="Teléfono *" type="tel" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} placeholder="+54 9 11 1234-5678" required />
              <Field id="email" label="Email *" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="tu@email.com" required />
              <TextArea id="notes" label="Notas (opcional)" value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Me gustaría que me atienda Pepito si es posible." />

              <div className="pt-4">
                <button onClick={() => setStep(5)} disabled={!canProceed()} className="inline-flex items-center justify-center bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-medium rounded-xl px-6 py-3 text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2">
                  Revisar reserva
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <button onClick={() => setStep(4)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 flex items-center gap-1">
              &larr; Volver
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">Resumen</h1>
            <p className="text-[var(--color-text-secondary)] mb-6">Confirmá los datos de tu reserva.</p>

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl p-6 space-y-4 max-w-md mb-6">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Servicio</p>
                <p className="font-medium text-[var(--color-text-primary)]">{selectedService?.name}</p>
              </div>
              <hr className="border-[var(--color-border-primary)]" />
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Fecha</p>
                  <p className="font-medium text-[var(--color-text-primary)]">{formatDate(selectedDate, BUSINESS_TIMEZONE)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Hora</p>
                  <p className="font-medium text-[var(--color-text-primary)]">{selectedTime}</p>
                </div>
              </div>
              <hr className="border-[var(--color-border-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Precio</p>
                <p className="font-bold text-lg text-[var(--color-text-primary)]">{selectedService && formatPrice(selectedService.price)}</p>
              </div>
              <hr className="border-[var(--color-border-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Cliente</p>
                <p className="font-medium text-[var(--color-text-primary)]">{name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{phone} &middot; {email}</p>
              </div>
              {notes && (
                <>
                  <hr className="border-[var(--color-border-primary)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Notas</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{notes}</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 max-w-md">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-medium rounded-xl px-6 py-3 text-base hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2 flex-1 disabled:opacity-50"
              >
                {submitting ? 'Confirmando...' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function Field({ id, label, type = 'text', value, onChange, placeholder, required }: { id: string; label?: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)] focus:ring-offset-1" />
    </div>
  );
}

function TextArea({ id, label, value, onChange, placeholder }: { id: string; label?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">{label}</label>}
      <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} rows={3}
        className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)] focus:ring-offset-1 resize-y" />
    </div>
  );
}
