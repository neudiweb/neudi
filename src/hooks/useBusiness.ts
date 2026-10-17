import * as React from 'react';
import { supabase, type Business } from '@/lib';

export function useBusiness(slug: string) {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { business, loading };
}
