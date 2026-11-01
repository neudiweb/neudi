import * as React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type BusinessMember } from '../../lib/supabase';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/States';
import { getTodayInTimezone, BUSINESS_TIMEZONE } from '../../utils/helpers';

interface EmployeeSchedule {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

interface Employee {
  id: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  schedules: EmployeeSchedule[];
}

export function DashboardTeam() {
  const { businessId, businessSlug } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = React.useState(getTodayInTimezone(BUSINESS_TIMEZONE));
  const [saving, setSaving] = React.useState(false);

  // Fetch employees
  React.useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: members, error } = await supabase.rpc('get_business_employees', {
          p_business_id: businessId,
        } as any) as { data: Array<{ user_id: string; full_name: string; email: string; role: string }> | null; error: unknown };

        if (error || cancelled) return;

        const empList: Employee[] = (members || []).map((m: any) => ({
          id: m.user_id,
          full_name: m.full_name || 'Sin nombre',
          role: m.role as 'OWNER' | 'ADMIN' | 'STAFF',
          schedules: [],
        }));

        setEmployees(empList);
      } catch (e) {
        console.error('Error fetching employees:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [businessId]);

  // Fetch schedules for selected date
  const fetchSchedules = React.useCallback(async (date: string) => {
    if (!businessId) return;

    const { data: schedules, error } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('business_id', businessId)
      .eq('date', date)
      .order('start_time') as { data: any[] | null; error: unknown };

    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }

    // Merge schedules with employees
    setEmployees(prev => prev.map(emp => ({
      ...emp,
      schedules: (schedules || []).filter((s: any) => s.user_id === emp.id),
    })));
  }, [businessId]);

  React.useEffect(() => {
    fetchSchedules(selectedDate);
  }, [selectedDate, fetchSchedules]);

  // Toggle schedule for employee
  const toggleSchedule = async (employeeId: string, startTime: string, endTime: string, isWorking: boolean) => {
    if (!businessId || saving) return;

    setSaving(true);
    try {
      // Check if schedule exists
      const { data: existing } = await supabase
        .from('employee_schedules')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', employeeId)
        .eq('date', selectedDate)
        .eq('start_time', startTime)
        .eq('end_time', endTime)
        .maybeSingle() as { data: { id: string } | null; error: unknown };

      if (isWorking) {
        if (existing) {
          // Update existing
          await (supabase as any).from('employee_schedules')
            .update({ is_working: true, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase
            .from('employee_schedules')
            .insert({
              business_id: businessId,
              user_id: employeeId,
              date: selectedDate,
              start_time: startTime,
              end_time: endTime,
              is_working: true,
            } as any);
        }
      } else {
        if (existing) {
          // Delete
          await supabase
            .from('employee_schedules')
            .delete()
            .eq('id', existing.id);
        }
      }

      // Refresh schedules
      fetchSchedules(selectedDate);
    } catch (e) {
      console.error('Error saving schedule:', e);
    } finally {
      setSaving(false);
    }
  };

  // Copy schedules from yesterday
  const copyFromYesterday = async () => {
    if (!businessId || saving) return;

    setSaving(true);
    try {
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdaySchedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('business_id', businessId)
        .eq('date', yesterdayStr)
        .eq('is_working', true) as { data: any[] | null; error: unknown };

      if (yesterdaySchedules && yesterdaySchedules.length > 0) {
        const todaySchedules = yesterdaySchedules.map((s: any) => ({
          business_id: businessId,
          user_id: s.user_id,
          date: selectedDate,
          start_time: s.start_time,
          end_time: s.end_time,
          is_working: true,
        }));

        for (const schedule of todaySchedules) {
          const { data: existing } = await supabase
            .from('employee_schedules')
            .select('id')
            .eq('business_id', schedule.business_id)
            .eq('user_id', schedule.user_id)
            .eq('date', schedule.date)
            .eq('start_time', schedule.start_time)
            .eq('end_time', schedule.end_time)
            .maybeSingle() as { data: { id: string } | null; error: unknown };

          if (existing) {
            await (supabase as any).from('employee_schedules')
              .update({ is_working: true, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await (supabase as any).from('employee_schedules')
              .insert(schedule);
          }
        }

        fetchSchedules(selectedDate);
      }
    } catch (e) {
      console.error('Error copying schedules:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const timeSlots = [
    { start: '09:00', end: '13:00' },
    { start: '13:00', end: '19:00' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Equipo</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Gestioná los horarios de tu equipo
            </p>
          </div>
          <Button onClick={copyFromYesterday} disabled={saving} variant="secondary">
            {saving ? <LoadingSpinner size="sm" /> : '📋 Copiar de ayer'}
          </Button>
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)]"
          />
        </div>

        {/* Time slots */}
        {timeSlots.map((slot, slotIdx) => {
          const workingCount = employees.filter(emp =>
            emp.schedules.some(s => (s.start_time || '').substring(0, 5) === slot.start && (s.end_time || '').substring(0, 5) === slot.end && s.is_working)
          ).length;

          return (
            <div key={slotIdx} className="bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Franja: {slot.start} - {slot.end}
                </h3>
                <Badge variant="info">
                  {workingCount} empleado{workingCount !== 1 ? 's' : ''} trabajando
                </Badge>
              </div>

              <div className="space-y-2">
                {employees.map((emp) => {
                  const schedule = emp.schedules.find(
                    s => (s.start_time || '').substring(0, 5) === slot.start && (s.end_time || '').substring(0, 5) === slot.end
                  );
                  const isWorking = schedule?.is_working ?? false;

                  return (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between py-2 px-3 bg-[var(--color-bg-surface-hover)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-sm font-medium text-accent-600">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{emp.full_name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] capitalize">{emp.role.toLowerCase()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSchedule(emp.id, slot.start, slot.end, !isWorking)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isWorking
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)] hover:border-[var(--color-text-secondary)]'
                        }`}
                      >
                        {isWorking ? '✓ Trabajando' : '○ No trabaja'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Info */}
        <div className="bg-accent-500/5 border border-accent-500/20 rounded-xl p-4 space-y-2">
          <p className="text-sm text-[var(--color-text-primary)] font-medium">💡 ¿Cómo funciona?</p>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
            <li>Seleccioná una fecha y marcá qué empleados trabajan en cada franja horaria</li>
            <li>La cantidad de empleados trabajando determina cuántos turnos可同时 se pueden agendar</li>
            <li>Usá "Copiar de ayer" para no tener que configurar cada día manualmente</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
