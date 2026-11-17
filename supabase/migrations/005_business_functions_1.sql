-- Business functions

CREATE OR REPLACE FUNCTION public.create_business_for_current_user(p_name text, p_slug text, p_timezone text DEFAULT 'America/Argentina/Buenos_Aires'::text, p_currency text DEFAULT 'ARS'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
    v_user_id uuid;
    v_business_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then raise exception 'Not authenticated'; end if;
    if exists (select 1 from public.business_members where user_id = v_user_id) then
        raise exception 'User already belongs to a business';
    end if;
    if trim(p_name) = '' then raise exception 'Business name is required'; end if;
    if trim(p_slug) = '' then raise exception 'Business slug is required'; end if;
    insert into public.businesses (name, slug, timezone, currency)
    values (trim(p_name), lower(trim(p_slug)), p_timezone, p_currency)
    returning id into v_business_id;
    insert into public.business_members (business_id, user_id, role)
    values (v_business_id, v_user_id, 'OWNER');
    return v_business_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_slots(p_business_slug text, p_service_ids text[], p_date text, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id uuid;
  v_timezone text;
  v_total_duration integer;
  v_slots jsonb := '[]'::jsonb;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_available boolean;
  v_schedule_start time;
  v_schedule_end time;
  v_schedule_slot timestamp;
  v_schedule_end_ts timestamp;
  v_exception_closed boolean;
  v_exception_start time;
  v_exception_end time;
  v_day_of_week integer;
  v_has_exception boolean;
BEGIN
  SELECT id, timezone INTO v_business_id, v_timezone
  FROM public.businesses WHERE slug = trim(p_business_slug) LIMIT 1;
  IF v_business_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'BUSINESS_NOT_FOUND', 'message', 'Negocio no encontrado');
  END IF;
  SELECT COALESCE(SUM(s.duration_minutes), 0) INTO v_total_duration
  FROM (SELECT unnest(p_service_ids)::uuid) AS sid(uuid)
  JOIN public.services s ON s.id = sid.uuid
    AND s.business_id = v_business_id AND s.is_active = true;
  IF v_total_duration IS NULL OR v_total_duration <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'SERVICE_NOT_FOUND', 'message', 'Servicio no encontrado');
  END IF;
  SELECT is_closed, start_time, end_time INTO
    v_exception_closed, v_exception_start, v_exception_end
  FROM public.business_exceptions
  WHERE business_id = v_business_id AND date = p_date::date
  ORDER BY created_at DESC LIMIT 1;
  IF v_exception_closed = true THEN
    RETURN jsonb_build_object('success', true, 'date', p_date, 'slots', '[]'::jsonb);
  END IF;
  v_day_of_week := extract(isodow FROM p_date::date)::integer;
  IF v_exception_start IS NOT NULL AND v_exception_end IS NOT NULL THEN
    v_schedule_start := v_exception_start;
    v_schedule_end := v_exception_end;
    v_has_exception := true;
  ELSE
    v_has_exception := false;
  END IF;
  FOR v_schedule_start, v_schedule_end IN
    SELECT start_time, end_time
    FROM public.business_hours
    WHERE business_id = v_business_id AND day_of_week = v_day_of_week AND is_active = true
    ORDER BY start_time
  LOOP
    IF v_has_exception AND v_schedule_start <> v_exception_start THEN
      CONTINUE;
    END IF;
    v_schedule_end_ts := (p_date || ' ' || v_schedule_end::text)::timestamp;
    v_schedule_slot := (p_date || ' ' || v_schedule_start::text)::timestamp;
    WHILE v_schedule_slot + (v_total_duration || ' minutes')::interval <= v_schedule_end_ts LOOP
      v_slot_start := v_schedule_slot AT TIME ZONE v_timezone;
      v_slot_end := v_slot_start + (v_total_duration || ' minutes')::interval;
      IF extract(minute FROM v_schedule_slot)::integer % 15 = 0 AND extract(second FROM v_schedule_slot) = 0 THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.appointments a
          WHERE a.business_id = v_business_id AND a.status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
            AND a.id <> COALESCE(p_exclude_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid)
            AND v_slot_start < a.end_at AND v_slot_end > a.start_at
        ) THEN
          v_available := true;
        ELSE
          v_available := false;
        END IF;
        v_slots := v_slots || jsonb_build_object('time', to_char(v_schedule_slot, 'HH24:MI'), 'available', v_available);
      END IF;
      v_schedule_slot := v_schedule_slot + '15 minutes'::interval;
    END LOOP;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'date', p_date, 'slots', v_slots);
END;
$$;
