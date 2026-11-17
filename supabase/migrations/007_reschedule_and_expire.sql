-- 005_part7 - reschedule_appointment, complete/expire functions

CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_appointment_id uuid, p_new_start_at timestamptz, p_new_end_at timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_appointment RECORD;
    v_business_id uuid;
    v_timezone text;
    v_total_duration integer;
    v_local_start timestamp;
    v_local_end timestamp;
    v_local_date date;
    v_day_of_week integer;
    v_exception_closed boolean;
    v_exception_start time;
    v_exception_end time;
    v_has_business_hours boolean;
    v_lock_key bigint;
BEGIN
    IF p_appointment_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_APPOINTMENT_ID', DETAIL = 'ID de turno invalido';
    END IF;
    IF p_new_start_at IS NULL OR p_new_end_at IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TIME_RANGE', DETAIL = 'Fecha y hora nuevas son obligatorias';
    END IF;
    SELECT a.*, b.id AS business_id, b.timezone AS timezone, COALESCE(SUM(aps.duration_minutes), 0) AS total_duration
    INTO v_appointment
    FROM public.appointments a
    JOIN public.businesses b ON b.id = a.business_id
    LEFT JOIN public.appointment_services aps ON aps.appointment_id = a.id
    WHERE a.id = p_appointment_id GROUP BY a.id, b.id, b.timezone;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'APPOINTMENT_NOT_FOUND', DETAIL = 'El turno no fue encontrado';
    END IF;
    v_business_id := v_appointment.business_id;
    v_timezone := v_appointment.timezone;
    v_total_duration := v_appointment.total_duration;
    IF v_appointment.status NOT IN ('PENDING', 'CONFIRMED') THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STATUS_NOT_RESCHEDULABLE', DETAIL = 'Este turno ya no puede ser reagendado';
    END IF;
    IF p_new_end_at <= p_new_start_at THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TIME_RANGE', DETAIL = 'Rango horario invalido';
    END IF;
    IF extract(epoch FROM (p_new_end_at - p_new_start_at))::integer <> v_total_duration * 60 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_DURATION', DETAIL = 'La duracion no coincide con los servicios del turno';
    END IF;
    v_local_start := p_new_start_at AT TIME ZONE v_timezone;
    v_local_end := p_new_end_at AT TIME ZONE v_timezone;
    v_local_date := v_local_start::date;
    IF v_local_end::date <> v_local_start::date THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TIME_RANGE', DETAIL = 'El turno no puede atravesar la medianoche';
    END IF;
    v_day_of_week := extract(isodow FROM v_local_start)::integer;
    SELECT is_closed, start_time, end_time INTO
        v_exception_closed, v_exception_start, v_exception_end
    FROM public.business_exceptions
    WHERE business_id = v_business_id AND date = v_local_date ORDER BY created_at DESC LIMIT 1;
    IF v_exception_closed = true THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'BUSINESS_CLOSED', DETAIL = 'El negocio esta cerrado en esta fecha';
    END IF;
    IF v_exception_start IS NOT NULL AND v_exception_end IS NOT NULL THEN
        IF v_local_start::time < v_exception_start OR v_local_end::time > v_exception_end THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'OUTSIDE_HOURS', DETAIL = 'El horario seleccionado esta fuera del horario comercial';
        END IF;
    ELSE
        SELECT EXISTS (
            SELECT 1 FROM public.business_hours bh
            WHERE bh.business_id = v_business_id AND bh.day_of_week = v_day_of_week AND bh.is_active = true
              AND v_local_start::time >= bh.start_time AND v_local_end::time <= bh.end_time
        ) INTO v_has_business_hours;
        IF NOT v_has_business_hours THEN
            RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'OUTSIDE_HOURS', DETAIL = 'El horario seleccionado esta fuera del horario comercial';
        END IF;
    END IF;
    IF extract(minute FROM v_local_start)::integer % 15 <> 0 OR extract(second FROM v_local_start)::integer <> 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_SLOT', DETAIL = 'Los turnos comienzan cada 15 minutos';
    END IF;
    v_lock_key := hashtextextended(v_business_id::text || ':' || v_local_date::text, 0);
    PERFORM pg_advisory_xact_lock(v_lock_key);
    IF EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.business_id = v_business_id AND a.status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
          AND a.id <> p_appointment_id AND p_new_start_at < a.end_at AND p_new_end_at > a.start_at
    ) THEN
        RAISE EXCEPTION USING ERRCODE = '23P01', MESSAGE = 'SLOT_UNAVAILABLE', DETAIL = 'Este horario ya esta reservado';
    END IF;
    UPDATE public.appointments SET start_at = p_new_start_at, end_at = p_new_end_at, updated_at = now() WHERE id = p_appointment_id;
    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id::text, 'status', v_appointment.status, 'start_at', p_new_start_at, 'end_at', p_new_end_at, 'total_duration', v_total_duration, 'message', 'Turno reagendado exitosamente');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_past_confirmed_appointments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer := 0;
    v_now_at_ba timestamptz;
BEGIN
    v_now_at_ba := now() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    UPDATE public.appointments SET status = 'COMPLETED', updated_at = now()
    WHERE status = 'CONFIRMED' AND end_at AT TIME ZONE 'America/Argentina/Buenos_Aires' < v_now_at_ba;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'completed_count', v_count, 'executed_at', now(), 'business_time', v_now_at_ba);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_past_pending_appointments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer := 0;
    v_now_at_ba timestamptz;
BEGIN
    v_now_at_ba := now() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    UPDATE public.appointments SET status = 'EXPIRED', updated_at = now()
    WHERE status = 'PENDING' AND start_at AT TIME ZONE 'America/Argentina/Buenos_Aires' < v_now_at_ba;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'expired_count', v_count, 'executed_at', now(), 'business_time', v_now_at_ba);
END;
$$;
