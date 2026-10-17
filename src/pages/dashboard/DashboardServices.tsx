import * as React from 'react';
import { supabase, type Service } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState, LoadingSpinner } from '../../components/common/States';
import { ErrorModal } from '../../components/ErrorModal';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export function DashboardServices() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');
  const [formDuration, setFormDuration] = React.useState(30);
  const [formPrice, setFormPrice] = React.useState(0);

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

  const fetchServices = React.useCallback(async (bizId: string) => {
    if (!bizId) return;
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', bizId)
        .order('name', { ascending: true }) as { data: Service[] | null; error: string | null };

      if (error) throw error;

      setServices((data || []).map((s: Service) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        durationMinutes: s.duration_minutes,
        price: s.price,
      })));
    } catch (e) {
      console.error('Error fetching services:', e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  React.useEffect(() => {
    if (businessId) fetchServices(businessId);
  }, [businessId, fetchServices]);

  React.useEffect(() => {
    if (!businessId) return;
    const channel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchServices(businessId)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId, fetchServices]);

  const refreshServices = async () => {
    if (businessId) {
      await fetchServices(businessId);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormDuration(30);
    setFormPrice(0);
  };

  const openEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setFormName(service.name);
    setFormDescription(service.description);
    setFormDuration(service.durationMinutes);
    setFormPrice(service.price);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessId || !formName.trim()) return;

    const serviceData = {
      name: formName,
      description: formDescription || null,
      duration_minutes: formDuration,
      price: formPrice,
    };

    try {
      if (editingId) {
        const { error: updateError } = await ((supabase as any).from('services').update(serviceData).eq('id', editingId));
        if (updateError) {
          console.error('Error saving service:', updateError);
          setSaveError('No se pudo guardar el servicio. Intentá de nuevo.');
          return;
        }
      } else {
        const { error: insertError } = await ((supabase as any).from('services').insert({ ...serviceData, business_id: businessId }));
        if (insertError) {
          console.error('Error saving service:', insertError);
          setSaveError('No se pudo guardar el servicio. Intentá de nuevo.');
          return;
        }
      }

      setShowForm(false);
      resetForm();
      await refreshServices();
    } catch (e) {
      console.error('Error saving service:', e);
      setSaveError('No se pudo guardar el servicio. Intentá de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      const { error: deleteError } = await supabase.from('services').delete().eq('id', id);
      if (deleteError) {
        console.error('Error deleting service:', deleteError);
        setDeleteError('No se pudo eliminar el servicio. Intentá de nuevo.');
        return;
      }
      await refreshServices();
    } catch (e) {
      console.error('Error deleting service:', e);
      setDeleteError('No se pudo eliminar el servicio. Intentá de nuevo.');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <DashboardLayout currentTab="services">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Servicios</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Gestioná los servicios de tu negocio</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-md gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo servicio
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : services.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <EmptyState
            title="Sin servicios"
            description="Agregá tu primer servicio para empezar a recibir turnos."
          />
          <Button onClick={() => setShowForm(true)} className="btn-md">
            Agregar servicio
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} className="card card-hover p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{service.name}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-4 flex-1">{service.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-primary)]">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">${service.price.toLocaleString('es-AR')}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{service.durationMinutes} min</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(service)} className="text-xs flex-1">
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(service.id)} className="text-xs px-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14z" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-6 card p-6 space-y-4">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4">
                {editingId ? 'Editar servicio' : 'Nuevo servicio'}
              </h3>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Nombre</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Ej: Corte de cabello clásico"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Descripción</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Descripción del servicio"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Duración (min)</label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Precio</label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="secondary" onClick={cancelForm}>Cancelar</Button>
                <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear servicio'}</Button>
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
