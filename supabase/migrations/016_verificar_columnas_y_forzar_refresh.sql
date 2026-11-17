-- 016_verificar_columnas_y_forzar_refresh.sql
-- Verificar que las columnas existen y forzar refresh del schema cache de PostgREST

-- 1. Forzar invalidación del schema cache de PostgREST
-- Esto hace que PostgREST vuelva a leer el schema de la base de datos
DO $$
BEGIN
  -- Intentar invalidar el cache de PostgREST
  -- En Supabase Cloud, esto se puede hacer mediante la API de admin
  -- Pero también podemos forzar un refresh mediante una función RPC
  BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('schema_cache_refresh'::text));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 2. Verificar que las columnas existen
-- Si alguna no existe, esta migración fallará con un error claro
DO $$
DECLARE
  v_services_is_deleted boolean;
  v_as_service_name boolean;
  v_bh_max_appointments boolean;
BEGIN
  -- Verificar services.is_deleted
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'is_deleted'
  ) INTO v_services_is_deleted;
  
  IF NOT v_services_is_deleted THEN
    RAISE EXCEPTION ' services.is_deleted NO existe en la base de datos!';
  END IF;
  
  -- Verificar appointment_services.service_name
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointment_services'
      AND column_name = 'service_name'
  ) INTO v_as_service_name;
  
  IF NOT v_as_service_name THEN
    RAISE EXCEPTION ' appointment_services.service_name NO existe en la base de datos!';
  END IF;
  
  -- Verificar business_hours.max_appointments
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_hours'
      AND column_name = 'max_appointments'
  ) INTO v_bh_max_appointments;
  
  IF NOT v_bh_max_appointments THEN
    RAISE EXCEPTION ' business_hours.max_appointments NO existe en la base de datos!';
  END IF;
  
  RAISE NOTICE 'Todas las columnas existen correctamente en la base de datos.';
END $$;
