-- create_public_appointment

CREATE OR REPLACE FUNCTION public.create_public_appointment(p_business_slug text, p_service_ids text[], p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_customer_name text, p_customer_phone text, p_customer_email text DEFAULT NULL::text, p_notes text DEFAULT NULL::text, p_exclude_appointment_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id uuid;
  v_timezone text;
  v_total_duration integer;
  v_total_price numeric(10,2);
  v_appointment_id uuid;
  v_customer_id uuid;
  v_exception_closed boolean;
  v_exception_start time;
  v_exception_end time;
  v_day_of_week integer;
  v_local_start timestamp;
  v_local_end timestamp;
  v_local_date date;
  v_lock_key bigint;
  v_fits_hours boolean;
BEGIN
  SELECT id, timezone INTO v_business_id, v_timezone
  FROM public.businesses WHERE slug = trim(p_business_slug) AND is_active = true LIMIT 1;
  IF v_business_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'BUSINESS_NOT_FOUND', 'message', 'Negocio no encontrado');
  END IF;
  v_local_start := p_start_at AT TIME ZONE v_timezone;
  v_local_date := v_local_start::date;
  v_lock_key := hashtextextended(v_business_id::text || ':' || v_local_date::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CUSTOMER_NAME', 'message', 'El nombre es obligatorio');
  END IF;
  IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_CUSTOMER_PHONE', 'message', 'El telefono es obligatorio');
  END IF;
  SELECT COALESCE(SUM(s.duration_minutes), 0), COALESCE(SUM(s.price), 0)
  INTO v_total_duration, v_total_price
  FROM unnest(p_service_ids) AS sid(uuid)
  JOIN public.services s ON s.id = sid.uuid::uuid AND s.business_id = v_business_id AND s.is_active = true;
  IF v_total_duration IS NULL OR v_total_duration <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'SERVICE_NOT_FOUND', 'message', 'Servicio no encontrado');
  END IF;
  IF (SELECT COUNT(*) FROM unnest(p_service_ids)) !=
     (SELECT COUNT(*) FROM unnest(p_service_ids) AS sid(uuid)
      JOIN public.services s ON s.id = sid.uuid::uuid AND s.business_id = v_business_id AND s.is_active = true)
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'SERVICE_NOT_FOUND', 'message', 'Uno o mas servicios no encontrados o inactivos');
  END IF;
  IF p_end_at <= p_start_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TIME_RANGE', 'message', 'Rango horario invalido');
  END IF;
  v_local_start := p_start_at AT TIME ZONE v_timezone;
  v_local_end := p_end_at AT TIME ZONE v_timezone;
  v_local_date := v_local_start::date;
  IF v_local_end::date <> v_local_start::date THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TIME_RANGE', 'message', 'El turno no puede atravesar la medianoche');
  END IF;
  SELECT is_closed, start_time, end_time INTO
    v_exception_closed, v_exception_start, v_exception_end
  FROM public.business_exceptions
  WHERE business_id = v_business_id AND date = v_local_date ORDER BY created_at DESC LIMIT 1;
  IF v_exception_closed = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'BUSINESS_CLOSED', 'message', 'El negocio esta cerrado en esta fecha');
  END IF;
  v_day_of_week := extract(isodow FROM v_local_start)::integer;
  IF v_exception_start IS NOT NULL AND v_exception_end IS NOT NULL THEN
    IF v_local_start::time < v_exception_start OR v_local_end::time > v_exception_end THEN
      RETURN jsonb_build_object('success', false, 'error', 'OUTSIDE_HOURS', 'message', 'El horario seleccionado esta fuera del horario comercial');
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.business_hours bh
      WHERE bh.business_id = v_business_id AND bh.day_of_week = v_day_of_week AND bh.is_active = true
        AND v_local_start::time >= bh.start_time AND v_local_end::time <= bh.end_time
    ) INTO v_fits_hours;
    IF NOT v_fits_hours THEN
      RETURN jsonb_build_object('success', false, 'error', 'OUTSIDE_HOURS', 'message', 'El horario seleccionado esta fuera del horario comercial');
    END IF;
  END IF;
  IF extract(minute FROM v_local_start)::integer % 15 <> 0 OR extract(second FROM v_local_start) <> 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_SLOT', 'message', 'Los turnos comienzan cada 15 minutos');
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.business_id = v_business_id AND a.status NOT IN ('CANCELLED', 'EXPIRED', 'REJECTED')
      AND a.id <> COALESCE(p_exclude_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND p_start_at < a.end_at AND p_end_at > a.start_at
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_UNAVAILABLE', 'message', 'Este horario ya esta reservado');
  END IF;
  v_customer_id := public.auto_find_or_create_customer(v_business_id, p_customer_name, p_customer_phone, p_customer_email);
  INSERT INTO public.appointments (business_id, service_id, customer_id, customer_name, customer_phone, customer_email, notes, start_at, end_at, status)
  VALUES (v_business_id, (SELECT sid::uuid FROM unnest(p_service_ids) AS sid(uuid) LIMIT 1), v_customer_id, trim(p_customer_name), trim(p_customer_phone), COALESCE(trim(p_customer_email), ''), COALESCE(trim(p_notes), ''), p_start_at, p_end_at, 'PENDING')
  RETURNING id INTO v_appointment_id;
  INSERT INTO public.appointment_services (appointment_id, service_id, price, duration_minutes)
  SELECT v_appointment_id, sid.uuid::uuid, s.price, s.duration_minutes
  FROM unnest(p_service_ids) AS sid(uuid)
  JOIN public.services s ON s.id = sid.uuid::uuid;
  RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id::text, 'total_duration', v_total_duration, 'total_price', v_total_price, 'message', 'Reserva creada exitosamente');
END;
$$;
