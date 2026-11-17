-- Helper functions

CREATE OR REPLACE FUNCTION public.auto_find_or_create_customer(p_business_id uuid, p_name text, p_phone text, p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_customer_id uuid;
BEGIN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE business_id = p_business_id AND phone = p_phone LIMIT 1;
    IF v_customer_id IS NOT NULL THEN
        RETURN v_customer_id;
    END IF;
    INSERT INTO public.customers (business_id, name, phone, email)
    VALUES (p_business_id, trim(p_name), trim(p_phone), COALESCE(trim(p_email), ''))
    RETURNING id INTO v_customer_id;
    RETURN v_customer_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Usuario'));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_business_role(target_business_id uuid, allowed_roles business_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
      AND role = ANY(allowed_roles)
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_business_member(target_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
