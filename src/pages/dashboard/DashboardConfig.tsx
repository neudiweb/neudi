import * as React from 'react';
import { supabase, type Business, type BusinessHour } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getDayName } from '../../utils/helpers';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, EmptyState } from '../../components/common/States';

interface BusinessInfo {
  name: string;
  address: string | null;
  city: string | null;
  timezone: string;
  currency: string;
}

interface TimeRange {
  id: string;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
}

interface DayHours {
  ranges: TimeRange[];
}

export function DashboardConfig() {
  const { businessSlug } = useAuth();
  const [business, setBusiness] = React.useState<BusinessInfo | null>(null);
  const [hours, setHours] = React.useState<Record<number, DayHours>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!businessSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', businessSlug)
          .single() as { data: Business | null; error: string | null };

        if (bizError) throw bizError;

        if (!cancelled && bizData) {
          setBusiness({
            name: bizData.name,
            address: bizData.address ?? '',
            city: bizData.city ?? '',
            timezone: bizData.timezone,
            currency: bizData.currency,
          });

          const { data: hoursData } = await supabase
            .from('business_hours')
            .select('*')
            .eq('business_id', bizData.id) as { data: BusinessHour[] | null; error: string | null };

          if (hoursData) {
            const hoursMap: Record<number, DayHours> = {};
            for (const h of hoursData) {
              if (!h.day_of_week) continue;
              if (!hoursMap[h.day_of_week]) {
                hoursMap[h.day_of_week] = { ranges: [] };
              }
              hoursMap[h.day_of_week].ranges.push({
                id: h.id,
                start_time: h.start_time,
                end_time: h.end_time,
                is_active: h.is_active ?? true,
              });
            }
            setHours(hoursMap);
          }
        }
      } catch (e) {
        console.error('Error loading config:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessSlug]);

  const formatTime = (t: string | null) => t ? t.substring(0, 5) : '';

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] mb-6">Configuración</h1>

          {loading ? (
            <LoadingSpinner />
          ) : business ? (
            <div className="space-y-6">
              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
                <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Información del negocio</h2>
                <div className="space-y-3 text-sm">
                  <DetailRow label="Nombre" value={business.name} />
                  {business.address && business.city ? (
                    <DetailRow label="Dirección" value={`${business.address}, ${business.city}`} />
                  ) : null}
                  <DetailRow label="Timezone" value={business.timezone} />
                  <DetailRow label="Moneda" value={business.currency} />
                </div>
              </div>

              <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl p-6">
                <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Horarios de atención</h2>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                    const dayData = hours[dow];
                    if (!dayData || dayData.ranges.length === 0) {
                      return (
                        <div key={dow} className="flex items-center justify-between py-2 border-b border-[var(--color-border-primary)] last:border-0">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{getDayName(dow)}</span>
                          <span className="text-sm text-red-400">Cerrado</span>
                        </div>
                      );
                    }

                    const timeStrings = dayData.ranges
                      .filter(r => r.is_active)
                      .map(r => `${formatTime(r.start_time)} - ${formatTime(r.end_time)}`)
                      .join(' / ');

                    return (
                      <div key={dow} className="flex items-center justify-between py-2 border-b border-[var(--color-border-primary)] last:border-0">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{getDayName(dow)}</span>
                        <span className="text-sm text-[var(--color-text-secondary)]">{timeStrings || 'Cerrado'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <a href="/#/dashboard/hours" className="block">
                <button className="btn-md w-full text-center">Administrar horarios</button>
              </a>
            </div>
          ) : (
            <EmptyState title="No se pudo cargar la configuración" description="Intentá de nuevo más tarde." />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-medium text-[var(--color-text-primary)] ml-4 text-right">{value}</span>
    </div>
  );
}
