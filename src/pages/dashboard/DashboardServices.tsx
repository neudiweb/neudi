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

const serviceIcons = [
  <svg key="default" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" /><rect x="9" y="5" width="6" height="3" rx="1" /></svg>,
];

export function DashboardServices() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<ServiceItem[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
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

  const openNew = () => {
    resetForm();
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
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
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

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(p);
  };

  return (
    <DashboardLayout currentTab="services">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center shadow-lg shadow-zinc-300/30 dark:shadow-zinc-900/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-900 dark:text-white">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
              <rect x="9" y="5" width="6" height="3" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Servicios</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Organizá y gestioná todos los servicios de tu negocio</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40">
          <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400 dark:text-zinc-500">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0 2-2h-2" />
              <rect x="9" y="5" width="6" height="3" rx="1" />
            </svg>
          </div>
          <div className="text-center max-w-sm">
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Sin servicios</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Agregá tu primer servicio para empezar a recibir turnos y organizar tu agenda.</p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Agregar servicio
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} className="group rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/40 dark:hover:shadow-zinc-900/40 transition-all duration-300 overflow-hidden">
                {/* Top accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-300 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500" />
                
                <div className="p-6">
                  {/* Icon + Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 group-hover:border-zinc-200 dark:group-hover:border-zinc-600 transition-all duration-200">
                        {serviceIcons[0]}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight">{service.name}</h3>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {service.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2 leading-relaxed">{service.description}</p>
                  )}
                  
                  {/* Price + Duration */}
                  <div className="flex items-end justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Precio</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{formatPrice(service.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 dark:text-zinc-500">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" strokeLinecap="round" />
                      </svg>
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{service.durationMinutes} min</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => openEdit(service)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.97]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors active:scale-[0.97]"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7h14z" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Modal */}
          {showForm && (
            <>
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }} />
              <div className="fixed inset-x-4 bottom-8 z-[60] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-3xl">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-none overflow-y-auto">
                  {/* Form header */}
                  <div className="sticky top-0 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-800/80 dark:to-zinc-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-md">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="dark:stroke-zinc-900">
                          {editingId ? (
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          ) : (
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          )}
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                        {editingId ? 'Editar servicio' : 'Nuevo servicio'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Nombre del servicio</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                        placeholder="Ej: Corte de cabello clásico"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Descripción</label>
                      <input
                        type="text"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Descripción del servicio"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Duración</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formDuration}
                            onChange={(e) => setFormDuration(Number(e.target.value))}
                            min={15}
                            step={15}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all pr-14"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 pointer-events-none">min</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Precio</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formPrice}
                            onChange={(e) => setFormPrice(Number(e.target.value))}
                            min={0}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all pr-12"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 pointer-events-none">ARS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-[0.97]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.97]"
                      >
                        {editingId ? 'Guardar cambios' : 'Crear servicio'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {(saveError || deleteError) && (
        <ErrorModal
          message={saveError || deleteError || ''}
          onClose={() => { setSaveError(null); setDeleteError(null); }}
        />
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
          <div className="max-w-sm w-full" style={{ animation: 'toastIn 0.3s ease-out' }}>
            <div className="bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800/50 rounded-2xl shadow-xl shadow-green-500/10 dark:shadow-green-500/20 p-6 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Servicio creado con éxito</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
