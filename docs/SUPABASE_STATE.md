# Neudi — Estado de Supabase

Fuente de verdad: inspección directa mediante MCP (`supabase_execute_sql`) del proyecto `hvafniqbmwwdcrlxymir`.

## Tablas

### 1. businesses

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| name | text | NOT NULL | — |
| slug | text | NOT NULL | — |
| description | text | true | NULL |
| phone | text | true | NULL |
| email | text | true | NULL |
| timezone | text | NOT NULL | 'UTC' |
| currency | text | NOT NULL | 'USD' |
| is_active | boolean | NOT NULL | true |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `businesses_pkey` (id)
- Unique: `businesses_slug_key` (slug)

**Índices:**
- `businesses_pkey` (btree id)
- `businesses_slug_key` (btree slug, unique)

**Triggers:**
- `businesses_updated_at` → `update_updated_at()`

---

### 2. profiles

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | auth.uid() (implícito) |
| full_name | text | true | NULL |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `profiles_pkey` (id) — FK implícito a auth.users(id)

**Índices:**
- `profiles_pkey` (btree id)

**Triggers:**
- `profiles_updated_at` → `update_updated_at()`

---

### 3. business_members

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| user_id | uuid | NOT NULL | — |
| role | business_role | NOT NULL | 'MEMBER'::business_role |
| created_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `business_members_pkey` (id)
- Unique: `business_members_unique_user_business` (business_id, user_id)
- FK implícita a auth.users(id) en user_id

**Índices:**
- `business_members_pkey` (btree id)
- `business_members_unique_user_business` (btree business_id, user_id, unique)
- `idx_business_members_business_id` (btree business_id)
- `idx_business_members_user_id` (btree user_id)

---

### 4. services

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| name | text | NOT NULL | — |
| description | text | true | NULL |
| duration_minutes | integer | NOT NULL | — |
| price | numeric | NOT NULL | — |
| currency | text | true | 'USD'::text |
| is_active | boolean | NOT NULL | true |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `services_pkey` (id)
- FK implícita a businesses(id) en business_id

**Índices:**
- `services_pkey` (btree id)
- `idx_services_business_id` (btree business_id)

**Triggers:**
- `services_updated_at` → `update_updated_at()`

---

### 5. customers

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| name | text | NOT NULL | — |
| phone | text | NOT NULL | — |
| email | text | true | ''::text |
| notes | text | true | NULL |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `customers_pkey` (id)
- Unique: `customers_unique_phone_per_business` (business_id, phone)
- FK implícita a businesses(id) en business_id

**Índices:**
- `customers_pkey` (btree id)
- `idx_customers_business_id` (btree business_id)
- `customers_unique_phone_per_business` (btree business_id, phone, unique)

**Triggers:**
- `customers_updated_at` → `update_updated_at()`

---

### 6. appointments

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| service_id | uuid | NOT NULL | — |
| customer_id | uuid | NOT NULL | — |
| customer_name | text | NOT NULL | — |
| customer_phone | text | NOT NULL | — |
| customer_email | text | true | ''::text |
| notes | text | true | NULL |
| start_at | timestamptz | NOT NULL | — |
| end_at | timestamptz | NOT NULL | — |
| status | appointment_status | NOT NULL | 'PENDING'::appointment_status |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `appointments_pkey` (id)
- FK implícita a businesses(id) en business_id
- FK implícita a services(id) en service_id
- FK implícita a customers(id) en customer_id

**Índices:**
- `appointments_pkey` (btree id)
- `idx_appointments_business_id` (btree business_id)
- `idx_appointments_customer_id` (btree customer_id)
- `idx_appointments_start_at` (btree business_id, start_at) — compuesto para consultas de agenda
- `idx_appointments_status` (btree business_id, status) — compuesto para filtrado por estado

**Triggers:**
- `appointments_updated_at` → `update_updated_at()`

---

### 7. business_hours

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| day_of_week | integer | NOT NULL | — |
| start_time | time without time zone | NOT NULL | — |
| end_time | time without time zone | NOT NULL | — |
| is_active | boolean | NOT NULL | true |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `business_hours_pkey` (id)
- FK implícita a businesses(id) en business_id

**Índices:**
- `business_hours_pkey` (btree id)
- `idx_business_hours_business_id` (btree business_id)

**Triggers:**
- `business_hours_updated_at` → `update_updated_at()`

---

### 8. business_exceptions

| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| business_id | uuid | NOT NULL | — |
| date | date | NOT NULL | — |
| is_closed | boolean | NOT NULL | false |
| start_time | time without time zone | true | NULL |
| end_time | time without time zone | true | NULL |
| reason | text | true | NULL |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

**Constraints:**
- PK: `business_exceptions_pkey` (id)
- FK implícita a businesses(id) en business_id

**Índices:**
- `business_exceptions_pkey` (btree id)
- `idx_business_exceptions_business_date` (btree business_id, date)

**Triggers:**
- `business_exceptions_updated_at` → `update_updated_at()`

---

## Enums

### appointment_status

| Valor | Descripción |
|-------|-------------|
| PENDING | Reserva pendiente de confirmación |
| CONFIRMED | Reserva confirmada |
| COMPLETED | Servicio completado |
| CANCELLED | Cancelada por cliente o negocio |
| EXPIRED | Expiró sin ser confirmada/completada |
| REJECTED | Rechazada por el negocio |

### business_role

| Valor | Descripción |
|-------|-------------|
| OWNER | Dueño del negocio — permisos totales |
| ADMIN | Administrador — puede gestionar servicios, horarios, excepciones |
| MEMBER | Miembro estándar — acceso básico al dashboard |

---

## Funciones RPC (PostgreSQL)

### 1. create_public_appointment

```sql
create_public_appointment(
    p_business_slug text,
    p_service_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_email text DEFAULT NULL,
    p_start_at timestamptz,
    p_end_at timestamptz,
    p_notes text DEFAULT NULL
) RETURNS jsonb SECURITY DEFINER
```

**Descripción:** Crea una reserva pública validando todo el flujo de negocio.

**Validaciones:**
1. Nombre del cliente no vacío
2. Teléfono del cliente no vacío
3. Negocio encontrado por slug
4. Servicio activo y perteneciente al negocio
5. Rango horario válido (end > start)
6. Duración coincide con la del servicio
7. Conversión a timezone del negocio
8. Verificación de día de semana
9. Excepciones de fecha (cerrado/horario especial)
10. Horario dentro de horario comercial
11. Grid de 15 minutos (minuto % 15 == 0, segundo == 0)
12. Lock advisory por negocio + instante (previene race conditions)
13. Verificación de solapamiento con citas existentes

**Estados que NO bloquean slots:** CANCELLED, EXPIRED, REJECTED

**Retorno:**
```json
{
    "success": true/false,
    "appointment_id": "uuid",  // solo si success=true
    "status": "PENDING",       // solo si success=true
    "error": "CODIGO_ERROR",   // solo si success=false
    "message": "Descripción"
}
```

**Permisos:** SECURITY DEFINER — ejecuta con privilegios del propietario. Accesible para `anon` y `authenticated`.

---

### 2. get_available_slots

```sql
get_available_slots(
    p_business_slug text,
    p_service_id uuid,
    p_date date
) RETURNS jsonb SECURITY DEFINER
```

**Descripción:** Genera slots disponibles de 15 minutos para un negocio, servicio y fecha dados.

**Lógica:**
1. Encuentra negocio por slug
2. Obtiene duración del servicio activo
3. Verifica excepciones de fecha (cerrado → retorna array vacío)
4. Determina horario comercial (excepción o semanal)
5. Genera slots cada 15 minutos desde start_time hasta end_time
6. Para cada slot, verifica que no solape con citas activas
7. Retorna lista de slots con `time` (HH:MM local) y `available` (boolean)

**Retorno:**
```json
{
    "success": true,
    "date": "2026-08-15",
    "slots": [
        {"time": "09:00", "available": true},
        {"time": "09:15", "available": false},
        ...
    ]
}
```

**Permisos:** SECURITY DEFINER — accesible para `anon` y `authenticated`.

---

### 3. auto_find_or_create_customer

```sql
auto_find_or_create_customer(
    p_business_id uuid,
    p_name text,
    p_phone text,
    p_email text DEFAULT NULL
) RETURNS uuid
```

**Descripción:** Busca un cliente existente por teléfono dentro del negocio. Si no existe, lo crea y retorna su ID.

**Lógica:**
1. Busca en customers WHERE business_id = ? AND phone = ?
2. Si encuentra → retorna id
3. Si no → INSERTA nuevo customer y retorna el nuevo id

**Retorno:** UUID del cliente (existente o recién creado)

**Permisos:** SECURITY DEFINER — accesible para `anon` y `authenticated`.

---

### 4. handle_new_user

```sql
handle_new_user() RETURNS trigger
```

**Descripción:** Trigger que se ejecuta cuando un nuevo usuario se registra en Auth. Crea automáticamente un registro en la tabla `profiles`.

**Permisos:** SECURITY DEFINER — trigger de auth.users

---

### 5. has_business_role

```sql
has_business_role(
    target_business_id uuid,
    allowed_roles business_role[]
) RETURNS boolean SECURITY DEFINER STABLE
```

**Descripción:** Verifica si el usuario actual (auth.uid()) tiene alguno de los roles permitidos en el negocio dado.

**Lógica:**
```sql
SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
      AND role = ANY(allowed_roles)
);
```

**Permisos:** SECURITY DEFINER — accesible para todos. Usada en RLS policies.

---

### 6. is_business_member

```sql
is_business_member(
    target_business_id uuid
) RETURNS boolean SECURITY DEFINER STABLE
```

**Descripción:** Verifica si el usuario actual es miembro del negocio dado.

**Lógica:**
```sql
SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = target_business_id
      AND user_id = auth.uid()
);
```

**Permisos:** SECURITY DEFINER — accesible para todos. Usada en RLS policies.

---

### 7. update_updated_at

```sql
update_updated_at() RETURNS trigger
```

**Descripción:** Trigger genérico que actualiza la columna `updated_at` con `now()` antes de cada UPDATE.

**Permisos:** Invoker — no usa SECURITY DEFINER.

---

## Políticas RLS (Row-Level Security)

### businesses

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| public_read_businesses | SELECT | anon, authenticated | true |
| Members can view their businesses | SELECT | authenticated | is_business_member(business_id) |
| Owners can update their businesses | UPDATE | authenticated | USING: has_business_role(id, ['OWNER'])<br>WITH CHECK: has_business_role(id, ['OWNER']) |

### profiles

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| Users can view own profile | SELECT | authenticated | id = auth.uid() |
| Users can update own profile | UPDATE | authenticated | USING: id = auth.uid()<br>WITH CHECK: id = auth.uid() |

### business_members

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| Members can view business members | SELECT | authenticated | is_business_member(business_id) |
| Owners and admins can add members | INSERT | authenticated | WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners can remove members | DELETE | authenticated | USING: has_business_role(business_id, ['OWNER']) |
| Owners can update members | UPDATE | authenticated | USING: has_business_role(business_id, ['OWNER'])<br>WITH CHECK: has_business_role(business_id, ['OWNER']) |

### services

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| public_read_services | SELECT | anon, authenticated | is_active = true |
| Members can view services | SELECT | authenticated | is_business_member(business_id) |
| Owners and admins can create services | INSERT | authenticated | WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can update services | UPDATE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN'])<br>WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can delete services | DELETE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN']) |

### customers

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| Members can view customers | SELECT | authenticated | is_business_member(business_id) |
| Members can create customers | INSERT | authenticated | WITH CHECK: is_business_member(business_id) |
| Members can update customers | UPDATE | authenticated | USING: is_business_member(business_id)<br>WITH CHECK: is_business_member(business_id) |

### appointments

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| Members can view appointments | SELECT | authenticated | is_business_member(business_id) |
| Members can create appointments | INSERT | authenticated | WITH CHECK: is_business_member(business_id) |
| Members can update appointments | UPDATE | authenticated | USING: is_business_member(business_id)<br>WITH CHECK: is_business_member(business_id) |

### business_hours

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| public_read_business_hours | SELECT | anon, authenticated | is_active = true |
| Members can view business hours | SELECT | authenticated | is_business_member(business_id) |
| Owners and admins can create business hours | INSERT | authenticated | WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can update business hours | UPDATE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN'])<br>WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can delete business hours | DELETE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN']) |

### business_exceptions

| Policy | Cmd | Roles | Using / With Check |
|--------|-----|-------|-------------------|
| public_read_business_exceptions | SELECT | anon, authenticated | true |
| Members can view business exceptions | SELECT | authenticated | is_business_member(business_id) |
| Owners and admins can create exceptions | INSERT | authenticated | WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can update exceptions | UPDATE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN'])<br>WITH CHECK: has_business_role(business_id, ['OWNER', 'ADMIN']) |
| Owners and admins can delete exceptions | DELETE | authenticated | USING: has_business_role(business_id, ['OWNER', 'ADMIN']) |

---

## Edge Functions

**Sin Edge Functions configuradas.** Toda la lógica de negocio está implementada como funciones SQL RPC.

---

## Triggers Relevantes

| Tabla | Trigger | Función |
|-------|---------|---------|
| profiles | profiles_updated_at | update_updated_at() |
| businesses | businesses_updated_at | update_updated_at() |
| services | services_updated_at | update_updated_at() |
| business_hours | business_hours_updated_at | update_updated_at() |
| business_exceptions | business_exceptions_updated_at | update_updated_at() |
| customers | customers_updated_at | update_updated_at() |
| appointments | appointments_updated_at | update_updated_at() |
| auth.users (on_auth_user_created) | on_auth_user_created | handle_new_user() → crea perfil en tabla profiles |

---

## Datos Actuales (en producción)

### businesses
- 1 registro: "Peluquería Juan" (slug: peluqueria-juan, timezone: America/Argentina/Buenos_Aires, currency: ARS)

### profiles
- 2 registros: owner@neudi.test, test2@neudi.test

### business_members
- 1 registro: user_id=owner@neudi.test → role=OWNER en peluqueria-juan

### services, customers, appointments, business_hours, business_exceptions
- Sin datos (tablas vacías)

---

## Observaciones de Seguridad

1. **RLS bien diseñado:** Las políticas RLS usan funciones helper (`is_business_member`, `has_business_role`) que son seguras y eficientes.
2. **RPCs con SECURITY DEFINER:** `create_public_appointment`, `get_available_slots` y `auto_find_or_create_customer` ejecutan con privilegios del propietario, lo cual es necesario para que los clientes públicos puedan crear reservas sin ser miembros del negocio.
3. **Lock advisory:** `create_public_appointment` usa locks de transacción para prevenir race conditions en la reserva de slots simultáneos.
4. **Validaciones en DB:** Todas las validaciones críticas (duración, solapamiento, horario comercial) están en el backend SQL, no solo en el frontend.
