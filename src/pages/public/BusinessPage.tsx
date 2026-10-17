import { useParams } from 'react-router-dom';
import * as React from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { getBusiness } from '../../services/businessService';
import { formatPrice } from '../../utils/helpers';

export function BusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = React.useState<Awaited<ReturnType<typeof getBusiness>> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getBusiness(slug);
        if (!cancelled) setBusiness(data);
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-6xl mx-auto px-4 py-32 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Cargando...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!business) {
    return (
      <PublicLayout>
        <div className="max-w-6xl mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Negocio no encontrado</h1>
          <a href="/" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">&larr; Volver al inicio</a>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="bg-gradient-to-b from-[var(--color-bg-surface)] to-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">{business.city}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] mb-6">
            {business.name}
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            {business.description}
          </p>
          <a href={`/business/${slug}/reservar`} className="inline-flex items-center justify-center bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-medium rounded-xl px-8 py-3 text-base hover:opacity-90 transition-opacity shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2">
            Reservar turno
          </a>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3 text-center">Nuestros servicios</h2>
        <p className="text-[var(--color-text-secondary)] text-center mb-12 max-w-lg mx-auto">Elegí tu servicio y reservá en pocos pasos.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {business.services.map((s) => (
            <div key={s.id} className="rounded-xl border border-[var(--color-border-primary)] p-6 hover:border-[var(--color-accent-500)] transition-colors bg-[var(--color-bg-surface)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--color-text-primary)]">{s.name}</h3>
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{formatPrice(s.price)}</span>
              </div>
              {s.description && <p className="text-sm text-[var(--color-text-secondary)] mb-4">{s.description}</p>}
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {s.duration_minutes} min
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-bg-surface)] border-y border-[var(--color-border-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3 text-center">Horarios</h2>
          <p className="text-[var(--color-text-secondary)] text-center mb-12 max-w-lg mx-auto">Nuestro horario semanal de atención.</p>

          <div className="max-w-md mx-auto space-y-1">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
              const schedule = business.businessHours.find((bh) => bh.dayOfWeek === dow);
              if (!schedule && dow !== 0) return null;

              let hours = 'Cerrado';
              if (schedule && schedule.ranges.length > 0) {
                const timeStrings = schedule.ranges.map((r) => `${r.startTime} - ${r.endTime}`);
                hours = timeStrings.join(' / ');
              }

              const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

              return (
                <div key={dow} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[var(--color-bg-surface-hover)] transition-colors">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{dayNames[dow]}</span>
                  <span className={`text-sm ${hours === 'Cerrado' ? 'text-red-400' : 'text-[var(--color-text-secondary)]'}`}>{hours}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">Ubicación</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">{business.address}, {business.city}</p>
          <a href={`/business/${slug}/reservar`} className="inline-flex items-center justify-center bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] font-medium rounded-xl px-8 py-3 text-base hover:bg-[var(--color-bg-surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-500)] focus-visible:ring-offset-2">
            Reservar ahora
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
