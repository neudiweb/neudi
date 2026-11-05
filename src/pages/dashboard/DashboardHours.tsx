import * as React from 'react';
import { supabase, type BusinessHour, type Business } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/common/States';
import { timeToMinutes, validateTimeRanges, jsDayToBusinessDay, businessDayToJsDay } from '../../utils/dateTime';
import { ErrorModal } from '../../components/ErrorModal';
import { TimePicker } from '../../components/TimePicker';
import { HolidaysNotice } from '../../components/dashboard/HolidaysNotice';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${String(h.padStart(2, '0'))}:${m}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${String(h.padStart(2, '0'))}:${m}`;
  }
  if (/^\d{1,2}$/.test(trimmed)) {
    return `${String(trimmed).padStart(2, '0')}:00`;
  }
  return trimmed;
}

interface TimeRangeState {
  id?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxAppointments: number;
}

interface DayHoursState {
  jsDay: number;
  ranges: TimeRangeState[];
}

const DEFAULT_RANGE: TimeRangeState = {
  startTime: '09:00',
  endTime: '18:00',
  isActive: true,
  maxAppointments: 1,
};

export function DashboardHours() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [dayHours, setDayHours] = React.useState<Map<number, DayHoursState>>(new Map());
  const dayHoursRef = React.useRef<Map<number, DayHoursState>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<number, string[]>>({});
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    dayHoursRef.current = dayHours;
  }, [dayHours]);

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

  // Fetch business hours
  const fetchHours = React.useCallback(async (bizId: string) => {
    if (!bizId) return;
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', bizId) as { data: BusinessHour[] | null; error: string | null };

      if (error) throw error;

      const hoursMap = new Map<number, DayHoursState>();
      for (const h of (data || [])) {
        const jsDay = businessDayToJsDay(h.day_of_week);
        if (!hoursMap.has(jsDay)) {
          hoursMap.set(jsDay, { jsDay, ranges: [] });
        }
        const dayData = hoursMap.get(jsDay)!;
        dayData.ranges.push({
          id: h.id,
          startTime: normalizeTime(h.start_time),
          endTime: normalizeTime(h.end_time),
          isActive: h.is_active,
          maxAppointments: h.max_appointments ?? 1,
        });
      }

      setDayHours(hoursMap);
    } catch (e) {
      console.error('Error fetching business hours:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (businessId) fetchHours(businessId);
  }, [businessId, fetchHours]);

  const toggleDay = (jsDay: number) => {
    setDayHours((prev) => {
      const next = new Map(prev);
      if (next.has(jsDay)) {
        next.delete(jsDay);
      } else {
        next.set(jsDay, {
          jsDay,
          ranges: [DEFAULT_RANGE],
        });
      }
      return next;
    });
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[jsDay];
      return next;
    });
  };

  const isDayOpen = (jsDay: number) => dayHours.has(jsDay);

  const addRange = (jsDay: number) => {
    setDayHours((prev) => {
      const next = new Map(prev);
      const dayData = next.get(jsDay);
      if (!dayData) return prev;

      const newRange = { ...DEFAULT_RANGE };
      const newRanges = [...dayData.ranges, newRange];
      
      next.set(jsDay, { ...dayData, ranges: newRanges });
      return next;
    });
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[jsDay];
      return next;
    });
  };

  const removeRange = (jsDay: number, rangeIndex: number) => {
    setDayHours((prev) => {
      const next = new Map(prev);
      const dayData = next.get(jsDay);
      if (!dayData || dayData.ranges.length <= 1) return prev;

      const newRanges = dayData.ranges.filter((_, i) => i !== rangeIndex);
      next.set(jsDay, { ...dayData, ranges: newRanges });
      return next;
    });
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[jsDay];
      return next;
    });
  };

  const updateRange = (jsDay: number, rangeIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const normalizedValue = normalizeTime(value);
    
    setDayHours((prev) => {
      const next = new Map(prev);
      const dayData = next.get(jsDay);
      if (!dayData) return prev;

      const newRanges = [...dayData.ranges];
      newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: normalizedValue };
      
      next.set(jsDay, { ...dayData, ranges: newRanges });
      
      // Also update the ref so handleAutoSave reads the latest value
      dayHoursRef.current = next;
      
      return next;
    });

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[jsDay];
      return next;
    });
  };

  const toggleRange = (jsDay: number, rangeIndex: number) => {
    setDayHours((prev) => {
      const next = new Map(prev);
      const dayData = next.get(jsDay);
      if (!dayData) return prev;

      const newRanges = [...dayData.ranges];
      newRanges[rangeIndex] = { ...newRanges[rangeIndex], isActive: !newRanges[rangeIndex].isActive };
      
      next.set(jsDay, { ...dayData, ranges: newRanges });
      return next;
    });
  };

  // Validate all days before save — validates against provided hours, not stale state
  const validateAll = (hoursToValidate?: Map<number, DayHoursState>): boolean => {
    const hours = hoursToValidate ?? dayHours;
    const errors: Record<number, string[]> = {};
    let isValid = true;

    for (const [jsDay, dayData] of hours) {
      const rangeErrors = validateTimeRanges(dayData.ranges);
      if (rangeErrors.length > 0) {
        errors[jsDay] = rangeErrors;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const performSave = React.useCallback(async (bizId: string, currentDayHours: Map<number, DayHoursState>) => {
    if (!bizId) return false;
    
    if (!validateAll(currentDayHours)) {
      return false;
    }

    try {
      // Build new records to insert
      const recordsToInsert: Array<{
        business_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_active: boolean;
        max_appointments: number;
      }> = [];

      for (const [jsDay, dayData] of currentDayHours) {
        const businessDay = jsDayToBusinessDay(jsDay);
        for (const range of dayData.ranges) {
          recordsToInsert.push({
            business_id: bizId,
            day_of_week: businessDay,
            start_time: normalizeTime(range.startTime),
            end_time: normalizeTime(range.endTime),
            is_active: range.isActive,
            max_appointments: range.maxAppointments,
          });
        }
      }

      // Delete ALL existing records for this business first (avoids exclusion constraint conflicts)
      const { error: deleteAllError } = await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', bizId);

      if (deleteAllError) {
        console.error('[DashboardHours] Delete all error:', deleteAllError);
        setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
        return false;
      }

      // Insert all new records in one batch
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('business_hours')
          .insert(recordsToInsert as any);

        if (insertError) {
          console.error('[DashboardHours] Insert error:', insertError);
          setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
          return false;
        }
      }

      return true;
    } catch (e) {
      console.error('[DashboardHours] Error saving hours:', e);
      setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
      return false;
    }
  }, []);

  const handleSave = async () => {
    if (!businessId) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const currentDayHours = dayHoursRef.current;
    const success = await performSave(businessId, currentDayHours);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchHours(businessId);
    }
    
    setSaving(false);
  };

  const handleAutoSave = React.useCallback(async (newStartTime: string, newEndTime: string, editJsDay: number, editRangeIndex: number) => {
    if (!businessId || saving) return;
    
    setSaving(true);
    setSaveError(null);

    // Apply the new times to the current state before saving
    const updatedDayHours = new Map(dayHoursRef.current);
    const dayData = updatedDayHours.get(editJsDay);
    if (dayData) {
      const newRanges = [...dayData.ranges];
      newRanges[editRangeIndex] = {
        ...newRanges[editRangeIndex],
        startTime: newStartTime,
        endTime: newEndTime,
      };
      updatedDayHours.set(editJsDay, { ...dayData, ranges: newRanges });
    }
    
    // Update the ref with the applied changes
    dayHoursRef.current = updatedDayHours;

    const success = await performSave(businessId, updatedDayHours);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchHours(businessId);
    }
    
    setSaving(false);
  }, [businessId, saving, performSave, fetchHours]);

  if (loading) {
    return (
      <DashboardLayout currentTab="hours">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentTab="hours">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center shadow-lg shadow-zinc-300/30 dark:shadow-zinc-900/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-900 dark:text-white">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Horarios de atención</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Definí qué días y horarios tu negocio atiende. Los días cerrados no mostrarán turnos disponibles.</p>
          </div>
        </div>
      </div>

      <HolidaysNotice />

      {/* Days grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day, index) => {
          const jsDay = index;
          const dayData = dayHours.get(jsDay);
          const hasErrors = validationErrors[jsDay];
          const isOpen = isDayOpen(jsDay);

          return (
            <div
              key={day}
              className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg hover:shadow-zinc-200/40 dark:hover:shadow-zinc-900/40'
                  : 'border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/30'
              }`}
            >
              {/* Top accent bar */}
              {isOpen && (
                <div className="h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-300 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500" />
              )}
              
              <div className="p-4 sm:p-5">
                {/* Day header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Day icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-semibold transition-all duration-200 ${
                      isOpen
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-300/30 dark:shadow-zinc-900/50'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {day.charAt(0)}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold block ${
                        isOpen ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500'
                      }`}>
                        {day}
                      </span>
                      <span className={`text-xs font-medium ${
                        isOpen ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600'
                      }`}>
                        {isOpen ? 'Horario activo' : 'Día cerrado'}
                      </span>
                    </div>
                  </div>

                  {/* Day toggle */}
                  <button
                    onClick={() => toggleDay(jsDay)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 ${
                      isOpen
                        ? 'bg-zinc-900 dark:bg-zinc-100 shadow-sm shadow-zinc-300/30 dark:shadow-zinc-900/50'
                        : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                    }`}
                    aria-label={isOpen ? 'Cerrar día' : 'Abrir día'}
                    role="switch"
                    aria-checked={isOpen}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 flex items-center justify-center border-2 ${
                      isOpen
                        ? 'translate-x-5 bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-zinc-300 dark:bg-zinc-500 border-zinc-300 dark:border-zinc-500 text-white'
                    }`}>
                      {isOpen && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>

                {/* Day content - time ranges */}
                {isOpen && dayData && (
                  <div className="space-y-2">
                    {dayData.ranges.map((range, rangeIndex) => (
                      <div
                        key={rangeIndex}
                        className={`rounded-xl transition-all duration-200 overflow-visible ${
                          range.isActive
                            ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm'
                            : 'bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 opacity-60'
                        }`}
                      >
                        {/* Row header: active toggle + delete */}
                        <div className="flex items-center justify-between px-2.5 pt-2 pb-0.5">
                          <button
                            onClick={() => toggleRange(jsDay, rangeIndex)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 ${
                              range.isActive
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}
                            aria-label={range.isActive ? 'Desactivar franja' : 'Activar franja'}
                            title={range.isActive ? 'Franja activa' : 'Franja desactivada'}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                              range.isActive
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}>
                              {range.isActive && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </button>
                          {dayData.ranges.length > 1 && (
                            <button
                              onClick={() => removeRange(jsDay, rangeIndex)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                'text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                              }`}
                              aria-label="Eliminar franja"
                              title="Eliminar franja"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Capacity selector */}
                        <div className="px-2.5 pb-1">
                          <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                            Turnos máx.
                          </label>
                          <select
                            value={range.maxAppointments}
                            onChange={(e) => {
                              setDayHours((prev) => {
                                const next = new Map(prev);
                                const dayData = next.get(jsDay);
                                if (!dayData) return prev;
                                const newRanges = [...dayData.ranges];
                                newRanges[rangeIndex] = { ...newRanges[rangeIndex], maxAppointments: parseInt(e.target.value) };
                                next.set(jsDay, { ...dayData, ranges: newRanges });
                                return next;
                              });
                            }}
                            disabled={!range.isActive}
                            className="w-full px-3 py-2 text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-zinc-100/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n} {n === 1 ? 'turno' : 'turnos'}</option>
                            ))}
                          </select>
                        </div>

                        {/* Time inputs */}
                        <div className="px-2.5 pb-2">
                          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                                Inicio
                              </label>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                                Fin
                              </label>
                            </div>
                          </div>
                          <TimePicker
                            startTime={range.startTime}
                            endTime={range.endTime}
                            onStartChange={(v) => updateRange(jsDay, rangeIndex, 'startTime', v)}
                            onEndChange={(v) => updateRange(jsDay, rangeIndex, 'endTime', v)}
                            onSave={handleAutoSave}
                            jsDay={jsDay}
                            rangeIndex={rangeIndex}
                            disabled={!range.isActive}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add range button */}
                    <button
                      onClick={() => addRange(jsDay)}
                      className="w-full flex items-center justify-center gap-2 py-4 px-4 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:border-zinc-500 dark:hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Agregar otra franja horaria
                    </button>

                    {/* Validation errors */}
                    {hasErrors && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400">
                        {hasErrors.map((error, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                            </svg>
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Closed day state */}
                {!isOpen && (
                  <div className="flex items-center justify-center gap-2 py-6 text-zinc-400 dark:text-zinc-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-medium">Este día está cerrado</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/30 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cambios guardados correctamente
        </div>
      )}

      {/* Save button - always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-lg shadow-zinc-300/20 dark:shadow-zinc-900/30 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {saveError && <ErrorModal message={saveError} onClose={() => setSaveError(null)} />}
    </DashboardLayout>
  );
}
