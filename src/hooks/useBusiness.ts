import * as React from 'react';
import { supabase, type Business } from '@/lib/supabase';
import { BUSINESS_TIMEZONE } from '@/utils/dateTime';

export interface UseBusinessResult {
  business: Business | null;
  businessId: string | null;
  timezone: string;
  loading: boolean;
}

/**
 * Fuente única de fetch del negocio a partir del slug.
 * Consume `businesses` por slug y expone `business`, `businessId` y `timezone`
 * (con default de `BUSINESS_TIMEZONE`). Antes, cada dashboard (Agenda, Services,
 * Clients, Hours) repetía el mismo fetch de ~15 líneas.
 */
export function useBusiness(slug: string | undefined): UseBusinessResult {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!cancelled) {
          if (error) throw error;
          setBusiness(data);
        }
      } catch (e) {
        console.error('Error loading business:', e);
        if (!cancelled) setBusiness(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return {
    business,
    businessId: business?.id ?? null,
    timezone: business?.timezone ?? BUSINESS_TIMEZONE,
    loading,
  };
}
