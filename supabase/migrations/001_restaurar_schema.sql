-- Restaurar schema EXACTO del backup NEUDI_DB_BACKUP.sql
-- Limpia todo y recrea desde cero

-- 1. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM (
    'PENDING', 'CONFIRMED', 'REQUIRES_DEPOSIT', 'REJECTED',
    'EXPIRED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.business_role AS ENUM ('OWNER', 'ADMIN', 'STAFF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Drop functions (safe)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.get_available_slots(text, text[], text, uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.get_available_slots_for_date(uuid, text) CASCADE;
  DROP FUNCTION IF EXISTS public.get_available_slots_for_date(uuid, text, text[]) CASCADE;
  DROP FUNCTION IF EXISTS public.create_public_appointment(text, text[], timestamptz, timestamptz, text, text, text, text, uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.reschedule_appointment(uuid, timestamptz, timestamptz) CASCADE;
  DROP FUNCTION IF EXISTS public.complete_past_confirmed_appointments() CASCADE;
  DROP FUNCTION IF EXISTS public.expire_past_pending_appointments() CASCADE;
  DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;
  DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
  DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
  DROP FUNCTION IF EXISTS public.has_business_role(uuid, business_role[]) CASCADE;
  DROP FUNCTION IF EXISTS public.is_business_member(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.create_business_for_current_user(text, text, text, text) CASCADE;
  DROP FUNCTION IF EXISTS public.auto_find_or_create_customer(uuid, text, text, text) CASCADE;
  DROP EVENT TRIGGER IF EXISTS rls_auto_enable;
END $$;

-- 3. Drop triggers (safe)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
  DROP TRIGGER IF EXISTS business_exceptions_updated_at ON public.business_exceptions;
  DROP TRIGGER IF EXISTS business_hours_updated_at ON public.business_hours;
  DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
  DROP TRIGGER IF EXISTS customers_updated_at ON public.customers;
  DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
  DROP TRIGGER IF EXISTS services_updated_at ON public.services;
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 4. Drop policies (safe)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'businesses' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.businesses', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_members' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_members', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'services' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_hours' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_hours', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'business_exceptions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.business_exceptions', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointments' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointment_services' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointment_services', pol.policyname);
  END LOOP;
END $$;

-- 5. Drop tables (cascade)
DROP TABLE IF EXISTS public.appointment_services CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.business_exceptions CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.business_members CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
