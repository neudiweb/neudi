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

export function DashboardClients() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  // Fetch business_id from slug
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

  // Fetch customers with visit counts from appointments
  const fetchClients = React.useCallback(async (bizId: string) => {
    if (!bizId) return;

    try {
      // Get appointment stats per customer_id for this business
      const { data: apptData, error: apptsError } = await supabase
        .from('appointments')
        .select('customer_id, customer_name, start_at, status')
        .eq('business_id', bizId)
        .in('status', ['CONFIRMED', 'COMPLETED', 'PENDING', 'NO_SHOW'])
        .not('customer_id', 'is', 'null') as { data: Appointment[] | null; error: string | null };

      if (apptsError) throw apptsError;

      // Build a map of customer_id -> { count, lastVisit, name }
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

      // Fetch all customers for this business
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

      // Also include customers that only appear in appointments (not yet in customers table)
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

  return (
    <DashboardLayout currentTab="clients">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Clientes</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{clients.length} clientes registrados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay clientes registrados."
          description={searchQuery ? 'Probá con otros términos de búsqueda.' : 'No hay clientes aún.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div key={client.id} className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-surface)] shadow-sm hover:shadow-md transition-shadow">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center text-white font-semibold shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">{client.name}</h3>
                <p className="text-xs text-[var(--color-text-secondary)] truncate">
                  {client.phone || client.email || 'Sin contacto'}
                </p>
              </div>

              {/* Last visit */}
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-[var(--color-text-secondary)]">Última visita</p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {client.lastVisit
                    ? new Date(client.lastVisit + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                    : '—'}
                </p>
              </div>

              {/* Stats */}
              <div className="shrink-0">
                <span className="inline-flex items-center rounded-full bg-accent-500/10 text-accent-400 px-2.5 py-0.5 text-xs font-medium border border-accent-500/20">
                  {client.totalVisits} visita{client.totalVisits !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
