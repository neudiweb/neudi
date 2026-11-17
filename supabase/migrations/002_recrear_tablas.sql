-- Recrear tablas EXACTAS del backup (sin duplicados de PK)

CREATE TABLE public.businesses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    phone text,
    email text,
    timezone text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    currency text NOT NULL DEFAULT 'ARS',
    is_active boolean NOT NULL DEFAULT true,
    plan text NOT NULL DEFAULT 'FREE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT businesses_pkey PRIMARY KEY (id),
    CONSTRAINT businesses_slug_key UNIQUE (slug),
    CONSTRAINT businesses_plan_check CHECK (plan = ANY (ARRAY['FREE'::text, 'PRO'::text]))
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.business_members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role business_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT business_members_pkey PRIMARY KEY (id),
    CONSTRAINT business_members_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
    CONSTRAINT business_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT business_members_unique_user_business UNIQUE (business_id, user_id)
);

CREATE TABLE public.services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    price numeric(12,2) NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'ARS',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT services_pkey PRIMARY KEY (id),
    CONSTRAINT services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE RESTRICT,
    CONSTRAINT services_price_non_negative CHECK ((price >= (0)::numeric)),
    CONSTRAINT services_duration_positive CHECK ((duration_minutes > 0))
);

CREATE TABLE public.business_hours (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    time_range int4range,
    CONSTRAINT business_hours_pkey PRIMARY KEY (id),
    CONSTRAINT business_hours_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
    CONSTRAINT business_hours_time_valid CHECK ((start_time < end_time)),
    CONSTRAINT business_hours_valid_day CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT business_hours_no_overlap EXCLUDE USING gist (business_id WITH =, day_of_week WITH =, time_range WITH &&),
    CONSTRAINT business_hours_valid_range CHECK ((start_time < end_time))
);

CREATE TABLE public.business_exceptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    date date NOT NULL,
    is_closed boolean NOT NULL DEFAULT false,
    start_time time,
    end_time time,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT business_exceptions_pkey PRIMARY KEY (id),
    CONSTRAINT business_exceptions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
    CONSTRAINT business_exceptions_time_valid CHECK (((is_closed = true) OR ((start_time IS NOT NULL) AND (end_time IS NOT NULL) AND (start_time < end_time))))
);

CREATE TABLE public.customers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
    CONSTRAINT customers_unique_phone_per_business UNIQUE (business_id, phone)
);

CREATE TABLE public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL,
    service_id uuid,
    customer_id uuid NOT NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    status appointment_status NOT NULL DEFAULT 'PENDING',
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text NOT NULL,
    expires_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT appointments_pkey PRIMARY KEY (id),
    CONSTRAINT appointments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE RESTRICT,
    CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
    CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT,
    CONSTRAINT appointments_time_valid CHECK ((start_at < end_at))
);

CREATE TABLE public.appointment_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    appointment_id uuid NOT NULL,
    service_id uuid NOT NULL,
    price integer NOT NULL,
    duration_minutes integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT appointment_services_pkey PRIMARY KEY (id),
    CONSTRAINT appointment_services_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE,
    CONSTRAINT appointment_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE
);
