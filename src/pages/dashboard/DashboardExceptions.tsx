import * as React from 'react';
import { supabase, type BusinessException, type Business } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, LoadingSpinner } from '../../components/common/States';
import { ErrorModal } from '../../components/ErrorModal';

interface ExceptionItem {
  id: string;
  date: string;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
  reason: string;
}

export function DashboardExceptions() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [exceptions, setExceptions] = React.useState<ExceptionItem[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = React.useState('');
  const [formOpenTime, setFormOpenTime] = React.useState('09:00');
  const [formCloseTime, setFormCloseTime] = React.useState('18:00');
  const [formIsClosed, setFormIsClosed] = React.useState(false);
  const [formReason, setFormReason] = React.useState('');

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

  // Fetch exceptions
  const fetchExceptions = React.useCallback(async (bizId: string) => {
    if (!bizId) return;
    try {
      const { data, error } = await supabase
        .from('business_exceptions')
        .select('*')
        .eq('business_id', bizId)
        .order('date', { ascending: true }) as { data: BusinessException[] | null; error: string | null };

      if (error) throw error;

      setExceptions((data || []).map((e: BusinessException) => ({
        id: e.id,
        date: e.date,
        openTime: e.start_time ?? undefined,
        closeTime: e.end_time ?? undefined,
        isClosed: e.is_closed,
        reason: e.reason ?? '',
      })));
    } catch (e) {
      console.error('Error fetching exceptions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (businessId) fetchExceptions(businessId);
  }, [businessId, fetchExceptions]);

  // Real-time subscription
  React.useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel('exceptions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_exceptions',
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchExceptions(businessId)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId, fetchExceptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessId || !formDate) return;

    try {
      const { error: insertError } = await supabase.from('business_exceptions').insert({
        business_id: businessId,
        date: formDate,
        start_time: formIsClosed ? null : (formOpenTime || null),
        end_time: formIsClosed ? null : (formCloseTime || null),
        is_closed: formIsClosed,
        reason: formReason.trim() || null,
      } as any);

      if (insertError) {
        console.error('Error saving exception:', insertError);
        setSaveError('No se pudo guardar la excepción. Intentá de nuevo.');
        return;
      }

      setShowForm(false);
      setFormDate('');
      setFormReason('');
      setFormIsClosed(false);
    } catch (e) {
      console.error('Error saving exception:', e);
      setSaveError('No se pudo guardar la excepción. Intentá de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta excepción?')) return;
    try {
      const { error: deleteError } = await supabase.from('business_exceptions').delete().eq('id', id);
      if (deleteError) {
        console.error('Error deleting exception:', deleteError);
        setDeleteError('No se pudo eliminar la excepción. Intentá de nuevo.');
        return;
      }
    } catch (e) {
      console.error('Error deleting exception:', e);
      setDeleteError('No se pudo eliminar la excepción. Intentá de nuevo.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  };

  return (
    <DashboardLayout currentTab="exceptions">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Excepciones</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Días especiales o feriados</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="btn-md gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nueva excepción
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : exceptions.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <EmptyState
            title="Sin excepciones"
            description="No hay días especiales configurados."
          />
          <Button onClick={() => setShowForm(true)} className="btn-md">
            Agregar excepción
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {exceptions.map((exc) => (
              <div key={exc.id} className="card card-hover p-4 flex items-center gap-4">
                {/* Date */}
                <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-neutral-900 leading-none">
                    {new Date(exc.date + 'T12:00:00').getDate()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-neutral-900">{formatDate(exc.date)}</h3>
                  {exc.isClosed ? (
                    <p className="text-xs text-warning-600 mt-0.5">Cerrado todo el día</p>
                  ) : exc.openTime && exc.closeTime ? (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {exc.openTime} — {exc.closeTime}
                    </p>
                  ) : null}
                  {exc.reason && (
                    <p className="text-xs text-neutral-400 mt-1">{exc.reason}</p>
                  )}
                </div>

                {/* Delete */}
                <Button variant="danger" size="sm" onClick={() => handleDelete(exc.id)} className="shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14z" strokeLinecap="round" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mt-6 card p-6 space-y-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-4">Nueva excepción</h3>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Fecha</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formIsClosed}
                  onChange={(e) => setFormIsClosed(e.target.checked)}
                  className="w-4 h-4 text-accent-600 rounded border-neutral-300 focus:ring-accent-500"
                />
                <label htmlFor="allDay" className="text-sm text-neutral-700">Cerrado todo el día</label>
              </div>

              {!formIsClosed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Hora apertura</label>
                    <Input
                      type="time"
                      value={formOpenTime}
                      onChange={(e) => setFormOpenTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Hora cierre</label>
                    <Input
                      type="time"
                      value={formCloseTime}
                      onChange={(e) => setFormCloseTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Motivo (opcional)</label>
                <Input
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Ej: Feriado nacional"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          )}
        </>
      )}

      {(saveError || deleteError) && (
        <ErrorModal
          message={saveError || deleteError || ''}
          onClose={() => { setSaveError(null); setDeleteError(null); }}
        />
      )}
    </DashboardLayout>
  );
}
