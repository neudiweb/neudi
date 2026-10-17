import * as React from 'react';
import { supabase, type BusinessHour, type Business } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/States';
import { timeToMinutes, validateTimeRanges, jsDayToBusinessDay, businessDayToJsDay } from '../../utils/dateTime';
import { ErrorModal } from '../../components/ErrorModal';
import { TimePicker } from '../../components/TimePicker';
import { UpcomingHolidayNotice } from '../../components/dashboard/UpcomingHolidayNotice';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function normalizeTime(value: string): string {
  const trimmed = value.trim();
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
}

interface DayHoursState {
  jsDay: number;
  ranges: TimeRangeState[];
}

const DEFAULT_RANGE: TimeRangeState = {
  startTime: '09:00',
  endTime: '18:00',
  isActive: true,
};

export function DashboardHours() {
  const { businessSlug } = useAuth();
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [dayHours, setDayHours] = React.useState<Map<number, DayHoursState>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<Record<number, string[]>>({});
  const [saveError, setSaveError] = React.useState<string | null>(null);

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
        // Convert DB day_of_week (1=Lun, ..., 7=Dom) to UI jsDay (0=Dom, 1=Lun, ..., 6=Sab)
        const jsDay = businessDayToJsDay(h.day_of_week);
        if (!hoursMap.has(jsDay)) {
          hoursMap.set(jsDay, { jsDay, ranges: [] });
        }
        const dayData = hoursMap.get(jsDay)!;
        dayData.ranges.push({
          id: h.id,
          startTime: h.start_time,
          endTime: h.end_time,
          isActive: h.is_active,
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
    setDayHours((prev) => {
      const next = new Map(prev);
      const dayData = next.get(jsDay);
      if (!dayData) return prev;

      const normalizedValue = normalizeTime(value);
      const newRanges = [...dayData.ranges];
      newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: normalizedValue };
      
      next.set(jsDay, { ...dayData, ranges: newRanges });
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

  // Validate all days before save
  const validateAll = (): boolean => {
    const errors: Record<number, string[]> = {};
    let isValid = true;

    for (const [jsDay, dayData] of dayHours) {
      const rangeErrors = validateTimeRanges(dayData.ranges);
      if (rangeErrors.length > 0) {
        errors[jsDay] = rangeErrors;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!businessId) return;
    
    if (!validateAll()) {
      return;
    }

    setSaving(true);

    try {
      // Load existing records grouped by business day
      const { data: existing } = await supabase
        .from('business_hours')
        .select('*')
        .eq('business_id', businessId) as { data: BusinessHour[] | null; error: string | null };

      if (!existing) {
        setSaveError('No se pudieron cargar los horarios existentes.');
        setSaving(false);
        return;
      }

      // Build a map: jsDay (0-6) -> array of existing records with their DB id
      const existingByJsDay = new Map<number, BusinessHour[]>();
      for (const record of existing) {
        const jsDay = businessDayToJsDay(record.day_of_week);
        if (!existingByJsDay.has(jsDay)) {
          existingByJsDay.set(jsDay, []);
        }
        existingByJsDay.get(jsDay)!.push(record);
      }

      // Determine which days have changed and what the new state should be
      const daysToUpsert: Array<{ jsDay: number; businessDay: number; ranges: TimeRangeState[]; oldIds: string[] }> = [];

      for (const [jsDay, dayData] of dayHours) {
        const businessDay = jsDayToBusinessDay(jsDay);
        const oldIds = (existingByJsDay.get(jsDay) || []).map(r => r.id!);
        daysToUpsert.push({ jsDay, businessDay, ranges: dayData.ranges, oldIds });
      }

      // For each modified day, delete old records first, then insert new ones
      for (const dayInfo of daysToUpsert) {
        // Delete existing records for this day
        if (dayInfo.oldIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('business_hours')
            .delete()
            .in('id', dayInfo.oldIds);

          if (deleteError) {
            console.error('Error deleting old hours:', deleteError);
            setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
            setSaving(false);
            return;
          }
        }

        // Insert new ranges for this day
        if (dayInfo.ranges.length > 0) {
          const recordsToInsert = dayInfo.ranges.map(r => ({
            business_id: businessId,
            day_of_week: dayInfo.businessDay,
            start_time: normalizeTime(r.startTime),
            end_time: normalizeTime(r.endTime),
            is_active: r.isActive,
          }));

          const { error: insertError } = await supabase
            .from('business_hours')
            .insert(recordsToInsert as any);

          if (insertError) {
            console.error('Error inserting hours:', insertError);
            setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
            setSaving(false);
            return;
          }
        }
      }

      // Reload from DB to reflect actual saved state
      await fetchHours(businessId);
    } catch (e) {
      console.error('Error saving hours:', e);
      setSaveError('No se pudieron guardar los horarios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Horarios de atención</h1>
        <p className="text-sm text-neutral-500 mt-1">Definí qué días y horarios tu negocio atiende. Los días cerrados no mostrarán turnos disponibles.</p>
      </div>

      <UpcomingHolidayNotice />

      {/* Days grid */}
      <div className="space-y-3">
        {DAYS.map((day, index) => {
          const jsDay = index;
          const dayData = dayHours.get(jsDay);
          const hasErrors = validationErrors[jsDay];
          const isOpen = isDayOpen(jsDay);

          return (
            <div
              key={day}
              className={`rounded-xl border transition-all duration-200 ${
                isOpen
                  ? 'border-neutral-200 bg-white shadow-sm'
                  : 'border-neutral-100 bg-neutral-50/50'
              }`}
            >
              {/* Day header row */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* Day name with icon */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold ${
                      isOpen
                        ? 'bg-accent-50 text-accent-600'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {day.charAt(0)}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold block ${
                        isOpen ? 'text-neutral-900' : 'text-neutral-400'
                      }`}>
                        {day}
                      </span>
                      <span className={`text-xs ${
                        isOpen ? 'text-neutral-500' : 'text-neutral-400'
                      }`}>
                        {isOpen ? 'Horario activo' : 'Día cerrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day toggle - larger, more visible */}
                <button
                  onClick={() => toggleDay(jsDay)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2 ${
                    isOpen
                      ? 'bg-accent-500 shadow-sm shadow-accent-200'
                      : 'bg-neutral-200 hover:bg-neutral-300'
                  }`}
                  aria-label={isOpen ? 'Cerrar día' : 'Abrir día'}
                  role="switch"
                  aria-checked={isOpen}
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-200 flex items-center justify-center border-2 ${
                    isOpen
                      ? 'translate-x-6 bg-white border-accent-500 text-accent-600'
                      : 'bg-neutral-300 border-neutral-300 text-white'
                  }`}>
                    {isOpen && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              {/* Day content - time ranges */}
              {isOpen && dayData && (
                <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t border-neutral-100">
                  <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                    {dayData.ranges.map((range, rangeIndex) => (
                      <div
                        key={rangeIndex}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
                          range.isActive
                            ? 'bg-white border border-neutral-100'
                            : 'bg-neutral-50 border border-neutral-100 opacity-60'
                        }`}
                      >
                        {/* Active indicator - badge style */}
                        <button
                          onClick={() => toggleRange(jsDay, rangeIndex)}
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2 ${
                            range.isActive
                              ? 'bg-accent-500 text-white shadow-sm'
                              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                          }`}
                          aria-label={range.isActive ? 'Desactivar franja' : 'Activar franja'}
                          title={range.isActive ? 'Franja activa' : 'Franja desactivada'}
                        >
                          {range.isActive ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" strokeLinecap="round" />
                            </svg>
                          )}
                        </button>

                        {/* Time range display */}
                        <div className="flex items-center gap-2 flex-1">
                          <TimePicker
                            value={range.startTime}
                            onChange={(v) => updateRange(jsDay, rangeIndex, 'startTime', v)}
                            disabled={!range.isActive}
                          />
                          <span className="text-neutral-300 text-lg font-light px-1">—</span>
                          <TimePicker
                            value={range.endTime}
                            onChange={(v) => updateRange(jsDay, rangeIndex, 'endTime', v)}
                            disabled={!range.isActive}
                          />
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeRange(jsDay, rangeIndex)}
                          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2 ${
                            dayData.ranges.length <= 1
                              ? 'text-neutral-200 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          disabled={dayData.ranges.length <= 1}
                          aria-label="Eliminar franja"
                          title={dayData.ranges.length <= 1 ? 'Debes tener al menos una franja' : 'Eliminar franja'}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Add range button */}
                    <button
                      onClick={() => addRange(jsDay)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-neutral-200 rounded-lg text-sm text-neutral-500 hover:border-accent-300 hover:text-accent-600 hover:bg-accent-50/50 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Agregar otra franja horaria
                    </button>

                    {/* Validation errors */}
                    {hasErrors && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                        {hasErrors.map((error, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                            </svg>
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Closed day state */}
              {!isOpen && (
                <div className="px-4 pb-4 pt-2">
                  <div className="flex items-center justify-center gap-2 py-4 text-neutral-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-medium">Este día está cerrado</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-8">
        <Button variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              Guardando...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      {saveError && <ErrorModal message={saveError} onClose={() => setSaveError(null)} />}
    </DashboardLayout>
  );
}
