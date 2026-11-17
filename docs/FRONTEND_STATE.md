# Neudi — Estado del Frontend

Fuente de verdad: inspección directa de archivos en `C:\Users\USER\Desktop\neudi\src\`.

## Estructura de Directorios

```
src/
├── components/          ← Componentes UI reutilizables
│   ├── ui/              ← Componentes base (botones, inputs, selects, etc.)
│   ├── appointments/    ← Componentes de citas/reservas
│   ├── business/        ← Componentes de gestión del negocio
│   ├── customers/       ← Componentes de clientes
│   ├── dashboard/       ← Layout y componentes del dashboard
│   ├── layouts/         ← Layouts (AuthLayout, DashboardLayout)
│   └── shared/          ← Componentes compartidos
├── pages/               ← Páginas de la aplicación
│   ├── public/          ← Páginas públicas (reservas)
│   └── dashboard/       ← Páginas del dashboard
├── hooks/               ← Custom React hooks
├── services/            ← Llamadas a Supabase / API
├── lib/                 ← Utilidades, cliente Supabase
├── types/               ← Definiciones TypeScript
├── context/             ← Providers y contexto global
│   └── auth/            ← AuthProvider
└── App.tsx              ← Router principal
```

## Páginas

### Página Pública de Reservas

#### `/` — Selección de negocio
- Muestra lista de negocios disponibles
- Redirige a `/reservar/:slug` al seleccionar uno
- Estado: IMPLEMENTADO

#### `/reservar/:slug` — Flujo de reserva paso a paso
- **Paso 1:** Selección de servicio (lista de servicios activos del negocio)
- **Paso 2:** Selección de fecha (componente calendario)
- **Paso 3:** Selección de horario (slots generados por `get_available_slots`)
- **Paso 4:** Datos del cliente (formulario: nombre, teléfono, email)
- **Paso 5:** Confirmación y creación de reserva
- Estado: IMPLEMENTADO

#### `/reservar/:slug/servicios` — Lista de servicios
- Muestra servicios activos del negocio
- Cada servicio muestra: nombre, duración, precio
- Estado: IMPLEMENTADO

### Dashboard de Negocio

#### `/dashboard` — Vista principal
- Redirige a `/dashboard/agenda` por defecto
- Sidebar con navegación
- Estado: IMPLEMENTADO

#### `/dashboard/agenda` — Agenda visual
- Vista de calendario (día/semana/mes)
- Muestra citas del día seleccionado desde Supabase (`appointments`)
- Permite navegar entre fechas
- Botón "Agregar turno" → modal con formulario completo (nombre, teléfono, email, servicio, fecha/hora, notas)
- Antes de guardar, verifica disponibilidad del horario consultando `appointments` por solapamiento con turnos CONFIRMED. Si hay conflicto, muestra toast profesional indicando cliente y hora de fin, permitiendo seguir editando sin cerrar el modal
- Llama a RPC `create_public_appointment` para crear turnos manuales (ej: por Instagram/WhatsApp)
- Estado: IMPLEMENTADO (datos reales de appointments + creación manual con validación de slot)

#### `/dashboard/reservas` — Lista de reservas
- Tabla con todas las reservas del negocio
- Filtros por estado, fecha, cliente
- Acciones: ver detalle, editar, cancelar/completar
- Estado: IMPLEMENTADO (datos reales de appointments)

#### `/dashboard/clientes` — Gestión de clientes
- Lista de clientes del business desde `customers` con RLS
- Búsqueda por nombre/teléfono
- Vista de detalle del cliente con historial de reservas
- Creación de nuevos clientes
- Estado: IMPLEMENTADO (datos reales de customers)

#### `/dashboard/servicios` — CRUD de servicios
- Tabla de servicios existentes desde `services` con RLS
- Botón para crear nuevo servicio
- Formularios de edición/creación
- Eliminación de servicios
- Estado: IMPLEMENTADO (CRUD real sobre services table)

#### `/dashboard/horarios` — Configuración de horarios
- Tabla semanal con días y horarios desde `business_hours` con RLS
- Permite configurar horario por día
- Indica días no laborables
- INSERT/DELETE en `business_hours`
- Estado: IMPLEMENTADO (CRUD real sobre business_hours)

#### `/dashboard/excepciones` — Días especiales
- Lista de excepciones desde `business_exceptions` con RLS
- Formulario para agregar nueva excepción (cerrado/horario especial)
- Permite eliminar excepciones
- INSERT/DELETE en `business_exceptions`
- Estado: IMPLEMENTADO (CRUD real sobre business_exceptions)

## Componentes Importantes

### UI Base (`components/ui/`)
- Botones, inputs, selects, textareas, checkboxes, radios
- Modales y dialogs
- Toasts/notificaciones
- Loading spinners
- Empty states
- Tablas genéricas
- Formularios reutilizables

### Layouts (`components/layouts/`)
- **AuthLayout:** Layout para páginas de autenticación (login/register)
- **DashboardLayout:** Sidebar + header + contenido principal para el dashboard
- **PublicLayout:** Layout limpio para la página pública de reservas

### Dashboard (`components/dashboard/`)
- **Sidebar:** Navegación lateral con secciones del dashboard
- **Header:** Info del negocio + usuario logueado
- **CalendarView:** Componente reutilizable de calendario
- **AppointmentCard:** Tarjeta de cita en la agenda
- **StatusBadge:** Indicador visual del estado de una reserva

## Hooks

### `useBusiness(slug)`
- Obtiene datos del negocio por slug
- Estado: IMPLEMENTADO

### `useServices(businessId)`
- Obtiene servicios activos del negocio
- Estado: IMPLEMENTADO

### `useAvailableSlots(businessSlug, serviceId, date)`
- Llama a RPC `get_available_slots`
- Retorna slots disponibles para fecha y servicio
- Estado: IMPLEMENTADO

### `useCreateAppointment()`
- Llama a RPC `create_public_appointment`
- Maneja loading/error/success states
- Estado: IMPLEMENTADO

### `useBusinessAppointments(businessId, filters?)`
- Obtiene reservas del negocio desde Supabase (`appointments`)
- Filtros por fecha, estado, cliente
- Estado: IMPLEMENTADO

### `useBusinessCustomers(businessId)`
- Obtiene clientes del negocio desde Supabase (`customers`)
- Búsqueda por nombre/teléfono
- Estado: IMPLEMENTADO

## Servicios / API Layer

### `lib/supabase.ts` — Cliente Supabase
- Inicialización con `createClient()`
- URL y key leídas de variables de entorno
- Estado: IMPLEMENTADO

### `services/appointments.ts`
- `getAvailableSlots(businessSlug, serviceId, date)` → RPC
- `createAppointment(data)` → RPC
- `getBusinessAppointments(businessId, filters?)` → direct query con RLS
- Estado: IMPLEMENTADO (incluye cancelación y actualización de estado)

### `services/business.ts`
- `getBusinessBySlug(slug)` → direct query
- `updateBusiness(id, data)` → direct query
- Estado: IMPLEMENTADO

### `services/services.ts`
- `getServices(businessId)` → direct query
- `createService(data)` → direct query
- `updateService(id, data)` → direct query
- `deleteService(id)` → direct query
- Estado: IMPLEMENTADO (CRUD completo sobre services table)

### `services/businessHours.ts`
- `getBusinessHours(businessId)` → direct query
- `createBusinessHour(data)` → direct query
- `deleteBusinessHour(id)` → direct query
- Estado: IMPLEMENTADO

### `services/businessExceptions.ts`
- `getBusinessExceptions(businessId, filters?)` → direct query
- `createBusinessException(data)` → direct query
- `deleteBusinessException(id)` → direct query
- Estado: IMPLEMENTADO

### `services/customers.ts`
- `getCustomers(businessId)` → direct query
- `createCustomer(data)` → direct query
- `updateCustomer(id, data)` → direct query
- Estado: IMPLEMENTADO

## Tipos TypeScript (`types/`)

```typescript
// Negocio
interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  timezone: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Servicio
interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cliente
interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Reserva
interface Appointment {
  id: string;
  business_id: string;
  service_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  start_at: string; // timestamptz ISO
  end_at: string;   // timestamptz ISO
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

// Horario semanal
interface BusinessHour {
  id: string;
  business_id: string;
  day_of_week: number; // 1-7 (lunes-domingo)
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  is_active: boolean;
}

// Excepción de horario
interface BusinessException {
  id: string;
  business_id: string;
  date: string;        // YYYY-MM-DD
  is_closed: boolean;
  start_time?: string; // HH:mm (si no está cerrado)
  end_time?: string;   // HH:mm (si no está cerrado)
  reason?: string;
}

// Slot disponible
interface AvailableSlot {
  time: string;        // HH:mm (hora local del negocio)
  available: boolean;
}

// Respuesta de RPC get_available_slots
interface GetAvailableSlotsResponse {
  success: boolean;
  date: string;
  slots: AvailableSlot[];
}

// Respuesta de RPC create_public_appointment
interface CreateAppointmentResponse {
  success: boolean;
  appointment_id?: string;
  status?: string;
  error?: string;
  message: string;
}
```

## Cliente Supabase

- Ubicación: `src/lib/supabase.ts` (o similar)
- Inicialización con `createClient(supabaseUrl, supabaseAnonKey)`
- URL y key desde variables de entorno (`import.meta.env`)
- Estado: IMPLEMENTADO

## Autenticación

### Flujo actual
1. Usuario accede a `/login` o `/register`
2. Supabase Auth maneja el flujo (email/password)
3. Al registrarse, trigger `handle_new_user` crea perfil en tabla `profiles`
4. El owner se agrega manualmente como miembro del negocio (o vía UI)
5. Se almacena sesión en localStorage/sessionStorage

### Contextos/Providers
- **AuthProvider:** Envuelve la app con contexto de autenticación de Supabase
  - Provee: `user`, `session`, `isLoading`, `signOut()`
  - Protege rutas del dashboard con `useAuth()` guard
- Estado: IMPLEMENTADO

## Dashboard — Navegación

El dashboard usa una navegación lateral (sidebar) con las siguientes secciones:

1. **Agenda** → `/dashboard/agenda`
2. **Reservas** → `/dashboard/reservas`
3. **Clientes** → `/dashboard/clientes`
4. **Servicios** → `/dashboard/servicios`
5. **Horarios** → `/dashboard/horarios`
6. **Excepciones** → `/dashboard/excepciones`
7. **Configuración** → `/dashboard/configuracion`

## Estado de Conexión por Flujo

### Flujo Público (Reservas)
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Selección de negocio | SÍ | Query directa a `businesses` |
| Selección de servicio | SÍ | RPC o query a `services` con RLS público |
| Calendario (fecha) | NO | Componente UI local |
| Horarios disponibles | SÍ | RPC `get_available_slots` |
| Formulario cliente | NO | Validación local |
| Crear reserva | SÍ | RPC `create_public_appointment` |

### Flujo Dashboard — Agenda
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Cargar citas del día | SÍ | Query directa a `appointments` con RLS, filtra por fecha seleccionada |
| Navegación de fechas | IMPLEMENTADO | Flechas prev/next + date picker nativo + botón "Hoy" |

### Flujo Dashboard — Reservas
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Lista de reservas | SÍ | Query directa a `appointments` con RLS, filtra por business_id del usuario logueado |
| Filtros | IMPLEMENTADO | Por estado, fecha, cliente |
| Cancelar reserva | IMPLEMENTADO | UPDATE directo en `appointments` SET status='CANCELLED' |
| Completar reserva | IMPLEMENTADO | UPDATE directo en `appointments` SET status='COMPLETED' |

### Flujo Dashboard — Clientes
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Lista de clientes | SÍ | Query directa a `customers` con RLS, filtra por business_id |
| Crear cliente | IMPLEMENTADO | INSERT directo en `customers` |
| Buscar cliente | IMPLEMENTADO | LIKE query en nombre/teléfono |

### Flujo Dashboard — Servicios
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Lista de servicios | SÍ | Query directa a `services` con RLS, filtra por business_id |
| CRUD servicios | IMPLEMENTADO | INSERT/UPDATE/DELETE en `services` |

### Flujo Dashboard — Horarios
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Cargar horarios | SÍ | Query directa a `business_hours` con RLS, filtra por business_id |
| Guardar cambios | IMPLEMENTADO | INSERT/DELETE en `business_hours` |

### Flujo Dashboard — Excepciones
| Componente | Conectado a Supabase? | Notas |
|-----------|----------------------|-------|
| Lista de excepciones | SÍ | Query directa a `business_exceptions` con RLS, filtra por business_id |
| CRUD excepciones | IMPLEMENTADO | INSERT/DELETE en `business_exceptions` |

## Mocks y Datos Hardcodeados

### Mocks eliminados/reemplazados (sesión de integración)
- **Dashboard — Agenda:** Reemplazado por query directa a `appointments` con RLS, ordenado por start_at ASC. Acciones: crear turno manual vía RPC `create_public_appointment`, cancelar/completar vía UPDATE directo. Validación de slot disponible antes de crear turnos manuales.
- **Dashboard — Reservas (Appointments):** Reemplazado por query directa a `appointments` con filtros reales (status, date range, customer search). Acciones: confirmar/cancelar/completar vía UPDATE en `appointments`.
- **Dashboard — Clientes:** Reemplazado por query directa a `customers` con búsqueda real (LIKE en nombre/teléfono). Creación de nuevos clientes.
- **Dashboard — Servicios:** CRUD completo sobre `services` table (INSERT/UPDATE/DELETE) con RLS.
- **Dashboard — Horarios:** CRUD completo sobre `business_hours` table con RLS. INSERT/DELETE.
- **Dashboard — Excepciones:** CRUD completo sobre `business_exceptions` table con RLS. INSERT/DELETE.
- **BookingWizard (flujo público):** Usa RPC `get_available_slots` y RPC `create_public_appointment`.

### Datos hardcodeados restantes
- Días de la semana para el calendario semanal (localización)
- Valores por defecto en formularios
- Estados de reserva para badges visuales
- Textos estáticos de UI (ayuda, placeholders)

## Observaciones del Frontend

1. **Arquitectura limpia:** Separación clara entre componentes, hooks, servicios y tipos.
2. **Tipado fuerte:** TypeScript usado consistentemente con interfaces bien definidas.
3. **RPCs bien integrados:** Los RPCs de Supabase (`get_available_slots`, `create_public_appointment`) están llamados desde hooks/servicios.
4. **Dashboard 100% integrado:** Todas las páginas del dashboard ahora usan datos reales de Supabase con RLS — agenda, reservas, clientes, servicios, horarios y excepciones.
5. **Flujo público robusto:** La página de reservas públicas está bien implementada con validaciones tanto en frontend como backend.
6. **Real-time updates:** Dashboard usa subscriptions para actualizaciones en tiempo real en agenda, clientes y excepciones.
7. **BookingWizard:** Usa RPC `get_available_slots` por servicio individual y luego mergea los slots disponibles.
8. **Timestamps:** Todos los timestamps usan ISO strings (UTC) con timezone configurado por negocio.
9. **Timezone-aware date/time formatting (FIXED):** Todas las operaciones de formateo de fechas/horas en el frontend ahora usan la timezone del negocio (`America/Argentina/Buenos_Aires` o la configurada). Se eliminó `formatTime()` que usaba `toLocaleTimeString()` del navegador. Se agregaron utilidades: `getLocalDateInTimezone()`, `getTodayInTimezone()`, `getTomorrowInTimezone()`, `formatTimeInTimezone()`, `formatDateShortInTimezone()`. Aplicado en DashboardAgenda, BookingWizard y helpers.ts.
10. **Acciones de reservas:** Confirmar/cancelar/completar funcionan vía UPDATE directo en `appointments` con RLS que verifica ownership del business_id.
