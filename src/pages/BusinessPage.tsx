import * as React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BusinessNotFoundPage } from './BusinessNotFoundPage';

export function BusinessPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [activeTheme] = React.useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const isDark = activeTheme === 'dark';

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    async function fetchBusiness() {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle() as { data: any | null; error: unknown };

      if (bizError || !bizData) {
        navigate(`/${slug}/not-found`, { replace: true });
        return;
      }

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', bizData.id)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      setBusiness({ ...bizData, services: servicesData || [] });
      setLoading(false);
    }

    fetchBusiness();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className={`relative min-h-screen flex items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
        <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!business) {
    return <BusinessNotFoundPage />;
  }

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${isDark ? 'bg-zinc-950' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl animate-aurora-1" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-teal-500/10 via-green-500/5 to-transparent blur-3xl animate-aurora-2" />
      </div>

      <div className="relative">
        <header className={`border-b ${isDark ? 'border-emerald-500/10 bg-emerald-950/20' : 'border-emerald-200/50 bg-white/80'} backdrop-blur-xl sticky top-0 z-30`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-emerald-200/60 hover:text-emerald-200' : 'text-zinc-500 hover:text-zinc-900'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" strokeLinecap="round" />
                <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver a Neudi
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-sm font-black">N</span>
              </div>
            </div>
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div
            className="transition-all duration-1000"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-3`}
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              {business.name}
            </h1>
            {business.description && (
              <p className={`text-sm leading-relaxed max-w-lg ${isDark ? 'text-emerald-200/60' : 'text-zinc-500'}`}>
                {business.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 text-xs">
              {business.address && (
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-emerald-200/50' : 'text-zinc-500'}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {business.address}
                </span>
              )}
              {business.phone && (
                <a href={`tel:${business.phone}`} className={`flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} hover:underline`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {business.phone}
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-emerald-200/50' : 'text-zinc-400'}`}>
            Servicios
          </h2>
          <div className="space-y-3">
            {business.services?.map((service: any, i: number) => (
              <div
                key={service.id}
                className={`p-4 flex items-center justify-between rounded-xl border transition-all duration-500 ${
                  isDark
                    ? 'border-emerald-500/10 bg-emerald-950/10 hover:border-emerald-500/20'
                    : 'border-emerald-200/50 bg-white/80 hover:border-emerald-300'
                }`}
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.6s ease ${0.1 * i}s`,
                }}
              >
                <div>
                  <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{service.name}</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-emerald-200/40' : 'text-zinc-400'}`}>{service.duration_minutes} min</p>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {service.currency === 'ARS' ? '$' : service.currency}
                  {service.price?.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className={`border-t ${isDark ? 'border-emerald-500/10' : 'border-emerald-200/50'} py-6`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className={`text-xs ${isDark ? 'text-emerald-200/30' : 'text-zinc-400'}`}>Powered by Neudi</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
