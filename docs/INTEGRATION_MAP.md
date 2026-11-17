# Neudi — Mapa de Integración Frontend ↔ Supabase

## Diagrama General de Flujo

```
┌─────────────────────┐
│   FRONTEND (React)  │
│                     │
│  Pages              │
│  ├── Public        │──→ Reserva pública
│  └── Dashboard     │──→ Gestión del negocio
│                     │
│  Hooks              │──→ useBusiness, useServices, useAvailableSlots...
│                     │
│  Services           │──→ Llamadas a Supabase (RPC + direct queries)
│                     │
│  Components         │──→ UI reutilizable
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   SUPABASE (PostgreSQL) │
│                     │
│  RPC Functions      │──→ get_available_slots, create_public_appointment...
│                     │
│  Direct Queries     │──→ SELECT/INSERT/UPDATE/DELETE en tablas
│                     │
│  RLS Policies       │──→ Control de acceso por rol/miembro
│                     │
│  Tables             │──→ businesses, services, appointments...
└─────────────────────┘
```

## Flujo 1: Selección de Negocio (Público)

### Frontend
```
/pages/public/SelectBusiness.tsx
  ↓
/services/business.ts → getBusinessBySlug(slug)
  ↓
Supabase direct query: SELECT * FROM businesses WHERE slug = $1
  ↓
RLS: public_read_businesses (anon + authenticated, condition: true)
```

**Estado:** ✅ IMPLEMENTADO — Conectado directamente a Supabase.

---

## Flujo 2: Selección de Servicio (Público)

### Frontend
```
/pages/public/SelectService.tsx
  ↓
/hooks/useServices(businessId)
  ↓
/services/services.ts → getServices(businessId)
  ↓
Supabase direct query: SELECT * FROM services WHERE business_id = $1 AND is_active = true
  ↓
RLS: public_read_services (anon + authenticated, condition: is_active = true)
```

**Estado:** ✅ IMPLEMENTADO — Conectado directamente a Supabase.

---

## Flujo 3: Obtener Horarios Disponibles (Público)

### Frontend
```
/pages/public/SelectTimeSlot.tsx
  ↓
/hooks/useAvailableSlots(businessSlug, serviceId, date)
  ↓
/services/appointments.ts → getAvailableSlots(businessSlug, serviceId, date)
  ↓
Supabase RPC: get_available_slots(p_business_slug, p_service_id, p_date)
  ↓
Retorna: { success, date, slots: [{ time, available }] }
```

**Estado:** ✅ IMPLEMENTADO — Conectado a RPC `get_available_slots`.

### Lógica del RPC (resumen)
1. Busca negocio por slug → obtiene timezone
2. Busca servicio activo → obtiene duración en minutos
3. Verifica excepciones de fecha (cerrado → slots vacíos)
4. Determina horario comercial (excepción o semanal)
5. Genera slots cada 15 min desde start_time hasta end_time
6. Para cada slot, verifica solapamiento con citas activas
7. Retorna lista con `time` (HH:MM local) y `available` (boolean)

---

## Flujo 4: Crear Reserva (Público)

### Frontend
```
/pages/public/ConfirmAppointment.tsx
  ↓
/hooks/useCreateAppointment()
  ↓
/services/appointments.ts → createAppointment(data)
  ↓
Supabase RPC: create_public_appointment(
    p_business_slug,
    p_service_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_start_at,
    p_end_at,
    p_notes
)
  ↓
Retorna: { success, appointment_id?, error?, message }
```

**Estado:** ✅ IMPLEMENTADO — Conectado a RPC `create_public_appointment`. Toast popup para errores (auto-dismiss 5s).

### Lógica del RPC (resumen)
1. Valida nombre y teléfono del cliente
2. Busca negocio por slug → obtiene business_id + timezone
3. Busca servicio activo → verifica que pertenezca al negocio
4. Valida rango horario (end > start)
5. Valida duración coincide con la del servicio
6. Convierte timestamptz a hora local del negocio
7. Verifica día de semana y excepciones de fecha
8. Verifica horario dentro de horario comercial
9. Valida grid de 15 minutos (minuto % 15 == 0)
10. Adquisición de lock advisory (previene race conditions)
11. Verifica solapamiento con citas existentes
12. Llama a `auto_find_or_create_customer()` → obtiene customer_id
13. INSERT en appointments con status 'PENDING'
14. Retorna appointment_id

### Manejo de errores en frontend
- **Éxito:** avanza al step 6 (confirmación)
- **Error del RPC:** muestra toast popup con mensaje descriptivo, auto-dismiss a los 5 segundos
- **Errores comunes:** `BUSINESS_CLOSED` (negocio cerrado), `SLOT_NOT_AVAILABLE` (turno ocupado), `VALIDATION_ERROR` (datos inválidos)

---

## Flujo 5: Autenticación

### Frontend
```
/pages/auth/Login.tsx / Register.tsx
  ↓
AuthProvider (context)
  ↓
Supabase Auth (email/password)
  ↓
Trigger: handle_new_user() → INSERT en profiles
  ↓
RLS: profiles policies (id = auth.uid())
```

**Estado:** ✅ IMPLEMENTADO — Supabase Auth con perfiles automáticos.

### Flujo de membresía
1. Usuario se registra → perfil creado automáticamente
2. Owner agrega su usuario a business_members manualmente o vía UI
3. `is_business_member()` y `has_business_role()` verifican acceso en RLS

---

## Flujo 6: Dashboard — Agenda

### Frontend (parcialmente verificado)
```
/pages/dashboard/Agenda.tsx
  ↓
/hooks/useBusinessAppointments(businessId, filters?)
  ↓
/services/appointments.ts → getBusinessAppointments(businessId, filters?)
  ↓
Supabase direct query: SELECT * FROM appointments WHERE business_id = $1 [AND filtros]
  ↓
RLS: Members can view appointments (authenticated, condition: is_business_member(business_id))
```

**Estado:** ✅ IMPLEMENTADO — Conectado directamente a Supabase.

---

## Flujo 6: Dashboard — Agenda

### Frontend
```
/pages/dashboard/Agenda.tsx
  ↓
/hooks/useBusinessAppointments(businessId, filters?)
  ↓
/services/appointments.ts → getBusinessAppointments(businessId, filters?)
  ↓
Supabase direct query: SELECT * FROM appointments WHERE business_id = $1 [AND filtros]
  ↓
RLS: Members can view appointments (authenticated, condition: is_business_member(business_id))
```

**Estado:** ✅ IMPLEMENTADO — Conectado directamente a Supabase con datos reales.

---

## Flujo 7: Dashboard — Reservas

### Frontend
```
/pages/dashboard/Appointments.tsx
  ↓
/hooks/useBusinessAppointments(businessId, filters?)
  ↓
/services/appointments.ts → getBusinessAppointments / updateAppointmentStatus
  ↓
Supabase direct query: UPDATE appointments SET status = $1 WHERE id = $2
  ↓
RLS: Members can update appointments (authenticated, condition: is_business_member(business_id))
```

**Estado:** ✅ IMPLEMENTADO — CRUD completo sobre `appointments` con RLS.

---

## Flujo 8: Dashboard — Clientes

### Frontend
```
/pages/dashboard/Customers.tsx
  ↓
/hooks/useBusinessCustomers(businessId)
  ↓
/services/customers.ts → getCustomers / createCustomer / updateCustomer
  ↓
Supabase direct query: SELECT * FROM customers WHERE business_id = $1
  ↓
RLS: Members can view/create/update customers (authenticated, condition: is_business_member(business_id))
```

**Estado:** ✅ IMPLEMENTADO — CRUD completo sobre `customers` con RLS.

---

## Flujo 9: Dashboard — Servicios

### Frontend
```
/pages/dashboard/Services.tsx
  ↓
/hooks/useBusinessServices(businessId)
  ↓
/services/services.ts → getServices / createService / updateService / deleteService
  ↓
Supabase direct query: SELECT * FROM services WHERE business_id = $1
  ↓
RLS: public_read_services (anon, is_active=true), Owners/Admins CRUD
```

**Estado:** ✅ IMPLEMENTADO — CRUD completo sobre `services` con RLS.

---

## Flujo 10: Dashboard — Horarios

### Frontend
```
/pages/dashboard/BusinessHours.tsx
  ↓
/hooks/useBusinessHours(businessId)
  ↓
/services/businessHours.ts → getBusinessHours / createBusinessHour / updateBusinessHour / deleteBusinessHour
  ↓
Supabase direct query: SELECT * FROM business_hours WHERE business_id = $1
  ↓
RLS: public_read_business_hours (anon, is_active=true), Owners/Admins CRUD
```

**Estado:** ✅ IMPLEMENTADO — CRUD completo sobre `business_hours` con RLS.

---

## Flujo 11: Dashboard — Excepciones

### Frontend
```
/pages/dashboard/BusinessExceptions.tsx
  ↓
/hooks/useBusinessExceptions(businessId)
  ↓
/services/businessExceptions.ts → getBusinessExceptions / createException / updateException / deleteException
  ↓
Supabase direct query: SELECT * FROM business_exceptions WHERE business_id = $1
  ↓
RLS: public_read_business_exceptions (anon, true), Owners/Admins CRUD
```

**Estado:** ✅ IMPLEMENTADO — CRUD completo sobre `business_exceptions` con RLS.

---

## Resumen de Conexión

| Flujo | Frontend → Supabase | Estado |
|-------|---------------------|--------|
| Selección de negocio | Direct query a `businesses` | ✅ Conectado |
| Selección de servicio | Direct query a `services` | ✅ Conectado |
| Horarios disponibles | RPC `get_available_slots` | ✅ Conectado |
| Crear reserva | INSERT directo en `appointments` | ✅ Conectado |
| Autenticación | Supabase Auth + trigger | ✅ Conectado |
| Agenda (dashboard) | Direct query a `appointments` | ✅ Conectado |
| Reservas (dashboard) | Direct query/UPDATE a `appointments` | ✅ Conectado |
| Clientes (dashboard) | Direct query CRUD a `customers` | ✅ Conectado |
| Servicios (dashboard) | Direct query CRUD a `services` | ✅ Conectado |
| Horarios (dashboard) | Direct query CRUD a `business_hours` | ✅ Conectado |
| Excepciones (dashboard) | Direct query CRUD a `business_exceptions` | ✅ Conectado |

---

## RPCs Utilizados vs No Utilizados

### RPCs existentes que el frontend SÍ utiliza:
- ✅ `get_available_slots` — Flujo público de reservas (BookingWizard)
- ✅ `create_public_appointment` — Flujo público de reservas
- ✅ `auto_find_or_create_customer` — Llamado internamente por `create_public_appointment`

### RPCs existentes que el frontend NO utiliza directamente:
- ⚠️ `has_business_role` — Usada solo en RLS policies, no llamada desde frontend
- ⚠️ `is_business_member` — Usada solo en RLS policies, no llamada desde frontend

> **Nota:** `has_business_role` y `is_business_member` son funciones helper para RLS. El frontend puede usarlas indirectamente a través de las políticas RLS, pero no las llama directamente como RPCs.

---

## Posibles Problemas Detectados

### 1. Timezone
- **DB:** Las columnas `start_at` y `end_at` son `timestamptz`. Los RPCs convierten a timezone local del negocio para validaciones.
- **Frontend:** Debe enviar timestamps en UTC (ISO string) y recibirlos en UTC. La conversión a hora local debe hacerse en el frontend usando la propiedad `timezone` del negocio.
- **Riesgo:** Si el frontend envía timestamps sin considerar timezone, las validaciones fallarán.
- **FIXED (2026-08-17):** Se eliminó `formatTime()` que usaba `toLocaleTimeString()` del navegador. Se agregaron utilidades en `helpers.ts`: `getLocalDateInTimezone()`, `getTodayInTimezone()`, `getTomorrowInTimezone()`, `formatTimeInTimezone()`, `formatDateShortInTimezone()`. Aplicado en DashboardAgenda.tsx — todas las fechas/horas ahora se calculan consistentemente en la timezone del negocio.

### 2. Grid de 15 minutos
- **DB:** `create_public_appointment` valida que el minuto sea múltiplo de 15 y segundos == 0.
- **Frontend:** Los slots retornados por `get_available_slots` ya respetan este grid, pero si el usuario puede editar manualmente la hora, debe validarse en frontend también.

### 3. Duración del servicio
- **DB:** `create_public_appointment` valida que `(end_at - start_at) == duration_minutes * 60`.
- **Frontend:** Debe calcular automáticamente `end_at = start_at + service.duration_minutes`.

### 4. Customer deduplication
- **DB:** `auto_find_or_create_customer` busca por teléfono dentro del mismo negocio.
- **Frontend:** No necesita manejar esto — el RPC lo hace automáticamente.

### 5. Race conditions
- **DB:** `create_public_appointment` usa advisory locks para prevenir reservas simultáneas del mismo slot.
- **Frontend:** Debe mostrar loading state durante la creación y manejar errores de "slot ya reservado".
