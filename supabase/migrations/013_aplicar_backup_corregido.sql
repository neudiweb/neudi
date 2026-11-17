-- 013_aplicar_backup_corregido.sql
-- Aplica el backup corregido del escritorio a la base de datos actual
-- Este archivo asegura que el schema sea IDÉNTICO al backup NEUDI_DB_BACKUP.sql

-- ============================================================================
-- 1. DROP FUNCTIONS CONFLICTIVAS (seguro: DROP IF EXISTS)
-- ============================================================================

-- Eliminar versión conflictiva de create_public_appointment (con p_assigned_employee_id)
DROP FUNCTION IF EXISTS public.create_public_appointment(text, text[], text, text, text, timestamptz, timestamptz, text, uuid, uuid) CASCADE;

-- ============================================================================
-- 2. AGREGAR FUNCIONES FALTANTES
-- ============================================================================

-- get_available_slots_for_date (OVERLOAD 1 - returns TABLE)
CREATE OR REPLACE FUNCTION public.get_available_slots_for_date(p_business_id uuid, p_date text)
RETURNS TABLE(slot_time text, available boolean)
LANGUAGE plpgsql
AS $$
DECLARE
  v_timezone text;
  v_day_of_week integer;
  v_exception_closed boolean;
  v_exception_start time;
  v_exception_end time;
  v_business_start time;
  v_business_end time;
  v_slot_local timestamp;
  v_total_duration integer := 30;
  v_available boolean;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_date_val date;
BEGIN
  v_date_val := p_date::date;
  SELECT timezone INTO v_timezone FROM public.businesses WHERE id = p_business_id LIMIT 1;
  IF v_timezone IS NULL THEN v_timezone := 'America/Argentina/Buenos_Aires'; END IF;
  v_day_of_week := extract(isodow FROM v_date_val)::integer;
  SELECT is_closed, start_time, end_time INTO
    v_exception_closed, v_exception_start, v_exception_end
  FROM public.business_exceptions
  WHERE business_id = p_business_id AND date = v_date_val ORDER BY created_at DESC LIMIT 1;
  IF v_exception_closed = true THEN RETURN; END IF;
  IF v_exception_start IS NOT NULL AND v_exception_end IS NOT NULL THEN
    v_business_start := v_exception_start;
    v_business_end := v_exception_end;
  ELSE
    SELECT start_time, end_time INTO v_business_start, v_business_end
    FROM public.business_hours WHERE business_id = p_business_id AND day_of_week = v_day_of_week AND is_active = true LIMIT 1;
  END IF;
  IF v_business_start IS NULL OR v_business_end IS NULL THEN RETURN; END IF;
  v_slot_local := v_date_val::timestamp + v_business_start;
  WHILE v_slot_local + (v_total_duration * interval '1 minute') <= v_date_val::timestamp + v_business_end LOOP
    v_slot_start := v_slot_local AT TIME ZONE v_timezone;
    v_slot_end := (v_slot_local + (v_total_duration * interval '1 minute')) AT TIME ZONE v_timezone;
    SELECT NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.business_id = p_business_id AND a.status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
        AND v_slot_start < a.end_at AND v_slot_end > a.start_at
    ) INTO v_available;
    slot_time := to_char(v_slot_local, 'HH24:MI');
    available := v_available;
    RETURN NEXT;
    v_slot_local := v_slot_local + interval '15 minutes';
  END LOOP;
END;
$$;

-- get_available_slots_for_date (OVERLOAD 2 - returns jsonb array)
CREATE OR REPLACE FUNCTION public.get_available_slots_for_date(p_business_id uuid, p_date text, p_service_ids text[] DEFAULT NULL::text[])
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_timezone text;
  v_day_of_week integer;
  v_exception_closed boolean;
  v_exception_start time;
  v_exception_end time;
  v_business_start time;
  v_business_end time;
  v_slot_local timestamp;
  v_total_duration integer;
  v_available boolean;
  v_slots jsonb := '[]'::jsonb;
  v_slot_time text;
  v_date_val date;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
BEGIN
  v_date_val := p_date::date;
  SELECT timezone INTO v_timezone FROM public.businesses WHERE id = p_business_id LIMIT 1;
  IF v_timezone IS NULL THEN RETURN jsonb_build_array(); END IF;
  IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
    SELECT COALESCE(SUM(s.duration_minutes), 0) INTO v_total_duration
    FROM unnest(p_service_ids) AS sid(text)
    JOIN public.services s ON s.id = sid.text::uuid AND s.business_id = p_business_id AND s.is_active = true;
    IF v_total_duration IS NULL OR v_total_duration <= 0 THEN
      SELECT COALESCE(MAX(duration_minutes), 60) INTO v_total_duration
      FROM public.services WHERE business_id = p_business_id AND is_active = true;
    END IF;
  ELSE
    SELECT COALESCE(MAX(duration_minutes), 60) INTO v_total_duration
    FROM public.services WHERE business_id = p_business_id AND is_active = true;
  END IF;
  v_day_of_week := extract(isodow FROM v_date_val)::integer;
  SELECT is_closed, start_time, end_time INTO
    v_exception_closed, v_exception_start, v_exception_end
  FROM public.business_exceptions
  WHERE business_id = p_business_id AND date = v_date_val ORDER BY created_at DESC LIMIT 1;
  IF v_exception_closed = true THEN RETURN jsonb_build_array(); END IF;
  IF v_exception_start IS NOT NULL AND v_exception_end IS NOT NULL THEN
    v_business_start := v_exception_start;
    v_business_end := v_exception_end;
  ELSE
    SELECT start_time, end_time INTO v_business_start, v_business_end
    FROM public.business_hours WHERE business_id = p_business_id AND day_of_week = v_day_of_week AND is_active = true LIMIT 1;
  END IF;
  IF v_business_start IS NULL OR v_business_end IS NULL THEN RETURN jsonb_build_array(); END IF;
  v_slot_local := v_date_val::timestamp + v_business_start;
  WHILE v_slot_local + (v_total_duration * interval '1 minute') <= v_date_val::timestamp + v_business_end LOOP
    v_slot_start := v_slot_local AT TIME ZONE v_timezone;
    v_slot_end := (v_slot_local + (v_total_duration * interval '1 minute')) AT TIME ZONE v_timezone;
    SELECT NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.business_id = p_business_id AND a.status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
        AND v_slot_start < a.end_at AND v_slot_end > a.start_at
    ) INTO v_available;
    v_slot_time := to_char(v_slot_local, 'HH24:MI');
    v_slots := v_slots || jsonb_build_object('time', v_slot_time, 'available', v_available);
    v_slot_local := v_slot_local + interval '15 minutes';
  END LOOP;
  RETURN v_slots;
END;
$$;

-- ============================================================================
-- 3. EVENT TRIGGER rls_auto_enable (si no existe)
-- ============================================================================

-- Crear la función rls_auto_enable si no existe
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

-- Crear el event trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_event_trigger WHERE evtname = 'rls_auto_enable_trigger'
  ) THEN
    CREATE EVENT TRIGGER rls_auto_enable_trigger ON ddl_command_end
    EXECUTE FUNCTION public.rls_auto_enable();
  END IF;
END
$$;
