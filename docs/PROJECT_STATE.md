# Neudi — Estado del Proyecto

## Propósito

Neudi es una plataforma SaaS de gestión de turnos para pequeños negocios, inicialmente orientada a peluquerías, barberías, salones y profesionales que trabajan con reservas.

La aplicación consta de dos partes principales:
1. **Página pública de reservas** — donde los clientes finales seleccionan negocio, servicio, fecha/hora y crean una reserva.
2. **Dashboard para negocios** — donde los dueños/administradores gestionan agenda, reservas, clientes, servicios, horarios, excepciones y configuración del negocio.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend / Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| RLS | Políticas Row-Level Security en PostgreSQL |
| Lógica de negocio | Funciones SQL (RPC) con SECURITY DEFINER |

## Estructura General

```
neudi/
├── docs/              ← documentación del proyecto
├── public/            ← assets estáticos
├── src/
│   ├── components/    ← componentes reutilizables
│   ├── pages/         ← páginas de la aplicación
│   ├── hooks/         ← custom React hooks
│   ├── services/      ← llamadas a Supabase / API
│   ├── lib/           ← utilidades, cliente Supabase
│   ├── types/         ← definiciones TypeScript
│   └── context/       ← providers y contexto global
├── supabase/          ← (ausente — sin CLI local)
└── migrations/        ← (ausentes en disco — aplicadas remotamente)
```

## Funcionalidades Existentes

### Página Pública de Reservas
- **Selección de negocio**: lista de negocios disponibles (slug-based routing).
- **Selección de servicio**: muestra servicios activos del negocio.
- **Selección de fecha**: calendario para elegir día.
- **Selección de horario**: slots generados por la función `get_available_slots`.
- **Datos del cliente**: formulario con nombre, teléfono y email.
- **Creación de reserva**: llamada a RPC `create_public_appointment`.

### Dashboard de Negocio
- **Agenda**: vista de reservas por día/semana.
- **Reservas**: lista CRUD de citas (crear, ver, actualizar, cancelar).
- **Clientes**: gestión de clientes del negocio.
- **Servicios**: CRUD de servicios (nombre, duración, precio).
- **Horarios**: configuración de horarios semanales (`business_hours`).
- **Excepciones**: días especiales (cerrado/horario reducido).
- **Gestión del negocio**: datos generales del negocio.

## Estado General

| Flujo | Estado | Notas |
|-------|--------|-------|
| Autenticación | IMPLEMENTADO | Supabase Auth con perfiles y business_members |
| Onboarding post-login | IMPLEMENTADO | Redirección automática a /onboarding si no tiene negocio |
| Selección de negocio | IMPLEMENTADO | Rutas basadas en slug |
| Servicios (público) | IMPLEMENTADO | RPC + tabla services con RLS |
| Horarios disponibles | IMPLEMENTADO | RPC `get_available_slots` funciona |
| Creación de reservas | IMPLEMENTADO | INSERT directo en `appointments` con validaciones |
| Dashboard — Agenda | IMPLEMENTADO | Datos reales de `appointments` con RLS, real-time subscription |
| Dashboard — Reservas | IMPLEMENTADO | CRUD completo sobre `appointments` con RLS |
| Dashboard — Clientes | IMPLEMENTADO | CRUD completo sobre `customers` con RLS |
| Dashboard — Servicios | IMPLEMENTADO | CRUD completo sobre `services` con RLS |
| Dashboard — Horarios | IMPLEMENTADO | CRUD completo sobre `business_hours` con RLS |
| Dashboard — Excepciones | IMPLEMENTADO | CRUD completo sobre `business_exceptions` con RLS |
| Pagos | PENDIENTE | No implementado |
| Notificaciones | PENDIENTE | No implementado |

## Flujo de Autenticación y Onboarding

### Estados del AuthContext

```typescript
interface AuthState {
  user: User | null;          // Usuario autenticado con datos del negocio
  isLoading: boolean;         // Cargando estado inicial
  onboardingRequired: boolean; // True si el usuario no tiene negocios
}
```

### Flujo de login
1. Usuario ingresa email/contraseña → `supabase.auth.signInWithPassword`
2. Se carga perfil + business_members → `loadUserFromSession()`
3. Si **no tiene** business_members → `onboardingRequired: true`, redirección a `/onboarding`
4. Si **tiene** business_members → `user` poblado, redirección a `/dashboard`

### Flujo de registro
1. Usuario completa formulario → `supabase.auth.signUp`
2. Se crea negocio automáticamente (businesses + business_members)
3. `user` poblado con datos del negocio creado
4. Redirección a `/dashboard`

### Flujo de onboarding (`/onboarding`)
1. Solo accesible si `onboardingRequired: true` (OnboardingGuard)
2. Usuario ingresa nombre del negocio
3. Se genera slug automáticamente, se llama a RPC `create_business_for_current_user`
4. La RPC crea: negocios + business_members con role OWNER (todo en una transacción SQL)
5. Se recarga la sesión para detectar el nuevo membership → redirección automática a `/dashboard`

### Guards de ruta

| Guard | Condición | Acción |
|-------|-----------|--------|
| PublicGuard | Sin auth + sin onboardingRequired | Muestra login/register |
| PublicGuard | onboardingRequired = true | Redirige a /onboarding |
| PublicGuard | user existe | Redirige a /dashboard |
| AuthGuard | onboardingRequired = true | Redirige a /onboarding |
| AuthGuard | Sin user | Redirige a /login |
| OnboardingGuard | onboardingRequired = true | Muestra formulario de onboarding |
| OnboardingGuard | user existe | Redirige a /dashboard |

### Archivos modificados para onboarding
- `src/contexts/AuthContext.tsx` — agregado flag `onboardingRequired`, función `createBusiness()` usa RPC `create_business_for_current_user`
- `src/components/common/AuthGuard.tsx` — actualizados guards + nuevo `OnboardingGuard`
- `src/pages/OnboardingPage.tsx` — **nuevo** formulario de creación de negocio con slug preview
- `src/App.tsx` — nueva ruta `/onboarding` con OnboardingGuard

### RPC usada en onboarding
- `create_business_for_current_user(p_name, p_slug, p_timezone, p_currency)` — SECURITY DEFINER
  - Verifica que el usuario no pertenezca ya a un negocio
  - Crea registro en `businesses` + `business_members` (role: owner) en una transacción
  - Devuelve el `business_id` del negocio creado

## Integración Supabase — Resumen

Todos los flujos del frontend están conectados a la base de datos real de Supabase. No existen mocks en producción.

### Dashboard Agenda (`src/pages/dashboard/DashboardAgenda.tsx`)
- **Query directa:** `SELECT` sobre `appointments` con join lateral a `services`
- **Filtros:** por estado (pending, confirmed) y búsqueda por cliente/servicio
- **Real-time:** subscription a cambios en tabla `appointments` filtrado por `business_id`
- **Acciones:** confirmar/cancelar/completar vía UPDATE directo en `appointments`
- **Navegación de fechas:** flechas prev/next, date picker nativo (`<input type="date">`) y botón "Hoy". Al navegar a un día específico, la query filtra solo ese día. En vista por defecto (hoy), muestra hoy+mañana. Unificado en un solo `useEffect` con dependencias `[businessId, selectedDate]` para evitar double-fetch.
- **Agregar turno manual:** botón "Agregar turno" abre modal con formulario (nombre, teléfono, email, servicio, fecha/hora, notas). Antes de guardar, verifica disponibilidad del horario consultando la tabla `appointments` por solapamiento de horarios con turnos CONFIRMED existentes. Si hay conflicto, muestra un toast profesional en esquina superior derecha indicando el nombre del cliente y hora de fin del turno ocupado, permitiendo seguir editando sin cerrar el modal. Al guardar exitosamente, llama a RPC `create_public_appointment`. Recarga la lista tras éxito.

### Dashboard Clientes (`src/pages/dashboard/DashboardClients.tsx`)
- **Query directa:** `SELECT` sobre `customers` con RLS (is_business_member)
- **CRUD completo:** crear/ver/editar/eliminar clientes
- **RPC usada:** `auto_find_or_create_customer` para búsqueda por teléfono

### Dashboard Servicios (`src/pages/dashboard/DashboardServices.tsx`)
- **Query directa:** `SELECT` sobre `services` con RLS (is_business_member)
- **CRUD completo:** crear/editar/eliminar servicios
- **RPC usada:** `get_service_duration_minutes` para duración de servicio

### Dashboard Horarios (`src/pages/dashboard/DashboardHours.tsx`)
- **Query directa:** `SELECT` sobre `business_hours` con RLS (is_business_member)
- **Estado local optimista:** los toggles y cambios de horario se aplican en estado local sin llamada a DB inmediata
- **Botón "Guardar cambios":** al hacer clic, batchea todas las operaciones (INSERT/UPDATE/DELETE) en una sola acción
- **Post-save:** recarga desde DB para reflejar el estado real guardado
- **Real-time:** subscription a cambios de otros clientes (no se dispara al guardar localmente)

### Dashboard Excepciones (`src/pages/dashboard/DashboardExceptions.tsx`)
- **Query directa:** `SELECT` sobre `business_exceptions` con RLS (is_business_member)
- **CRUD completo:** crear/editar/eliminar excepciones de fecha

### Flujo Público de Reserva (`src/pages/BookingWizard.tsx`)
- **Negocios:** `SELECT` directo en `businesses` por slug
- **Servicios:** `SELECT` directo en `services` filtrado por business_id + is_active
- **Slots disponibles:** RPC `get_available_slots` (business_slug, service_id, date)
- **Creación de reserva:** RPC `create_public_appointment` con todas las validaciones
- **Auto customer:** RPC `auto_find_or_create_customer` para crear/obtener cliente por teléfono

### Archivos eliminados
- `src/components/booking/BookingWizard.tsx` — archivo huérfano (no importado en ninguna ruta)

### Bugs corregidos
- DashboardAgenda: faltaba import de `Button` component → causaba crash en runtime al abrir detalle de turno
- DashboardHours: cada toggle/cambio de horario hacía INSERT/UPDATE inmediato a DB sin feedback visual; ahora usa estado local optimista + botón "Guardar cambios" que batchea todas las operaciones y recarga desde DB
- **Timezone fix (2026-08-17):** `DashboardAgenda` usaba `new Date()` y `toLocaleTimeString()` del navegador, causando inconsistencias entre la fecha mostrada y los datos de Supabase cuando el timezone del cliente difería del negocio. Se eliminó `formatTime()` y se reemplazaron todas las operaciones de fecha/hora por funciones timezone-aware: `getLocalDateInTimezone()`, `getTodayInTimezone()`, `getTomorrowInTimezone()`, `formatTimeInTimezone()`. Aplicado en DashboardAgenda.tsx.

## Dependencias Importantes

- `@supabase/supabase-js` — cliente Supabase para el frontend
- React Router / Navegación personalizada para rutas públicas y protegidas
- Tailwind CSS para estilos
- Posiblemente `date-fns` o similar para manipulación de fechas

## Observaciones

- No hay migraciones locales en disco (`supabase/` y `migrations/` ausentes). Todo el schema fue aplicado directamente en Supabase.
- No hay Edge Functions — toda la lógica de negocio está en funciones SQL RPC.
- La base de datos tiene 1 negocio de prueba, 2 perfiles (usuarios) y 1 miembro del negocio.
- Las tablas `services`, `business_hours`, `business_exceptions`, `customers` y `appointments` están vacías (excepto por datos creados durante pruebas).
