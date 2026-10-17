# Neudi — Documentación del Proyecto

## Descripción General

**Neudi** es una plataforma web de reservas de turnos para negocios locales (peluquerías, barberías, etc.) construida con **React + TypeScript + Vite**. El flujo principal permite a un cliente final ver los servicios de un negocio, elegir servicio/fecha/horario y completar datos para solicitar una reserva. Los dueños de negocio acceden a un dashboard para gestionar su agenda, servicios, clientes y configuración.

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Router | React Router DOM (`useParams`, `useNavigate`) |
| Estilos | Tailwind CSS (v3/v4 con clases utilitarias) |
| Estado local | React `useState` / `useMemo` / `useCallback` / `useEffect` |
| Context API | `AuthContext` para autenticación |
| Backend | **No conectado aún** — usa datos mock/locales |

---

## Estructura de Directorios

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx      # Layout del panel admin (sidebar + contenido)
│   │   └── PublicLayout.tsx         # Layout público (header + footer para clientes)
│   ├── ui/
│   │   ├── Button.tsx               # Botones reutilizables con variantes
│   │   ├── Badge.tsx                # Badges de estado (pending, confirmed, etc.)
│   │   └── Input.tsx                # Inputs y Textarea reutilizables
│   └── common/
│       ├── AuthGuard.tsx            # Protege rutas del dashboard
│       └── States.tsx               # EmptyState, LoadingSpinner
├── contexts/
│   └── AuthContext.tsx              # Contexto de auth (login, register, loginDemo)
├── data/
│   └── business.ts                  # Datos mock de negocio (demoBusiness)
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx            # Login con email/password + demo button
│   │   └── RegisterPage.tsx         # Registro con nombre, negocio, email, password
│   ├── dashboard/
│   │   ├── DashboardAgenda.tsx      # Vista de turnos (mock data) con filtros y drawer
│   │   ├── DashboardServices.tsx    # Lista de servicios + botón "Nuevo servicio"
│   │   ├── DashboardClients.tsx     # Lista de clientes con búsqueda
│   │   ├── DashboardSettings.tsx    # Formulario info del negocio + danger zone
│   │   ├── DashboardHours.tsx       # Editor de horarios por día (toggle + time inputs)
│   │   └── DashboardConfig.tsx      # Vista lectura de config actual (modo demo)
│   ├── booking/
│   │   └── BookingPage.tsx          # Flujo de reserva en 5 pasos para clientes
│   └── public/
│       └── BusinessPage.tsx         # Landing pública del negocio (hero, servicios, horarios)
├── services/
│   ├── appointmentService.ts        # Funciones: getBookedSlots(), createAppointment()
│   └── businessService.ts           # Función: getBusiness(slug)
├── types/                           # Tipos TypeScript compartidos
└── utils/
    └── helpers.ts                   # formatPrice(), getDayName(), etc.
```

---

## Rutas de la Aplicación

| Ruta | Página | Acceso | Descripción |
|------|--------|--------|-------------|
| `/` | Home pública | Público | Landing page principal |
| `/business/:slug` | BusinessPage | Público | Página del negocio (hero, servicios, horarios) |
| `/business/:slug/reservar` | BookingPage | Público | Flujo de reserva en 5 pasos |
| `/login` | LoginPage | Sin auth | Formulario login + demo button |
| `/register` | RegisterPage | Sin auth | Registro de nuevo negocio |
| `dashboard/agenda` | DashboardAgenda | Auth | Agenda de turnos con filtros y drawer de detalle |
| `dashboard/services` | DashboardServices | Auth | Gestión de servicios del negocio |
| `dashboard/clients` | DashboardClients | Auth | Lista de clientes registrados |
| `dashboard/settings` | DashboardSettings | Auth | Configuración general + danger zone |
| `dashboard/hours` | DashboardHours | Auth | Editor de horarios semanales |
| `dashboard/config` | DashboardConfig | Auth | Vista de configuración actual (solo lectura) |

---

## Flujo de Reserva (BookingPage)

El componente `BookingPage.tsx` implementa un wizard de 5 pasos:

1. **Servicio** — Lista los servicios del negocio con nombre, precio y duración
2. **Fecha** — Muestra los próximos 30 días, filtra domingos (día no disponible)
3. **Horario** — Muestra slots disponibles/ocupados para la fecha seleccionada
4. **Datos** — Formulario: nombre, teléfono, email, notas opcionales
5. **Confirmar** — Resumen de la reserva con botón "Confirmar reserva"

Al confirmar → llama a `createAppointment()` y muestra pantalla de éxito (step 6).

### Validaciones del formulario
- Paso 1: requiere servicio seleccionado
- Paso 2: requiere fecha seleccionada
- Paso 3: requiere horario seleccionado
- Paso 4: nombre, teléfono y email obligatorios

---

## Dashboard — Funcionalidades por Módulo

### Agenda (`DashboardAgenda.tsx`)
- Muestra turnos agrupados por fecha (Hoy / Mañana / Fecha)
- Búsqueda por cliente o servicio
- Filtros: Todos, Pendientes, Confirmados
- Drawer lateral con detalle del turno y acciones:
  - Pendiente → Confirmar / Cancelar
  - Confirmado → Marcar como completado
- **Datos mock** — `generateMockAppointments()` genera turnos de ejemplo

### Servicios (`DashboardServices.tsx`)
- Lista tarjetas con nombre, descripción, precio, duración
- Badge "Requiere seña" para servicios que lo necesitan
- Botón "Nuevo servicio" (formulario placeholder)
- **Datos mock** — `defaultServices[]`

### Clientes (`DashboardClients.tsx`)
- Lista con avatar, nombre, teléfono, total de visitas, última visita
- Búsqueda por nombre o teléfono
- **Datos mock** — `defaultClients[]`

### Horarios (`DashboardHours.tsx`)
- Tabla semanal (Lunes a Domingo) con toggles para abrir/cerrar cada día
- Inputs de hora inicio/fin cuando el día está abierto
- Estado inicial pre-configurado (Domingo cerrado)
- Botón "Guardar horarios" (sin persistencia aún)

### Configuración (`DashboardSettings.tsx`)
- Formulario: nombre del negocio, titular, email, teléfono, dirección
- Link de reserva copiable
- Zona de peligro con botón "Eliminar cuenta"
- Feedback visual de guardado exitoso

---

## Servicios / Capa de Datos (Estado Actual)

### `appointmentService.ts`
```typescript
getBookedSlots(date: string, serviceId: string): { time: string; available: boolean }[]
createAppointment(appointmentData): void
```
- **Implementación actual:** Funciones stub que operan sobre datos mock en memoria
- No hay llamadas a API ni base de datos

### `businessService.ts`
```typescript
getBusiness(slug: string): Business | undefined
```
- **Implementación actual:** Busca en el objeto `demoBusiness` definido en `data/business.ts`
- No hay llamadas a API ni base de datos

---

## Estado de Conexión con Supabase

### ❌ NO está conectado a Supabase aún

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Tablas en BD | ❌ No existen | No se han creado tablas en Supabase |
| Clientes | ❌ No instalado | `@supabase/supabase-js` no está en dependencias |
| Auth | ⚠️ Parcial | `AuthContext` usa funciones mock (`login`, `register`, `loginDemo`) sin backend real |
| Datos de negocio | ✅ Mock local | `data/business.ts` tiene datos demo (nombre, servicios, horarios) |
| Reservas | ✅ Mock local | `appointmentService.ts` crea turnos en memoria con `createAppointment()` |
| Clientes del dashboard | ✅ Mock local | Array estático en `DashboardClients.tsx` |
| Agenda | ✅ Mock local | `generateMockAppointments()` genera datos de ejemplo |

### Lo que se necesita para conectar Supabase:

1. **Instalar cliente:** `npm install @supabase/supabase-js`
2. **Crear tabla `profiles`:** Para usuarios del dashboard (negocios)
3. **Crear tabla `businesses`:** Información del negocio (nombre, slug, dirección, etc.)
4. **Crear tabla `services`:** Servicios ofrecidos por cada negocio
5. **Crear tabla `appointments`:** Reservas con campos: business_id, service_id, customer_name, customer_phone, customer_email, date, time, status, notes, created_at
6. **Configurar RLS (Row Level Security):** Para que cada negocio solo vea sus propios datos
7. **Migrar AuthContext:** Conectar `login()` y `register()` con Supabase Auth
8. **Migrar services layer:** Reemplazar mocks por llamadas a Supabase (`supabase.from('...').select()`, etc.)

---

## Tipos Principales (inferidos del código)

```typescript
// Negocio
interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  services: Service[];
  businessHours: BusinessHour[];
  timezone: string;
  currency: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  requiresDeposit: boolean;
}

// Horario semanal (formato del backend)
interface BusinessHour {
  dayOfWeek: number;    // 0=Domingo, 1=Lunes...6=Sábado
  openTime: string;     // "09:00"
  closeTime: string;    // "18:00"
}

// Turno / Cita
type AppointmentStatusLower = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Appointment {
  id: string;
  businessSlug: string;
  serviceId: string;
  date: string;           // "2026-08-14"
  time: string;           // "09:00"
  durationMinutes: number;
  customer: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  };
  status: AppointmentStatusLower;
  expiresAt: string;      // ISO timestamp
}

// Horarios por día (formato del editor DashboardHours)
interface BusinessHours {
  Monday: { open: boolean; start: string; end: string };
  Tuesday: { open: boolean; start: string; end: string };
  Wednesday: { open: boolean; start: string; end: string };
  Thursday: { open: boolean; start: string; end: string };
  Friday: { open: boolean; start: string; end: string };
  Saturday: { open: boolean; start: string; end: string };
  Sunday: { open: boolean; start: string; end: string };
}
```

---

## Componentes UI Reutilizables

### `Button` (`components/ui/Button.tsx`)
- Variantes: `default`, `secondary`, `danger`
- Tamaños: `btn-sm`, `btn-md`, `btn-lg` (clases Tailwind)
- Soporte para estado disabled y loading spinner

### `Badge` (`components/ui/Badge.tsx`)
- Variantes: `default`, `success`, `warning`, `danger`
- Usado para estados de turnos y flags de servicios

### `Input` / `Textarea` (`components/ui/Input.tsx`)
- Soporte para label, placeholder, type, value, onChange
- Input tiene variante `time` usada en DashboardHours

---

## Observaciones Técnicas

1. **Todo el estado es local** — No hay persistencia entre recargas de página
2. **No hay validación de formularios avanzada** — Solo checks básicos de campos vacíos
3. **El diseño es responsive** — Usa clases `sm:`, `md:` de Tailwind para breakpoints
4. **Idioma:** Todo el UI está en español (es-AR)
5. **Formato de precios:** Usa `formatPrice()` de `utils/helpers`
6. **No hay manejo de errores HTTP** — Las funciones de servicio son stubs
7. **El AuthGuard protege rutas del dashboard** pero la lógica de auth es mock
8. **Los horarios del negocio excluyen domingos** en el flujo de reserva (validación en `isDateAvailable`)

---

## Resumen: ¿Listo para Supabase?

| Pregunta | Respuesta |
|----------|-----------|
| ¿Tiene estructura frontend lista? | ✅ Sí — componentes, layouts, rutas y formularios están implementados |
| ¿Tiene capa de datos conectada a backend? | ❌ No — todo es mock/local |
| ¿Tiene autenticación real? | ❌ No — AuthContext usa funciones simuladas |
| ¿Necesita schema de base de datos? | ✅ Sí — se deben crear las tablas |
| ¿Se puede conectar Supabase? | ✅ Sí — la estructura frontend está preparada, solo falta reemplazar los mocks por llamadas a Supabase |

**Conclusión:** El proyecto tiene toda la interfaz de usuario y la lógica de flujo implementados. Está listo para conectar con Supabase, pero requiere: crear el schema en Supabase, instalar el cliente, configurar variables de entorno, migrar AuthContext al auth real de Supabase, y reemplazar cada función mock por llamadas a la base de datos.
