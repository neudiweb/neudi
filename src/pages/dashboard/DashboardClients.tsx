import * as React from 'react';
import { supabase, type Customer, type Appointment } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Input } from '../../components/ui/Input';
import { EmptyState, LoadingSpinner } from '../../components/common/States';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  lastVisit: string;
}

const avatarGradients = [
  'from-zinc-500 to-zinc-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-green-500',
  'from-fuchsia-500 to-pink-500',
];

function getAvatarGradient(name: string): string {
  const idx = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % avatarGradients.length;
  return avatarGradients[idx];
}

function getVisitBadge(totalVisits: number) {
  if (totalVisits >= 10) return { label: '⭐ VIP', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
  if (totalVisits >= 5) return { label: 'Frecuente', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
  if (totalVisits >= 2) return { label: `${totalVisits} visitas`, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' };
  return { label: '1 visita', color: 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' };
}

export function DashboardClients() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!businessSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('businesses')
          .select('id')
          .eq('slug', businessSlug)
          .single() as { data: { id: string } | null; error: string | null };
        if (!cancelled && data) setBusinessId(data.id);
      } catch (e) { console.error(e); }
    })();
    return () => { cancelled = true; };
  }, [businessSlug]);

  const fetchClients = React.useCallback(async (bizId: string) => {
    if (!bizId) return;

    try {
      const { data: apptData, error: apptsError } = await supabase
        .from('appointments')
        .select('customer_id, customer_name, start_at, status')
        .eq('business_id', bizId)
        .in('status', ['CONFIRMED', 'COMPLETED', 'PENDING', 'NO_SHOW'])
        .not('customer_id', 'is', 'null') as { data: Appointment[] | null; error: string | null };

      if (apptsError) throw apptsError;

      const statsMap = new Map<string, { totalVisits: number; lastVisit: string; name: string }>();

      for (const apt of (apptData || [])) {
        if (!apt.customer_id) continue;
        const existing = statsMap.get(apt.customer_id!) || { totalVisits: 0, lastVisit: '', name: apt.customer_name || '' };
        existing.totalVisits += 1;
        if (!existing.lastVisit || (apt.start_at && apt.start_at > existing.lastVisit)) {
          existing.lastVisit = apt.start_at.split('T')[0];
        }
        if (apt.customer_name && !existing.name) {
          existing.name = apt.customer_name;
        }
        statsMap.set(apt.customer_id!, existing);
      }

      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, email, business_id, created_at')
        .eq('business_id', bizId)
        .order('name', { ascending: true }) as { data: Customer[] | null; error: string | null };

      if (customersError) throw customersError;

      const mapped: Client[] = (customersData || []).map((row: Customer) => {
        const stats = statsMap.get(row.id) || { totalVisits: 0, lastVisit: '', name: '' };

        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email ?? undefined,
          totalVisits: stats.totalVisits,
          lastVisit: stats.lastVisit,
        };
      });

      for (const [custId, stats] of statsMap.entries()) {
        if (!mapped.find(c => c.id === custId)) {
          mapped.push({
            id: custId,
            name: stats.name || 'Cliente sin nombre',
            phone: '',
            email: undefined,
            totalVisits: stats.totalVisits,
            lastVisit: stats.lastVisit,
          });
        }
      }

      setClients(mapped);
    } catch (e) {
      console.error('Error fetching clients:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (businessId) fetchClients(businessId);
  }, [businessId, fetchClients]);

  const filtered = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q));
  });

  const totalVisits = clients.reduce((sum, c) => sum + c.totalVisits, 0);

  return (
    <DashboardLayout currentTab="clients">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center shadow-lg shadow-zinc-300/30 dark:shadow-zinc-900/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-900 dark:text-white">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Clientes</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{clients.length} registrados · {totalVisits} visitas totales</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 dark:text-zinc-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Clientes</p>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{clients.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 dark:text-zinc-400">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Visitas</p>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{totalVisits}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 dark:text-zinc-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Promedio</p>
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{clients.length > 0 ? (totalVisits / clients.length).toFixed(1) : '0'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mb-8">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40">
          <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 dark:text-zinc-500">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-center max-w-sm">
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {searchQuery ? 'Sin resultados' : 'Sin clientes registrados'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {searchQuery ? 'Probá con otros términos de búsqueda.' : 'Los clientes aparecerán aquí cuando agenden su primer turno.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const badge = getVisitBadge(client.totalVisits);
            const gradient = getAvatarGradient(client.name);
            return (
              <div key={client.id} className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/30 dark:hover:shadow-zinc-900/30 transition-all duration-200">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-lg`}>
                  {client.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">{client.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    {client.phone && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M22 7l-10 6L2 7" />
                        </svg>
                        {client.email}
                      </span>
                    )}
                    {!client.phone && !client.email && (
                      <span className="text-sm text-zinc-400 dark:text-zinc-500">Sin contacto</span>
                    )}
                  </div>
                </div>

                {/* Stats & Last visit - Desktop */}
                <div className="hidden md:flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Última visita</p>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {client.lastVisit
                        ? new Date(client.lastVisit + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                        : '—'}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
                  <span className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Mobile visit badge */}
                <div className="md:hidden flex items-center">
                  <span className={`inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
