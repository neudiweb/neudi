-- 014_agregar_columnas_faltantes.sql
-- Agregar columnas que el frontend necesita pero que faltan en el schema

-- 1. services.is_deleted → para soft-delete de servicios
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- 2. appointment_services.service_name → el frontend hace join para mostrar nombre del servicio
ALTER TABLE public.appointment_services ADD COLUMN IF NOT EXISTS service_name text;

-- 3. appointments.assigned_employee_id → referenced in frontend query
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assigned_employee_id uuid;

-- 4. business_hours.max_appointments → el frontend tiene selector de capacidad
ALTER TABLE public.business_hours ADD COLUMN IF NOT EXISTS max_appointments integer NOT NULL DEFAULT 1;
