import * as React from 'react';
import { supabase, type Appointment } from '@/lib';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/States';

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');
  const [appointment, setAppointment] = React.useState<Appointment | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!appointmentId) return;
    
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single() as { data: Appointment | null; error: string | null };

        if (!cancelled && !error && data) {
          setAppointment(data);
        }
      } catch (e) { console.error(e); }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [appointmentId]);

  if (loading) return <LoadingSpinner />;

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <path d="M20 6L9 17l-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">¡Turno confirmado!</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Te enviamos un email con los detalles de tu reserva.</p>

        {appointment && (
          <div className="bg-[var(--color-bg-surface)] rounded-xl p-6 border border-[var(--color-border-primary)] space-y-4 text-left">
            {/* Service */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Servicio</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{appointment.service_id || '—'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Fecha</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {new Date(appointment.start_at).toLocaleDateString('es-AR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Hora</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {formatTime(appointment.start_at)} — {formatTime(appointment.end_at)}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Estado</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                appointment.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' :
                appointment.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                'bg-[var(--color-bg-surface-hover)] text-[var(--color-text-secondary)]'
              }`}>
                {statusLabels[appointment.status] || appointment.status}
              </span>
            </div>

            {/* Customer */}
            <div className="border-t border-[var(--color-border-primary)] pt-3">
              <p className="text-sm text-[var(--color-text-primary)]">{appointment.customer_name}</p>
              {appointment.customer_phone && (
                <a href={`tel:${appointment.customer_phone}`} className="text-xs text-accent-600 hover:text-accent-700 mt-1 block">
                  {appointment.customer_phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="secondary" onClick={() => window.close()}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
