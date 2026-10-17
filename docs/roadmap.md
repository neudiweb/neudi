# Roadmap — Rediseño UX de la Agenda de Turnos (Neudi)

> **Fase actual**: ✅ Implementación completada
> **Estado**: Todo implementado, build exitoso, tests pasando
> **Alcance**: SOLO frontend — sin cambios en base de datos, sin migraciones

---

## 1. Análisis Actual

### 1.1 Pantalla actual (`src/pages/dashboard/DashboardAgenda.tsx`)

La pantalla funciona como una **lista de turnos del día seleccionado**. El dueño puede:

- Navegar entre días (flechas izquierda/derecha, input date, botón "Hoy")
- Filtrar por estado (Todos, Pendiente, Confirmado)
- Buscar por cliente o servicio
- Ver turnos como tarjetas con hora, cliente, servicio y estado
- Abrir detalle en un drawer lateral para aceptar/rechazar
- Crear turnos manualmente con un modal

**Problema UX identificado**: La vista está limitada al día seleccionado. No hay forma rápida de:
- Ver la actividad de toda la semana/mes de un vistazo
- Identificar días con alta concentración de turnos
- Detectar días con solicitudes pendientes
- Navegar rápidamente a cualquier fecha

### 1.2 Cómo se obtienen los turnos actualmente

```typescript
// DashboardAgenda.tsx:137-148
const { data, error } = await supabase
  .from('appointments')
  .select(`id, business_id, service_id, customer_name, customer_phone, customer_email, notes,
           start_at, end_at, status, created_at, updated_at,
           services:service_id (id, name, duration_minutes, price)`)
  .eq('business_id', bizId)
  .gte('start_at', startStr)   // inicio del día
  .lt('start_at', endStr)      // fin del día
  .in('status', ['PENDING', 'CONFIRMED', 'REQUIRES_DEPOSIT'])
  .order('start_at', { ascending: true });
```

- **Inicial**: fetch de hoy + mañana (sin `dateOverride`)
- **Navegación**: fetch de un día específico (con `dateOverride`)
- **Tiempo real**: suscripción Supabase que recarga al cambiar `selectedDate`
- **Solo muestra estados activos**: PENDING, CONFIRMED, REQUIRES_DEPOSIT

### 1.3 Helpers de fecha/hora existentes

Ubicados en `src/utils/dateTime.ts` (re-exportados por `src/utils/helpers.ts`):

| Función | Uso |
|---------|-----|
| `getTodayInTimezone(tz)` | Fecha de hoy en la tz del negocio |
| `getTomorrowInTimezone(tz)` | Fecha de mañana |
| `parseLocalDate(dateStr, tz)` | Parsea YYYY-MM-DD → Date en tz local |
| `addDaysToDate(dateStr, days, tz)` | Agrega días a una fecha |
| `getLocalDateInTimezone(isoString, tz)` | ISO → YYYY-MM-DD en tz del negocio |
| `formatTimeInTimezone(isoString, tz)` | ISO → HH:MM en tz del negocio |
| `formatDate(dateStr, tz)` | YYYY-MM-DD → "miércoles 2 de septiembre" |
| `getDaysInMonth(year, month)` | Array de Date para todos los días del mes |
| `isDayOfWeek(dateStr, bizDay, tz)` | Verifica si cae en día de negocio |
| `BUSINESS_TIMEZONE` | Constante `'America/Argentina/Buenos_Aires'` |

### 1.4 Componentes UI existentes

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `Badge` | `src/components/ui/Badge.tsx` | Badges de estado (default, success, warning, danger, info) |
| `Button` | `src/components/ui/Button.tsx` | Botones (primary, secondary, ghost, danger) |
| `Input` | `src/components/ui/Input.tsx` | Inputs estilizados |
| `LoadingSpinner` | `src/components/common/States.tsx` | Spinner de carga |
| `EmptyState` | `src/components/common/States.tsx` | Estado vacío |
| `ErrorState` | `src/components/common/States.tsx` | Estado de error |
| `DashboardLayout` | `src/components/layout/DashboardLayout.tsx` | Layout con sidebar |

### 1.5 Estados de turnos

| Estado DB | Estado UI | Label | Significado |
|-----------|-----------|-------|-------------|
| `PENDING` | `pending` | "Pendiente" | Esperando revisión |
| `CONFIRMED` | `confirmed` | "Confirmado" | Aceptado |
| `REQUIRES_DEPOSIT` | `requires_deposit` | "Requiere depósito" | Esperando pago |
| `REJECTED` | `rejected` | "Rechazado" | Rechazado |
| `CANCELLED` | `cancelled` | "Cancelado" | Cancelado |
| `COMPLETED` | `completed` | "Completado" | Terminado |
| `EXPIRED` | `expired` | "Expirado" | Vencido |

**Actualmente la agenda solo muestra**: PENDING, CONFIRMED, REQUIRES_DEPOSIT

### 1.6 ¿Existe algún componente de calendario?

**No.** No hay componente de calendario reutilizable en el proyecto. La única mención es en `HomePage.tsx:83` como punto de marketing ("Calendario inteligente").

---

## 2. Archivos a Modificar

### 2.1 Archivos nuevos (crear)

| Archivo | Propósito |
|---------|-----------|
| `src/components/dashboard/MonthlyCalendar.tsx` | Calendario mensual compacto con indicadores de turnos y pendientes |
| `src/components/dashboard/AgendaSummary.tsx` | Resumen superior compacto (hoy, semana, pendientes) |
| `src/hooks/useAgendaData.ts` | Hook unificado para obtener turnos del mes + pendientes |

### 2.2 Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/dashboard/DashboardAgenda.tsx` | Reestructurar layout: integrar calendario + resumen, mantener toda la lógica existente |
| `src/index.css` | Estilos adicionales para el calendario (si Tailwind no cubre) |

### 2.3 Archivos a NO modificar

- Base de datos (tablas, migraciones, RLS, policies, RPCs)
- `src/utils/dateTime.ts` — reutilizar tal cual
- `src/utils/helpers.ts` — reutilizar tal cual
- `src/services/appointmentService.ts` — la lógica de fetch vive en el componente, no se modifica el servicio
- `src/types/index.ts` — los tipos existentes son suficientes
- `src/lib/supabase.ts` — sin cambios

---

## 3. Componentes Nuevos Detallados

### 3.1 `MonthlyCalendar` — Calendario mensual

**Props:**

```typescript
interface MonthlyCalendarProps {
  currentDate: string;        // YYYY-MM-DD — día seleccionado actualmente
  selectedDate: string;       // YYYY-MM-DD — día que se está viendo en la lista
  appointmentsByDate: Record<string, Appointment[]>;
  pendingByDate: Record<string, number>;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  bizTimezone: string;
}
```

**Estructura visual:**

```
┌─────────────────────────────┐
│  ← Septiembre 2026        → │  ← Header con mes/año y flechas
├─────┬─────┬─────┬─────┬─────┤
│ Lun │ Mar │ Mié │ Jue │ Vie │ ← Nombres de día
│ Sáb │ Dom │     │     │     │
├─────┴─────┴─────┴─────┴─────┤
│     │  1│  7│ 14│ 21│ 28│   │
│     │ ▣ │ ▣ │ ▣ │ ▣ │ ▣ │   │  ▣ = indicador de turnos
│  25 │  2│  8│ 15│ 22│ 29│   │
│     │▣▣▣│ ▣ │▣▣ │ ▣ │ ▣ │   │ ▣▣▣ = 3 turnos
│     │ • │ ▣ │ • │ ▣ │ ▣ │   │ • = tiene pendientes
│  26 │  3│  9│ 16│ 23│ 30│   │
│ ▣ │▣▣ │ ▣ │▣▣▣│ ▣ │ ▣ │   │
│  27 │  4│ 10│ 17│ 24│  1│   │
│ ▣ │ ▣ │ ▣ │ ▣ │▣▣ │   │   │
└─────┴─────┴─────┴─────┴─────┘
```

**Comportamiento:**

- Muestra el mes de `currentDate` por defecto
- Flechas para navegar entre meses (±1 mes)
- Día seleccionado resaltado con color accent
- Día actual (hoy) con borde o punto indicador
- Número de turnos visible dentro de cada celda
- Indicador de pendientes (punto o badge) sobre el número
- Celdas de días sin turnos muestran solo el número
- Click en cualquier día → `onDateSelect(date)` → actualiza la lista de turnos
- Días del mes anterior/siguiente deshabilitados visualmente (no clickeables)

**Lógica de conteo por día:**

```typescript
// Derivado de appointmentsByDate (ya traído del backend)
const appointmentCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const apt of Object.values(appointmentsByDate).flat()) {
    counts[apt.date] = (counts[apt.date] || 0) + 1;
  }
  return counts;
}, [appointmentsByDate]);

// Pendientes por día
const pendingCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const apt of Object.values(appointmentsByDate).flat()) {
    if (apt.status === 'pending' || apt.status === 'requires_deposit') {
      counts[apt.date] = (counts[apt.date] || 0) + 1;
    }
  }
  return counts;
}, [appointmentsByDate]);
```

**Indicadores visuales por cantidad:**

- 0 turnos: solo el número del día
- 1-3 turnos: número pequeño (ej: "2")
- 4+ turnos: indicador de barra o punto (ej: "•••")
- Colores por densidad: verde (bajo), amarillo (medio), rojo (alto)

### 3.2 `AgendaSummary` — Resumen superior

**Props:**

```typescript
interface AgendaSummaryProps {
  todayCount: number;
  weekCount: number;
  pendingCount: number;
  confirmedThisWeek: number;
}
```

**Estructura visual:**

```
┌─────────────────────────────────────────────────────┐
│  Hoy: 5 turnos   ·   Esta semana: 18   ·   Pendientes: 3   │
└─────────────────────────────────────────────────────┘
```

Compacto, una sola línea en desktop, puede apilarse en mobile.

**Lógica:**

```typescript
// Hoy
const todayStr = getTodayInTimezone(bizTimezone);
const todayCount = appointmentsByDate[todayStr]?.length || 0;

// Esta semana (Lunes a Domingo)
const weekStart = getWeekStartDate(selectedDate, bizTimezone);  // función nueva
const weekEnd = addDaysToDate(weekStart, 6, bizTimezone);
const weekCount = countAppointmentsInRange(weekStart, weekEnd);

// Pendientes
const pendingCount = countByStatus('pending') + countByStatus('requires_deposit');
```

**Decisión sobre el resumen:**

✅ **SÍ incluir el resumen.** Encaja bien porque:
- Es compacto (una línea)
- Da contexto inmediato antes de la navegación
- No compite visualmente con la agenda
- Refuerza el valor de la vista mensual (el resumen da el "qué", el calendario da el "dónde")

### 3.3 `useAgendaData` — Hook unificado de datos

**Responsabilidades:**

1. Fetch de turnos del mes completo (no solo un día)
2. Fetch de turnos pendientes de meses adyacentes (para el calendario)
3. Agrupar turnos por fecha
4. Calcular conteos por día
5. Exponer estados loading/error

```typescript
interface UseAgendaDataReturn {
  appointments: DashboardAppointment[];
  appointmentsByDate: Record<string, DashboardAppointment[]>;
  loading: boolean;
  error: string | null;
  pendingCount: number;
  todayCount: number;
  weekCount: number;
  weekConfirmedCount: number;
  refetch: () => void;
}
```

**Lógica de fetch:**

```typescript
// En vez de fetch de un día, fetch del mes completo + 7 días adelante
const startOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
const endOfNextMonth = addDaysToDate(getLastDayOfMonth(currentYear, currentMonth), 7);

// Una sola query que devuelve todo el rango
const { data } = await supabase
  .from('appointments')
  .select('...')
  .eq('business_id', bizId)
  .gte('start_at', startOfMonth.toISOString())
  .lt('start_at', endOfNextMonth.toISOString())
  .in('status', ['PENDING', 'CONFIRMED', 'REQUIRES_DEPOSIT']);
```

**¿Por qué fetch de mes completo?**

- El calendario necesita saber cuántos turnos hay en cada día del mes
- Una sola query es más eficiente que N queries (una por día)
- Los datos ya se tienen en memoria para derivar los conteos
- La suscripción en tiempo real sigue funcionando (recarga todo el mes)

---

## 4. Lógica Existente que se Reutiliza

### 4.1 Sin cambios

| Lógica | Dónde | Cómo se reutiliza |
|--------|-------|-------------------|
| Status mapping (`mapDbStatus`) | `DashboardAgenda.tsx:24-35` | Se mueve al hook o se mantiene en el componente |
| `STATUS_LABELS` | `DashboardAgenda.tsx:14-22` | Se re-exporta / se mueve al hook |
| Date helpers | `utils/dateTime.ts` | Se importan directamente |
| `BUSINESS_TIMEZONE` | `utils/helpers.ts` | Se importa directamente |
| Real-time subscription | `DashboardAgenda.tsx:207-227` | Se mueve al hook con `selectedDate` como dependencia |
| `updateStatus` | `DashboardAgenda.tsx:229-244` | Se mantiene en el componente (es una acción, no data) |
| Search & filter logic | `DashboardAgenda.tsx:246-256` | Se mantiene en el componente (es UI logic) |
| Modal de agregar turno | `DashboardAgenda.tsx:277-442` | Se mantiene intacto |
| Slot conflict toast | `DashboardAgenda.tsx:304-358` | Se mantiene intacto |
| Holiday notice | `UpcomingHolidayNotice.tsx` | Se mantiene igual |

### 4.2 Con cambios menores

| Lógica | Cambio |
|--------|--------|
| `fetchAppointments` | Cambiar de "un día" a "rango de fechas" (mes + 7 días) |
| `selectedDate` state | Se mantiene igual, pero ahora se sincroniza con el calendario |
| Date navigation (`navigateDate`, `goToday`) | Se mantiene, ahora también actualiza scroll del calendario |
| `onDatePickerChange` | Se mantiene, ahora también actualiza el mes del calendario |

---

## 5. Cómo Obtener Cantidades de Turnos por Día

### 5.1 Flujo de datos

```
Backend (Supabase)
  ↓ (una query con rango de fechas)
useAgendaData hook
  ↓ (appointments array)
appointmentsByDate Record<string, Appointment[]>
  ↓ (reduce/map en el componente)
appointmentCountByDate Record<string, number>
pendingCountByDate Record<string, number>
  ↓ (pasado como props)
MonthlyCalendar component
  ↓ (render)
Celdas del calendario con indicadores visuales
```

### 5.2 Cálculo en el hook

```typescript
const appointmentsByDate = useMemo(() => {
  const grouped: Record<string, DashboardAppointment[]> = {};
  for (const apt of appointments) {
    if (!grouped[apt.date]) grouped[apt.date] = [];
    grouped[apt.date].push(apt);
  }
  return grouped;
}, [appointments]);

const appointmentCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const [date, apts] of Object.entries(appointmentsByDate)) {
    counts[date] = apts.length;
  }
  return counts;
}, [appointmentsByDate]);

const pendingCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const apt of appointments) {
    if (apt.status === 'pending' || apt.status === 'requires_deposit') {
      counts[apt.date] = (counts[apt.date] || 0) + 1;
    }
  }
  return counts;
}, [appointments]);
```

### 5.3 Resumen calculations

```typescript
const todayStr = getTodayInTimezone(bizTimezone);
const todayCount = appointmentCountByDate[todayStr] || 0;

// Semana: Lunes a Domingo
function getWeekStartDate(dateStr: string, tz: string): string {
  const date = parseLocalDate(dateStr, tz);
  const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ...
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDaysToDate(dateStr, -daysSinceMonday, tz);
}

const weekStart = getWeekStartDate(selectedDate, bizTimezone);
const weekEnd = addDaysToDate(weekStart, 6, bizTimezone);
const weekCount = Object.entries(appointmentCountByDate)
  .filter(([date]) => date >= weekStart && date <= weekEnd)
  .reduce((sum, [, count]) => sum + count, 0);

const pendingCount = Object.values(pendingCountByDate).reduce((sum, c) => sum + c, 0);
```

---

## 6. Cómo Funciona la Selección de Fecha

### 6.1 Flujo de interacción

```
1. Usuario hace click en un día del calendario
   → onDateSelect(date) → setSelectedDate(date)
   → useEffect triggers → fetchAppointments(bizId, date)
   → Lista de turnos se actualiza

2. Usuario navega con flechas del header
   → navigateDate(dir) → setSelectedDate(newDate)
   → fetchAppointments(bizId, date)
   → Lista se actualiza
   → Calendario hace scroll al día seleccionado

3. Usuario usa input date
   → onDatePickerChange(e) → setSelectedDate(e.target.value)
   → fetchAppointments(bizId, date)
   → Lista se actualiza
   → Calendario hace scroll al mes del día seleccionado

4. Usuario hace click en "Hoy"
   → goToday() → setSelectedDate(todayStr)
   → fetchAppointments(bizId, date)
   → Lista se actualiza
   → Calendario hace scroll al día actual
```

### 6.2 Sincronización calendario ↔ lista

- El calendario muestra el mes de `selectedDate`
- Al seleccionar un día en el calendario, se actualiza `selectedDate`
- La lista muestra los turnos de `selectedDate`
- Si se navega con flechas/input date, el calendario resalta el nuevo día
- Si se hace scroll en el calendario (mes anterior/siguiente), se actualiza el mes visual pero NO `selectedDate` hasta que se haga click

### 6.3 Scroll del calendario

Al cambiar `selectedDate`, el calendario debe hacer scroll al día seleccionado:

```typescript
// En MonthlyCalendar
useEffect(() => {
  if (selectedDate) {
    const dayElement = calendarRef.current?.querySelector(`[data-date="${selectedDate}"]`);
    dayElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [selectedDate]);
```

---

## 7. Comportamiento Responsive

### 7.1 Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  Agenda                                    [+ Agregar turno] │
├─────────────────────────────────────────────────────────────┤
│  Hoy: 5   ·   Esta semana: 18   ·   Pendientes: 3          │
├───────────────────┬─────────────────────────────────────────┤
│                   │  ← Miércoles 2 de septiembre →          │
│  CALENDARIO       │  [◀] [date input] [▶]  [Hoy]           │
│  ~35% width       │  Todos | Pendiente | Confirmado         │
│                   │                                         │
│  Sep 2026         │  ┌───────────────────────────────────┐ │
│                   │  │ 09:00  Juan García                │ │
│  L  M  X  J  V S │  │         Corte          [Pendiente]│ │
│    1  2  3  4  5  │  └───────────────────────────────────┘ │
│  6  7  8  9 10 11 │  ┌───────────────────────────────────┐ │
│ 12 13 14 15 16 17 │  │ 10:00  Pedro López                │ │
│ 18 19 20 21 22 23 │  │         Barbiño        [Confirmado]│ │
│ 24 25 26 27 28 29 │  └───────────────────────────────────┘ │
│ 30  1  2  3  4  5 │                                         │
│                   │  ...                                    │
└───────────────────┴─────────────────────────────────────────┘
```

**Layout:**
- `display: grid` con 2 columnas: `grid-cols-[35%_1fr]` o `grid-cols-[320px_1fr]`
- Calendario sticky (`position: sticky; top: ...`) para que acompañe el scroll
- Separador visual entre paneles (border o gap)
- Lista de turnos ocupa el resto del ancho

### 7.2 Tablet (768px - 1023px)

```
┌─────────────────────────────────────────────────────────────┐
│  Agenda                                    [+ Agregar turno] │
├─────────────────────────────────────────────────────────────┤
│  Hoy: 5   ·   Esta semana: 18   ·   Pendientes: 3          │
├─────────────────────────────────────────────────────────────┤
│  [◀] [date input] [▶]  [Hoy]                               │
│  Todos | Pendiente | Confirmado                             │
├───────────────────┬─────────────────────────────────────────┤
│                   │  ← Miércoles 2 de septiembre →          │
│  CALENDARIO       │  ┌───────────────────────────────────┐ │
│  ~30% width       │  │ 09:00  Juan García                │ │
│                   │  │         Corte          [Pendiente]│ │
│  Sep 2026         │  └───────────────────────────────────┘ │
│                   │  ┌───────────────────────────────────┐ │
│  L  M  X  J  V S │  │ 10:00  Pedro López                │ │
│    1  2  3  4  5  │  │         Barbiño        [Confirmado]│ │
│  6  7  8  9 10 11 │  └───────────────────────────────────┘ │
│  ...              │                                         │
└───────────────────┴─────────────────────────────────────────┘
```

**Layout:**
- Mismo grid que desktop pero con anchos más ajustados
- Calendario más compacto (números más pequeños)

### 7.3 Mobile (< 768px)

```
┌──────────────────────────────────────┐
│  Agenda              [+ Agregar]     │
├──────────────────────────────────────┤
│  Hoy: 5  ·  Sem: 18  ·  Pend: 3     │
├──────────────────────────────────────┤
│  [◀] [2026-09-02] [▶]  [Hoy]        │
│  Miércoles 2 de septiembre           │
│  Todos | Pendiente | Confirmado      │
├──────────────────────────────────────┤
│  📅 Septiembre 2026                  │
│  L  M  X  J  V S D                  │
│     1  2  3  4  5  6                │
│  7  8  9 10 11 12 13                │
│  ...                                │
├──────────────────────────────────────┤
│  ← Miércoles 2 de septiembre →      │
│  ┌────────────────────────────────┐ │
│  │ 09:00  Juan García             │ │
│  │         Corte      [Pendiente] │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ 10:00  Pedro López             │ │
│  │         Barbiño    [Confirmado]│ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Layout:**
- Todo apilado verticalmente
- Calendario como sección separada entre filtros y lista
- Calendario compacto (días de la semana en 2 filas: L-V / S-D)
- Navegación de día (flechas + date input) se mantiene debajo de los filtros
- Lista de turnos ocupa todo el ancho

**Clases Tailwind:**

```tsx
<div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
  {/* Calendario - visible en desktop/tablet, colapsable en mobile */}
  <div className="hidden lg:block">
    <MonthlyCalendar ... />
  </div>

  {/* Contenido principal */}
  <div>
    {/* Mobile calendar toggle */}
    <button className="lg:hidden" onClick={() => setShowCalendar(!showCalendar)}>
      📅 Ver calendario
    </button>
    {showCalendar && <MonthlyCalendar ... />}

    {/* Todo lo existente: navegación, filtros, lista */}
  </div>
</div>
```

---

## 8. Estados Loading / Empty / Error

### 8.1 Loading

```
┌──────────────────────────────────────┐
│  [Spinner]                           │
│  Cargando agenda...                  │
└──────────────────────────────────────┘
```

- Se muestra mientras `useAgendaData` está haciendo el fetch inicial
- El spinner usa el componente `LoadingSpinner` existente
- Mensaje: "Cargando agenda..."

### 8.2 Empty

```
┌──────────────────────────────────────┐
│  📋                                  │
│  No hay turnos                       │
│  No tenés turnos programados         │
│  para este período.                  │
└──────────────────────────────────────┘
```

- Se muestra cuando no hay turnos en el rango del calendario
- Usa el componente `EmptyState` existente
- El `description` debe ser contextual:
  - Si hay filtros activos: "Probá con otros filtros."
  - Si no: "No tenés turnos programados para este período."

### 8.3 Error

```
┌──────────────────────────────────────┐
│  ⚠️                                  │
│  Algo salió mal                      │
│  Error al cargar la agenda.          │
│  [Reintentar]                        │
└──────────────────────────────────────┘
```

- Se muestra cuando la query de Supabase falla
- Usa el componente `ErrorState` existente
- Botón "Reintentar" que llama a `refetch()`

### 8.4 Transiciones

- Al cambiar de mes en el calendario: no mostrar loading (los datos ya están en memoria)
- Al cambiar de día con flechas: mostrar loading breve (refetch de un día)
- Al navegar a "Hoy": mostrar loading breve
- La suscripción en tiempo real no muestra loading (actualiza en background)

---

## 9. Tests Necesarios

### 9.1 Unit Tests (vitest)

#### `src/utils/__tests__/dateTime.test.ts` — Agregar tests

| Test | Descripción |
|------|-------------|
| `getWeekStartDate` | Calcula correctamente el lunes de la semana dada |
| `getWeekStartDate` con domingo | Si es domingo, devuelve el lunes anterior |
| `countAppointmentsInRange` | Cuenta correctamente turnos en rango de fechas |
| `aggregateAppointmentCounts` | Agrrega conteos por día desde array de turnos |

#### `src/components/dashboard/__tests__/MonthlyCalendar.test.tsx`

| Test | Descripción |
|------|-------------|
| Renderiza mes actual | Muestra el mes y año correctos |
| Navegación entre meses | Flechas cambian el mes |
| Día seleccionado resaltado | Clase visual diferente en selectedDate |
| Día actual destacado | Indicador visual en hoy |
| Click en día | Llama a onDateSelect con la fecha correcta |
| Indicador de turnos | Muestra conteo en celdas con turnos |
| Indicador de pendientes | Muestra badge en días con pendientes |
| Días del mes anterior | Mostrados pero deshabilitados |
| Responsive | Calendario se adapta a mobile |

#### `src/hooks/__tests__/useAgendaData.test.ts`

| Test | Descripción |
|------|-------------|
| Fetch inicial | Obtiene turnos del rango correcto |
| Agrupación por fecha | `appointmentsByDate` agrupado correctamente |
| Loading state | `loading` es true durante fetch |
| Error state | `error` se setea si la query falla |
| Refetch | `refetch()` ejecuta la query nuevamente |
| Pendientes | `pendingCount` cuenta solo PENDING + REQUIRES_DEPOSIT |
| Tiempo real | Suscripción se configura correctamente |

### 9.2 E2E Tests (Playwright)

| Test | Descripción |
|------|-------------|
| Calendario muestra mes | El calendario renderiza el mes actual |
| Click en día actualiza lista | Click en día del calendario muestra sus turnos |
| Navegación con flechas | Flechas actualizan la fecha seleccionada |
| Resumen muestra datos correctos | Los números del resumen coinciden con los datos reales |
| Responsive layout | En mobile el calendario se apila verticalmente |
| Pendientes indicadores | Días con pendientes muestran el indicador |

---

## 10. Criterios de Aceptación

### 10.1 Funcionales

- [ ] El calendario mensual se muestra en desktop y tablet
- [ ] El calendario se muestra como sección colapsable en mobile
- [ ] Cada día del calendario muestra la cantidad de turnos
- [ ] Días con solicitudes pendientes muestran un indicador visual
- [ ] Click en un día del calendario actualiza la lista de turnos
- [ ] La navegación existente (flechas, date input, "Hoy") sigue funcionando
- [ ] El resumen superior muestra: turnos hoy, turnos esta semana, pendientes
- [ ] El día seleccionado está visualmente destacado en el calendario
- [ ] El día actual (hoy) tiene un indicador visual en el calendario
- [ ] La suscripción en tiempo real sigue actualizando los datos
- [ ] No se modificó ninguna tabla, migración, RLS, policy ni RPC

### 10.2 UX

- [ ] En desktop, el calendario y la lista son visibles simultáneamente
- [ ] En mobile, el calendario no ocupa toda la pantalla
- [ ] El cambio de día en el calendario es inmediato (sin loading)
- [ ] Los indicadores de cantidad son legibles a simple vista
- [ ] El diseño no interfiere con las acciones existentes (aceptar/rechazar)
- [ ] El drawer de detalle del turno sigue funcionando correctamente
- [ ] El modal de agregar turno sigue funcionando correctamente

### 10.3 Técnico

- [ ] No hay errores de TypeScript (`tsc` limpia)
- [ ] No hay console errors en runtime
- [ ] Los helpers de fecha existentes se reutilizan sin modificaciones
- [ ] El código existente de aceptación/rechazo de turnos no se modificó
- [ ] Las dependencias no se cambiaron (sin agregar librerías de calendario)
- [ ] El layout usa Tailwind classes (sin CSS inline excesivo)

---

## 11. Orden de Implementación Recomendado

### Etapa 1: Datos y Hook
1. Crear `src/hooks/useAgendaData.ts`
   - Fetch de rango mensual
   - Agrupación por fecha
   - Conteos derivados
   - Loading/error states
   - Real-time subscription

### Etapa 2: Componente Calendario
2. Crear `src/components/dashboard/MonthlyCalendar.tsx`
   - Grid de días del mes
   - Navegación entre meses
   - Indicadores de turnos
   - Indicadores de pendientes
   - Selección de día
   - Responsive

### Etapa 3: Componente Resumen
3. Crear `src/components/dashboard/AgendaSummary.tsx`
   - Contadores de hoy, semana, pendientes
   - Layout compacto
   - Responsive

### Etapa 4: Integración
4. Modificar `src/pages/dashboard/DashboardAgenda.tsx`
   - Integrar MonthlyCalendar + AgendaSummary
   - Mantener toda la lógica existente
   - Layout responsive (split desktop, stacked mobile)
   - Sincronizar calendario ↔ lista ↔ navegación

### Etapa 5: Pulido
5. Estilos y ajustes finales
   - Transiciones suaves
   - Estados hover/focus
   - Accesibilidad (ARIA labels, keyboard nav)
   - Testing manual

---

## 12. Riesgos y Consideraciones

### Riesgos
| Riesgo | Mitigación |
|--------|------------|
| Fetch de mes completo puede ser lento con muchos turnos | Paginación o límite superior (ej: 500 turnos). Si hay más, mostrar advertencia. |
| Layout split puede ser complejo en responsive | Empezar con desktop-first, luego adaptar mobile |
| Calendario en mobile puede ocupar mucho espacio | Sección colapsable con toggle "Ver calendario" |
| Los indicadores visuales pueden saturar | Limitar indicadores a 3+ turnos (mostrar número para 1-2) |

### Consideraciones
- **Sin librerías externas**: El calendario se construye con HTML/CSS/React puro
- **Tailwind v4**: Usar utilities de Tailwind, evitar CSS custom
- **TypeScript strict**: Mantener tipado fuerte en todos los nuevos componentes
- **Accesibilidad**: El calendario debe ser navegable con teclado (tab, enter, flechas)
- **Performance**: Los conteos se derivan con `useMemo`, no se recalculan en cada render

---

## 13. Implementación — Resumen Final

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useAgendaData.ts` | Hook unificado: fetch por rango mensual + agrupamiento local + métricas derivadas |
| `src/components/dashboard/MonthlyCalendar.tsx` | Calendario mensual visual con indicadores de turnos y pendientes |
| `src/components/dashboard/AgendaSummary.tsx` | Resumen compacto: Hoy / Esta semana / Pendientes |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/dashboard/DashboardAgenda.tsx` | Integración completa: calendario, resumen, navegación sincronizada, layout responsive |
| `src/pages/dashboard/DashboardHours.tsx` | Fix pre-existente: type assertion en `.insert()` |
| `src/services/holidayService.ts` | Fix pre-existente: null check en `cached` |

### Qué se reutilizó

- `utils/dateTime.ts` — todos los helpers de fecha (sin modificaciones)
- `utils/helpers.ts` — re-exports de dateTime
- `lib/supabase.ts` — cliente y tipos (sin modificaciones)
- `types/index.ts` — `AppointmentStatusLower` y demás tipos
- Componentes UI existentes: `Badge`, `Button`, `Input`, `LoadingSpinner`, `EmptyState`, `ErrorModal`, `DashboardLayout`
- Lógica de aceptar/rechazar turnos (drawer de detalle)
- Modal de agregar turno
- Slot conflict toast
- Suscripción en tiempo real de Supabase
- RPC `create_public_appointment`

### Cómo se calculan los totales por día

```typescript
// En useAgendaData.ts
const appointmentsByDate = useMemo(() => {
  const grouped: Record<string, AgendaAppointment[]> = {};
  for (const apt of allAppointments) {
    if (!grouped[apt.date]) grouped[apt.date] = [];
    grouped[apt.date].push(apt);
  }
  return grouped;
}, [allAppointments]);

const appointmentCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const [date, apts] of Object.entries(appointmentsByDate)) {
    counts[date] = apts.length;
  }
  return counts;
}, [appointmentsByDate]);
```

### Cómo se calculan los pendientes

```typescript
const PENDING_STATUSES = ['PENDING', 'REQUIRES_DEPOSIT'];

const pendingCountByDate = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const apt of allAppointments) {
    if (PENDING_STATUSES.includes(apt.status.toUpperCase())) {
      counts[apt.date] = (counts[apt.date] || 0) + 1;
    }
  }
  return counts;
}, [allAppointments]);

const totalPendingCount = Object.values(pendingCountByDate).reduce((sum, c) => sum + c, 0);
```

### Cómo funciona responsive

- **Desktop (≥1024px)**: `lg:flex-row` — calendario 35% izquierda, lista 65% derecha
- **Mobile (<1024px)**: `flex-col` — calendario arriba, lista debajo, todo en una columna
- El calendario es compacto en mobile con días de la semana en 2 filas (L-V / S-D)

### Tests ejecutados

| Test | Resultado |
|------|-----------|
| `npx vitest run src/utils/__tests__/dateTime.test.ts` | ✅ 28/28 pasando |
| `npm run build` (tsc + vite) | ✅ Build exitoso |
| `npm run lint` | ✅ Sin errores en archivos nuevos (solo warnings pre-existentes) |

### Decisiones de diseño importantes

1. **Arquitectura de fetch único por rango**: En vez de fetch por día, se hace un fetch del mes visible + margen. Los cambios de día se resuelven localmente con `useMemo`.
2. **Cero queries por día**: Cambiar de día con flechas o calendario NO dispara nueva query a Supabase (solo si se navega a un mes no cargado).
3. **Reutilización total de helpers de fecha**: Se usa `America/Argentina/Buenos_Aires` consistentemente. No se introduce lógica duplicada.
4. **Indicadores mínimos en calendario**: Número de turnos como texto pequeño dentro de la celda. Badge rojo para pendientes. Sin saturación visual.
5. **Sin librerías externas**: Calendario construido con HTML/CSS/React puro + Tailwind.

### Confirmación: NO se modificó

- ❌ Base de datos (tablas, migraciones)
- ❌ RLS policies
- ❌ RPCs existentes
- ❌ `lib/supabase.ts`
- ❌ `types/index.ts`
- ❌ `utils/dateTime.ts`
- ❌ Lógica de aceptar/rechazar turnos
- ❌ Modal de agregar turno
- ❌ Slot conflict toast
- ❌ Suscripción en tiempo real

---

## 14. Evolución del Sistema de Estados de Turnos — Fase 1: Análisis y Planificación

> **Estado**: ✅ Análisis completado — Fase 1 de inspección y planificación
> **Alcance**: Estudio exhaustivo del sistema actual de estados, mapeo de uso en código y BD, propuesta de evolución
> **Sin cambios**: Esta sección documenta hallazgos y propuestas. No implica cambios implementados.

---

### 14.1 Inspección del Sistema Actual de Estados

#### 1.1 Dónde está definido el enum real

**TypeScript (`src/types/index.ts`):**

- Líneas 36-43 — `AppointmentStatus` (UPPERCASE, para DB):
  ```typescript
  export type AppointmentStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'REQUIRES_DEPOSIT'
    | 'REJECTED'
    | 'EXPIRED'
    | 'CANCELLED'
    | 'COMPLETED';
  ```

- Líneas 46-53 — `AppointmentStatusLower` (lowercase, para UI):
  ```typescript
  export type AppointmentStatusLower =
    | 'pending'
    | 'confirmed'
    | 'requires_deposit'
    | 'rejected'
    | 'expired'
    | 'cancelled'
    | 'completed';
  ```

**Supabase DB (`src/lib/supabase.ts`):**

- Líneas 162, 177, 190 — tipos inline en `Database` interface:
  ```typescript
  status: 'PENDING' | 'CONFIRMED' | 'REQUIRES_DEPOSIT' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  ```

**Supabase remote (proyecto `hvafniqbmwwdcrlxymir`):**

- Columna `status` de tabla `appointments`: tipo `appointment_status` (enum PostgreSQL)
- Default: `'PENDING'::appointment_status`
- ⚠️ **Discrepancia crítica**: `REQUIRES_DEPOSIT` existe en los tipos TS (7 valores) pero su presencia en el enum PostgreSQL es desconocida. Los greps en código fuente muestran 7 valores en TS y en `src/lib/supabase.ts`, pero esto NO confirma que el enum de BD lo contenga.
- **Acción requerida antes de cualquier migración:** Ejecutar `SELECT enum_range(NULL::appointment_status);` en la BD para confirmar los valores reales del enum.
- **Decisión:** No asumir. Si `REQUIRES_DEPOSIT` falta en el enum, se agregará en la migración correspondiente (Fase 2). Si ya existe, no habrá cambio.

**Interfaz `Appointment` (`src/types/index.ts:80`):**
```typescript
status: AppointmentStatus;
```

#### 1.2 Cómo llega a TypeScript

**Pipeline completo de transformación:**

| Paso | Dirección | Archivo | Línea | Método |
|------|-----------|---------|-------|--------|
| 1 | DB → TS | `useAgendaData.ts` | 117 | `mapDbStatus(apt.status)` — mapea UPPERCASE a lowercase |
| 2 | TS → UI | `DashboardAgenda.tsx` | 173 | `status.toUpperCase()` — convierte lowercase a UPPERCASE para escribir en DB |
| 3 | UI → comparación | `useAgendaData.ts` | 184 | `apt.status.toUpperCase()` — defensivo, convierte lowercase a uppercase para comparar con `PENDING_STATUSES` array |

**`mapDbStatus()` (`useAgendaData.ts:14-25`):**
```typescript
function mapDbStatus(status: string): AppointmentStatusLower {
  const mapping: Record<string, AppointmentStatusLower> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REQUIRES_DEPOSIT: 'requires_deposit',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  };
  return mapping[status] ?? ('pending' as AppointmentStatusLower); // fallback
}
```

**Fallback de seguridad:** cualquier status no mapeado en `mapDbStatus()` retorna `'pending'`.

#### 1.3 Transformación uppercase/lowercase — Resumen

| Ubicación | Dirección | Método |
|-----------|-----------|--------|
| `useAgendaData.ts:117` | DB → UI | `mapDbStatus()` |
| `DashboardAgenda.tsx:173` | UI → DB | `.toUpperCase()` |
| `useAgendaData.ts:184` | UI → comparación | `.toUpperCase()` defensivo |
| `DashboardClients.tsx:51` | DB query directa | `'CONFIRMED', 'COMPLETED', 'PENDING'` (UPPERCASE literal) |
| `DashboardAgenda.tsx:260,276` | Slot conflict check | `'CONFIRMED'` (UPPERCASE literal) |
| `BookingSuccess.tsx:44-49` | Status labels | UPPERCASE keys (solo 4 de 7 mapeados) |

#### 1.4 Componentes que dependen de los estados

| Componente | Archivo | Cómo usa estados |
|------------|---------|------------------|
| DashboardAgenda | `src/pages/dashboard/DashboardAgenda.tsx` | Filtros, badges, acciones (confirmar/rechazar/completar), realtime, slot conflict |
| MonthlyCalendar | `src/components/dashboard/MonthlyCalendar.tsx` | Indirecto — recibe `pendingCountByDate` como prop (status-agnostic) |
| AgendaSummary | `src/components/dashboard/AgendaSummary.tsx` | Indirecto — recibe `pendingCount` como prop (status-agnostic) |
| BookingSuccess | `src/pages/BookingSuccess.tsx` | Renderizado de badge de estado (UPPERCASE, solo 4 de 7 mapeados) |
| DashboardClients | `src/pages/dashboard/DashboardClients.tsx` | Query filtra por `['CONFIRMED', 'COMPLETED', 'PENDING']` |
| useAgendaData | `src/hooks/useAgendaData.ts` | `ACTIVE_STATUSES`, `PENDING_STATUSES`, `mapDbStatus()`, agrupamiento |

#### 1.5 Queries que filtran por estado

| Query | Archivo | Línea | Estados filtrados |
|-------|---------|-------|-------------------|
| `.in('status', ACTIVE_STATUSES)` | `useAgendaData.ts` | 103 | `PENDING`, `CONFIRMED`, `REQUIRES_DEPOSIT` |
| `.eq('status', 'CONFIRMED')` | `DashboardAgenda.tsx` | 260 | Slot conflict check (forward) |
| `.eq('status', 'CONFIRMED')` | `DashboardAgenda.tsx` | 276 | Slot conflict check (reverse) |
| `.in('status', ['CONFIRMED', 'COMPLETED', 'PENDING'])` | `DashboardClients.tsx` | 51 | Clientes con turnos activos/completados |

**Impacto de `ACTIVE_STATUSES`:** La agenda SOLO muestra `PENDING`, `CONFIRMED`, `REQUIRES_DEPOSIT`. Los estados `CANCELLED`, `COMPLETED`, `REJECTED`, `EXPIRED` están excluidos de la vista de agenda.

#### 1.6 RPCs que escriben estados

| RPC | Archivo | Comportamiento |
|-----|---------|----------------|
| `create_public_appointment` | `appointmentService.ts:102-111` | Crea turno con estado inicial determinado por el servidor (probablemente `PENDING`). El cliente NO setea el estado. |
| `updateAppointmentStatus` (función TS) | `appointmentService.ts:178-195` | Actualiza estado directamente en tabla `appointments`. Toma `AppointmentStatus` (UPPERCASE). **No es usada por DashboardAgenda** — este usa su propia función inline `updateStatus`. |

**Nota importante:** `DashboardAgenda.tsx` NO usa `updateAppointmentStatus` del servicio. Tiene su propia implementación inline (`DashboardAgenda.tsx:171-186`) que actualiza directamente via `supabase.from('appointments').update()`.

#### 1.7 RLS / Policies afectadas

| Policy | Comando | Condición |
|--------|---------|-----------|
| `Members can view appointments` | SELECT | `is_business_member(business_id)` |
| `Members can create appointments` | INSERT | `WITH CHECK: is_business_member(business_id)` |
| `Members can update appointments` | UPDATE | `USING + WITH CHECK: is_business_member(business_id)` |

**Análisis:** No hay políticas específicas por estado. Las policies son basadas en `business_id`. Un nuevo estado `NO_SHOW` no afectaría las policies existentes. No hay DELETE policy (intencional — preservación de historial).

#### 1.8 Realtime subscriptions

**Configuración (`DashboardAgenda.tsx:148-169`):**
```typescript
const channel = supabase
  .channel('appointments-changes')
  .on('postgres_changes', {
    event: '*',           // TODOS los eventos
    schema: 'public',
    table: 'appointments',
    filter: `business_id=eq.${businessId}`,
  }, () => refetchAgenda())
  .subscribe();
```

**Impacto:** Escucha `*` (INSERT, UPDATE, DELETE) en toda la tabla `appointments` del negocio. Cualquier cambio de estado dispara un `refetchAgenda()` completo. Un nuevo estado `NO_SHOW` sería capturado automáticamente.

#### 1.9 Filtros visuales en Agenda

**Botones de filtro (`DashboardAgenda.tsx:538-551`):**
```typescript
{['all', 'pending', 'confirmed'].map((status) => (
  <button key={status} ...>
    {status === 'all' ? 'Todos' : STATUS_LABELS[status as AppointmentStatusLower]}
  </button>
))}
```

| Filtro actual | Valor | Estado visible |
|---------------|-------|----------------|
| Todos | `'all'` | Todos los activos (PENDING, CONFIRMED, REQUIRES_DEPOSIT) |
| Pendiente | `'pending'` | Solo PENDING |
| Confirmado | `'confirmed'` | Solo CONFIRMED |

**Filtros ausentes:** `requires_deposit`, `rejected`, `expired`, `cancelled`, `completed`, `no_show` (nuevo) no tienen botón de filtro.

**STATUS_LABELS (`DashboardAgenda.tsx:24-32`):**
```typescript
const STATUS_LABELS: Record<AppointmentStatusLower, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  requires_deposit: 'Requiere deposito',
  rejected: 'Rechazado',
  expired: 'Expirado',
};
```

**Badge rendering (`DashboardAgenda.tsx:593-595`, `669-671`):**
```tsx
<Badge variant={
  apt.status === 'confirmed' ? 'success' :
  apt.status === 'pending' ? 'warning' :
  'default'
}>
```

| Estado | Variant | Color |
|--------|---------|-------|
| `confirmed` | `success` | Verde |
| `pending` | `warning` | Ámbar |
| Todos los demás | `default` | Neutral |

#### 1.10 Acciones: Aceptar, Rechazar, Cancelar

**Para `pending` o `requires_deposit` (`DashboardAgenda.tsx:676-692`):**
- "Confirmar turno" → `updateStatus(id, 'confirmed')`
- "Cancelar turno" → `updateStatus(id, 'cancelled')`

**Para `confirmed` (`DashboardAgenda.tsx:693-701`):**
- "Marcar como completado" → `updateStatus(id, 'completed')`

**Flujo actual de transiciones:**
```
PENDING → CONFIRMED  (aceptar)
PENDING → CANCELLED  (cancelar)
REQUIRES_DEPOSIT → CONFIRMED  (aceptar)
REQUIRES_DEPOSIT → CANCELLED  (cancelar)
CONFIRMED → COMPLETED  (marcar como completado manualmente)
```

**Ausentes:** No hay acción para `REJECTED` desde la UI. No hay acción para `EXPIRED`. No hay acción para `NO_SHOW` (nuevo).

#### 1.11 Lógica existente alrededor de COMPLETED y EXPIRED

**COMPLETED:**
- Solo se alcanza manualmente via botón "Marcar como completado" en turnos `CONFIRMED`
- No hay lógica automática de transición
- Turnos `COMPLETED` son excluidos de la agenda (no están en `ACTIVE_STATUSES`)
- Se incluyen en la vista de clientes (`DashboardClients.tsx:51`)

**EXPIRED:**
- No hay lógica automática para transicionar a `EXPIRED`
- No hay UI para marcar manualmente como `EXPIRED`
- No hay botón de acción para este estado
- Excluido de la agenda (no está en `ACTIVE_STATUSES`)
- El estado existe en el tipo TS y en el enum DB pero está "inactivo" funcionalmente

#### 1.12 Mecanismos programados / Cron / Edge Functions

**Resultado:** Ninguno.

| Mecanismo | Estado |
|-----------|--------|
| Edge Functions | ❌ Ninguna configurada |
| Cron jobs | ❌ Ninguno |
| Triggers automáticos de estado | ❌ Solo `appointments_updated_at` (timestamp) |
| Scheduler externo | ❌ No existe |

**Implicación:** Todo el sistema de estados es completamente manual/interactivo. No hay automatización de backend para transiciones de estado.

---

### 14.2 Discrepancias Detectadas

| # | Problema | Impacto | Estado |
|---|----------|---------|--------|
| 1 | `REQUIRES_DEPOSIT` en TS types pero presencia desconocida en enum PostgreSQL | Si falta en BD, la query `.in('status', ['PENDING', 'CONFIRMED', 'REQUIRES_DEPOSIT'])` fallará al intentar escribir este valor | 🔴 **Verificar con `SELECT enum_range(NULL::appointment_status);` antes de cualquier migración** |
| 2 | Columna `expires_at` en TS types (`src/lib/supabase.ts`) pero ausente en DB | Posible schema drift — verificar si existe en BD real | 🟡 Verificar en BD |
| 3 | `service_id` y `customer_id`: TS dice `string \| null`, DB dice NOT NULL | Posible inconsistency entre tipos y esquema real | 🟡 Verificar en BD |
| 4 | `updateAppointmentStatus` en `appointmentService.ts` no es usado | Función dead-code — se centralizará en Fase 5 para evitar múltiples mecanismos de actualización de estado | 🟢 Decidido: centralizar en Fase 5 |
| 5 | `BookingSuccess.tsx` solo mapea 4 de 7 estados | `REQUIRES_DEPOSIT`, `REJECTED`, `EXPIRED` muestran raw string como fallback | 🟢 Se actualizará en Fase 5 |

---

### 14.3 Modelo de Estados — Decisiones Tomadas

#### 3.1 Diagrama de transiciones definitivo

```
                    ┌─────────────────────────────────┐
                    │         PENDING                 │
                    │    (cliente hizo reserva)       │
                    └──────────┬──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    REQUIRES_DEPOSIT    CONFIRMED          REJECTED
   (necesita seña)      (aceptado)         (rechazado)
              │                │                │
              │                │          ┌─────┴──────┐
              │                │          │  TERMINAL  │
              │                │          └────────────┘
              │                │
              │          ┌─────┴──────────┐
              │          │                │
              │          ▼                ▼
              │     COMPLETED        CANCELLED
              │  (asistió/manual)   (cancelado)
              │          │                │
              │     ┌────┴─────┐    ┌─────┴──────┐
              │     │ TERMINAL │    │  TERMINAL  │
              │     └──────────┘    └────────────┘
              │
              │          ┌─────┴──────────┐
              │          │                │
              │          ▼                ▼
              │     COMPLETED          NO_SHOW
              │  (paga seña, luego   (no asistió,
              │   manual/auto)       manual, post-fecha)
              │          │                │
              │     ┌────┴─────┐    ┌─────┴──────┐
              │     │ TERMINAL │    │  TERMINAL  │
              │     └──────────┘    └────────────┘


EXPIRED: estado terminal para solicitudes que vencieron sin acción
         (solo PENDING → EXPIRED en V1; REQUIRES_DEPOSIT → EXPIRED documentado pero fuera de alcance)
```

**Notas:**
- La transición `REQUIRES_DEPOSIT → CONFIRMED` se activará cuando se implemente la lógica de depósitos (futuro).
- `NO_SHOW` solo es transicionable manualmente desde `CONFIRMED`, y SOLO cuando el turno ya comenzó/terminó según `America/Argentina/Buenos_Aires`.
- La automatización NUNCA cambia `NO_SHOW` a otro estado.
- Las correcciones manuales (`NO_SHOW → CONFIRMED`, `NO_SHOW → COMPLETED`, etc.) están permitidas en V1 para permitir corrección de errores accidentales. No se implementará una máquina de auditoría compleja.

#### 3.2 NO_SHOW — Definición definitiva

**Origen:** `CONFIRMED`
**Tipo:** Manual (acciones del empleado/negocio)
**Condición de disponibilidad:** El turno ya comenzó o terminó según `America/Argentina/Buenos_Aires`
**Estado terminal:** Sí (pero con correcciones manuales permitidas)
**Flujo:** `CONFIRMED` → `NO_SHOW` (manual)
**Correcciones permitidas:** `NO_SHOW` → `CONFIRMED` o `NO_SHOW` → `COMPLETED` (manual, desde el detalle del turno)

**Regla de automatización:**
- La automatización NUNCA debe cambiar un estado `NO_SHOW` a `COMPLETED` u otro.
- `NO_SHOW` es exclusivamente una decisión humana.

**UI propuesta:**
- En el detalle del turno, si el turno es `CONFIRMED` y la fecha/hora ya pasó:
  - Mostrar DOS botones: "Marcar como completado" (`COMPLETED`) y "Marcar como no asistió" (`NO_SHOW`)
- Badge visual: variante `danger` (rojo) — indica pérdida de ingreso
- Si el turno ya está en `NO_SHOW`, mostrar botón de corrección: "Corregir → Completado" o "Corregir → Confirmado"

#### 3.3 COMPLETED — Dos vías válidas

**Vía 1 — Manual:** El empleado marca `CONFIRMED` → `COMPLETED` después de que el turno haya ocurrido (desde el detalle del turno).

**Vía 2 — Automática:** Si el empleado no hizo nada, `CONFIRMED` → `COMPLETED` automáticamente al comenzar el día siguiente (según `America/Argentina/Buenos_Aires`).

**Ambas vías son válidas y coexisten.** La vía manual permite cierre inmediato; la automática evita que los turnos queden eternamente en `CONFIRMED`.

#### 3.4 Regla Temporal de COMPLETED y EXPIRED — Concepto de "Día de Negocio"

**Concepto clave:** La transición no se decide por `start_at < now()` ni por `start_at < todayStr`. Se decide por el **día de negocio actual en `America/Argentina/Buenos_Aires`**.

**Regla conceptual:**

```
Día de negocio = YYYY-MM-DD en America/Argentina/Buenos_Aires

Turno: 03/09/2026 18:00 CONFIRMED
  03/09 (día de negocio = 03/09): continúa CONFIRMED
  04/09 (día de negocio = 04/09, el turno fue en día anterior): → COMPLETED

Turno: 03/09/2026 18:00 PENDING
  03/09 (día de negocio = 03/09): continúa PENDING
  04/09 (día de negocio = 04/09, el turno fue en día anterior): → EXPIRED
```

**Implementación de comparación segura:**

⚠️ **NO usar:** `${todayStr}T00:00:00` como string suelto en queries — PostgreSQL puede interpretarlo en la timezone del servidor (UTC), no en `America/Argentina/Buenos_Aires`.

⚠️ **NO usar:** `start_at < now()` — esto compara con el instante actual, no con el día de negocio. Un turno de 18:00 a las 12:00 del mismo día no debería transicionar.

✅ **Opción segura 1 — Conversión explícita a UTC en la query:**
```sql
-- Calcular midnight de hoy en Buenos Aires y convertir a UTC explícitamente
WHERE status = 'CONFIRMED'
  AND start_at < (
    ('YYYY-MM-DD' || 'T00:00:00 America/Argentina/Buenos_Aires')::timestamptz
  )
```

✅ **Opción segura 2 — Usar `AT TIME ZONE` en PostgreSQL:**
```sql
WHERE status = 'CONFIRMED'
  AND start_at < ('YYYY-MM-DD'::date)::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'
```

✅ **Opción segura 3 — Calcular el threshold en la Edge Function (TypeScript) usando helpers existentes:**
```typescript
// Usar getTodayInTimezone('America/Argentina/Buenos_Aires') para obtener YYYY-MM-DD
// Luego usar buildTimestampISO o equivalente para convertir a UTC ISO string correctamente
// Pasar el ISO string a la query Supabase (que lo trata como UTC)
```

**Recomendación:** Usar la **Opción 3** (calcular en TypeScript con helpers existentes) para mantener consistencia con el resto del proyecto. Los helpers de `dateTime.ts` ya manejan correctamente la conversión de `America/Argentina/Buenos_Aires` a UTC ISO strings.

**Ejemplo de regla correcta:**
```
Turno: 02/09/2026 18:00 — CONFIRMED
02/09 (día de negocio = 02/09, turno es de hoy): permanece CONFIRMED
03/09 (día de negocio = 03/09, turno fue ayer): → COMPLETED automáticamente
```

#### 3.5 EXPIRED — Alcance V1

**V1 (implementación actual):**
- `PENDING` → `EXPIRED`: Si un turno pendiente pasó su horario sin ser aceptado/rechazado
- **NO implementar todavía:** `REQUIRES_DEPOSIT` → `EXPIRED`

**Futuro (fuera de alcance V1):**
- `REQUIRES_DEPOSIT` → `EXPIRED`: Si el depósito no se pagó antes del horario del turno
- Esta transición depende de la lógica de depósitos (pagos, señas, etc.) que no se implementará en esta fase.

**Condición para `PENDING` → `EXPIRED`:** El día de negocio actual en `America/Argentina/Buenos_Aires` es posterior al día del turno (`start_at`). Es decir, si el turno fue en un día anterior al día de negocio actual → EXPIRED.

**Implementación:** La misma Edge Function de auto-completado manejará esta transición.

#### 3.6 Flujo Futuro de Depósitos (Documentación, NO Implementar Ahora)

**Servicio sin depósito obligatorio:**
```
reserva → PENDING → CONFIRMED
```

**Servicio con depósito obligatorio (futuro):**
```
reserva → REQUIRES_DEPOSIT → pago de seña → CONFIRMED
```

**No implementar todavía:**
- ❌ `requires_deposit` en services
- ❌ `deposit_amount`
- ❌ `deposit_percentage`
- ❌ `deposit_status`
- ❌ Mercado Pago
- ❌ Stripe
- ❌ Cualquier lógica de pagos

**Solo asegurar:** La arquitectura de estados no bloquee esa futura evolución. El estado `REQUIRES_DEPOSIT` ya existe en los tipos TS y se mantendrá preparado.

#### 3.7 Estados Terminales — V1

**Estados terminales:**
- `COMPLETED`
- `NO_SHOW`
- `CANCELLED` (terminal estricto en V1)
- `REJECTED`
- `EXPIRED`

**Correcciones manuales permitidas en V1:**

Para permitir corrección de errores accidentales sin romper el historial, se permitirá cambiar manualmente desde un estado terminal a otro relevante:

| Desde | Posibles correcciones a |
|-------|------------------------|
| `NO_SHOW` | `CONFIRMED`, `COMPLETED` |
| `COMPLETED` | `NO_SHOW` (si se marcó incorrectamente) |

**NO implementar en V1:**
- `CANCELLED` → cualquier corrección. `CANCELLED` es terminal estricto en V1.
- No se implementará una máquina de auditoría compleja. Solo un botón de "Corregir estado" en el detalle del turno que muestre las transiciones válidas según el estado actual.

#### 3.8 Agenda y Calendario Histórico — Arquitectura de Datasets

**Principio:** NO ocultar días históricos. El calendario mensual DEBE poder contar turnos históricos aunque estén en COMPLETED, NO_SHOW, CANCELLED, EXPIRED, REJECTED.

**Arquitectura de datasets diferenciados:**

| Dataset | Estados incluidos | Uso |
|---------|------------------|-----|
| **Calendario histórico** | TODOS los estados (incluye COMPLETED, NO_SHOW, CANCELLED, EXPIRED, REJECTED) | Conteo de turnos por fecha en el calendario mensual |
| **Turnos activos de agenda** | PENDING, CONFIRMED, REQUIRES_DEPOSIT | Lo que se muestra en la lista de agenda |
| **Turnos cargados del rango** | PENDING, CONFIRMED, REQUIRES_DEPOSIT (por defecto) | Lo que se carga al abrir la agenda (configurable por filtro) |

**El calendario NO utiliza `ACTIVE_STATUSES` para sus conteos.** Debe consultar todos los estados para contar turnos históricos.

**Ejemplo de comportamiento:**
```
Hoy: 04/09/2026

Calendario mensual:
  03/09 → 5 turnos (ej: 3 COMPLETED + 1 NO_SHOW + 1 CANCELLED)
  02/09 → 3 turnos (ej: 2 COMPLETED + 1 EXPIRED)
  01/09 → 4 turnos (ej: 4 COMPLETED)

Agenda:
  "Pendientes" contador = solo PENDING + REQUIRES_DEPOSIT de hoy/futuro
  Lista de turnos = configurable por filtros semánticos
```

**Implementación técnica:**
- `useAgendaData` debe cargar turnos del rango de fechas para la agenda (activos por defecto)
- Un hook separado o función para los conteos del calendario mensual debe consultar TODOS los estados
- `MonthlyCalendar.tsx` debe recibir counts que incluyan todos los estados, no solo activos

#### 3.9 Filtros — Agrupaciones Semánticas

**Decisión:** No crear un botón individual para cada estado (degradaría la UX).

**Agrupaciones semánticas propuestas:**

| Filtro | Estados incluidos |
|--------|-------------------|
| Todos | Todos los estados |
| Requieren atención | `PENDING`, `REQUIRES_DEPOSIT` |
| Confirmados | `CONFIRMED` |
| Finalizados | `COMPLETED`, `NO_SHOW`, `CANCELLED`, `EXPIRED`, `REJECTED` |

**Razonamiento:**
- "Requieren atención" agrupa lo que el empleado debe hacer ahora.
- "Confirmados" muestra los turnos agendados activos.
- "Finalizados" agrupa todo lo que ya ocurrió (independientemente del resultado).
- "Todos" mantiene acceso a todos los estados.

**Futuro:** Si se necesitan filtros más granulares, se puede agregar un menú desplegable o tabs adicionales.

---

### 14.4 Impacto por Archivo

#### Archivos que necesitarían cambios (Fase 2+)

| Archivo | Cambio necesario | Estado actual |
|---------|-----------------|---------------|
| `src/types/index.ts` | Agregar `'NO_SHOW'` a `AppointmentStatus` y `'no_show'` a `AppointmentStatusLower` | 7 estados en cada tipo |
| `src/lib/supabase.ts` | Agregar `'NO_SHOW'` a los tipos inline de la tabla `appointments` | 7 estados en cada tipo |
| `src/hooks/useAgendaData.ts` | Agregar `'no_show'` a `mapDbStatus()`, actualizar `ACTIVE_STATUSES` si NO_SHOW debe mostrarse, actualizar lógica de filtros semánticos, **separar lógica de conteos del calendario (todos los estados) de la lógica de turnos de agenda (activos)** | 7 mapeos en `mapDbStatus` |
| `src/pages/dashboard/DashboardAgenda.tsx` | Agregar `'no_show'` a `STATUS_LABELS`, agregar botón de acción NO_SHOW, actualizar badge variant, actualizar filtros a agrupaciones semánticas (Todos, Requieren atención, Confirmados, Finalizados), agregar botón de corrección de estado para terminales (NO_SHOW, COMPLETED), **usar `updateAppointmentStatus` centralizado** | 3 filtros lineales, 2 badge variants |
| `src/components/dashboard/MonthlyCalendar.tsx` | **Asegurar que los conteos del calendario incluyan TODOS los estados** (COMPLETED, NO_SHOW, CANCELLED, EXPIRED, REJECTED), no solo `ACTIVE_STATUSES` | Status-agnostic, recibe counts como props |
| `src/pages/BookingSuccess.tsx` | Agregar `'NO_SHOW'` al mapa de labels, actualizar badge rendering, agregar los 3 estados faltantes (`REQUIRES_DEPOSIT`, `REJECTED`, `EXPIRED`) | 4 de 7 mapeados |
| `src/pages/dashboard/DashboardClients.tsx` | Considerar agregar `NO_SHOW` a la query de estados | Filtra `['CONFIRMED', 'COMPLETED', 'PENDING']` |
| `src/services/appointmentService.ts` | **Centralizar transiciones de estado:** migrar la función inline `updateStatus` de `DashboardAgenda.tsx` a `updateAppointmentStatus` del servicio. Agregar validación de transiciones válidas. | Función existe pero no se usa |
| **NUEVO** | **Edge Function** para auto-completado y auto-expirado | No existe |
| **NUEVO** | **Migración DB** para agregar `'NO_SHOW'` al enum `appointment_status` (y posiblemente `REQUIRES_DEPOSIT` si falta) | Enum actual tiene 6-7 valores |

#### Archivos que NO necesitarían cambios

| Archivo | Razón |
|---------|-------|
| `src/utils/dateTime.ts` | Helpers de fecha son genéricos, no dependen de estados |
| `src/utils/helpers.ts` | Re-exports de dateTime |
| `src/components/dashboard/MonthlyCalendar.tsx` | **NECESITA CAMBIO:** debe asegurar que los conteos incluyan TODOS los estados, no solo activos | Recibe counts como props |
| `src/components/dashboard/AgendaSummary.tsx` | Status-agnostic (solo recibe counts como props) |
| `src/services/appointmentService.ts` | **NECESITA CAMBIO:** centralización de transiciones de estado + validación de transiciones válidas (Fase 5) | Función existe pero no se usa |
| RLS policies | Basadas en `business_id`, no en estado |
| Realtime subscription | Escucha `*`, captura automáticamente nuevos estados |

---

### 14.5 Plan de Implementación por Fases

#### Fase 1: Análisis y planificación (ACTUAL)
- ✅ Inspección completa del sistema de estados
- ✅ Mapeo de uso en frontend, servicios y BD
- ✅ Documentación de hallazgos y discrepancias
- ✅ Propuesta de nuevo modelo de estados
- ✅ Definición de regla de auto-completado
- ✅ Decisiones sobre filtros semánticos, correcciones manuales, centralización de estado

#### Fase 2: Base de datos y tipos
- [ ] **Verificar enum `appointment_status` real en BD:** `SELECT enum_range(NULL::appointment_status);`
- [ ] **Verificar existencia de columna `expires_at` en BD**
- [ ] **Verificar nullability de `service_id` y `customer_id` en BD**
- [ ] **Migración:** agregar `'NO_SHOW'` al enum `appointment_status`
- [ ] **Migración (condicional):** agregar `'REQUIRES_DEPOSIT'` al enum `appointment_status` SOLO si `SELECT enum_range` confirma que falta
- [ ] Actualizar TypeScript types en `src/types/index.ts`
- [ ] Actualizar TypeScript types en `src/lib/supabase.ts`

#### Fase 3: Frontend — UI de estados y filtros
- [ ] Agregar `'no_show'` a `mapDbStatus()` en `useAgendaData.ts`
- [ ] Agregar `'no_show'` a `STATUS_LABELS` en `DashboardAgenda.tsx`
- [ ] Actualizar filtros a agrupaciones semánticas: Todos, Requieren atención, Confirmados, Finalizados
- [ ] Agregar botón "No asistió" en detalle de turno (para CONFIRMED post-fecha)
- [ ] Agregar badge variant `danger` para `no_show`
- [ ] Agregar botón de "Corregir estado" para estados terminales (NO_SHOW, COMPLETED, CANCELLED)
- [ ] Agregar `'no_show'` a labels en `BookingSuccess.tsx`
- [ ] Agregar los 3 estados faltantes a `BookingSuccess.tsx`: `REQUIRES_DEPOSIT`, `REJECTED`, `EXPIRED`
- [ ] Considerar agregar `NO_SHOW` a query de `DashboardClients.tsx`

#### Fase 4: Backend — Scheduler y auto-estados
- [ ] **Verificar disponibilidad de pg_cron / Supabase Schedule en el proyecto**
- [ ] **Si pg_cron disponible → configurar job diario a las 00:05**
- [ ] **Si pg_cron no disponible → crear Edge Function `auto-update-statuses` con cron diario**
- [ ] Lógica: `CONFIRMED` de ayer → `COMPLETED` (ventana de ayer, no "todos los anteriores")
- [ ] Lógica: `PENDING` de ayer → `EXPIRED` (V1: solo PENDING)
- [ ] **NO incluir:** `REQUIRES_DEPOSIT` → `EXPIRED` (fuera de alcance V1)
- [ ] Ventana de procesamiento: solo el día anterior (idempotente)
- [ ] Frecuencia: diaria a las 00:05 (no polling horario)
- [ ] Testing del scheduler

#### Fase 5: Centralización y optimización
- [ ] **Centralizar transiciones de estado en `appointmentService.ts`:** migrar función inline `updateStatus` de `DashboardAgenda.tsx` a `updateAppointmentStatus` del servicio
- [ ] Agregar validación de transiciones válidas en `updateAppointmentStatus`:
  - `PENDING` → `CONFIRMED`, `REJECTED`, `CANCELLED`
  - `REQUIRES_DEPOSIT` → `CONFIRMED`, `CANCELLED`
  - `CONFIRMED` → `COMPLETED`, `NO_SHOW`
  - `NO_SHOW` → `CONFIRMED`, `COMPLETED`
  - `COMPLETED` → `NO_SHOW`
  - (V1: `CANCELLED` no tiene correcciones)
- [ ] Actualizar `DashboardAgenda.tsx` para usar `updateAppointmentStatus` en lugar de actualización directa
- [ ] Actualizar `BookingSuccess.tsx` para mapear los 3 estados faltantes si aún no se hizo en Fase 3
- [ ] Considerar agregar `NO_SHOW` a `ACTIVE_STATUSES` si se quiere mostrar en la agenda
- [ ] Documentar el nuevo modelo de estados en el README o docs del proyecto

---

### 14.6 Decisiones Tomadas

| Decisión | Decisión tomada |
|----------|----------------|
| Badge color para NO_SHOW | `danger` (rojo) — indica pérdida de ingreso |
| NO_SHOW en filtros de agenda | Excluir de `ACTIVE_STATUSES` — es estado terminal |
| Filtros de agenda | Agrupaciones semánticas: Todos, Requieren atención, Confirmados, Finalizados |
| Correcciones manuales desde terminales | Permitidas: NO_SHOW → CONFIRMED/COMPLETED, COMPLETED → NO_SHOW |
| Correcciones desde CANCELLED | **NO en V1** — CANCELLED es terminal estricto |
| EXPIRED para PENDING vencidos | Sí — en V1 solo `PENDING` → `EXPIRED` |
| EXPIRED para REQUIRES_DEPOSIT vencidos | Documentado pero fuera de alcance V1 |
| Centralización de transiciones de estado | Sí — en `updateAppointmentStatus` de `appointmentService.ts` (Fase 5) |
| NO_SHOW automatización | NUNCA — exclusivamente manual |
| Calendario histórico | NO ocultar días históricos; conteos incluyen TODOS los estados |
| Dataset diferenciado | Calendario = todos los estados; Agenda = activos por defecto; Rango = configurable |
| Transición por día de negocio | Se decide por día de negocio en BA, NO por `start_at < now()` |

### 14.7 Decisiones Pendientes

| Decisión | Opciones | Próximo paso |
|----------|----------|-------------|
| Scheduler: Edge Function vs pg_cron vs Supabase Schedule | Evaluar qué está disponible en el proyecto actual | Verificar extensiones y opciones en Fase 4 |
| Frecuencia del scheduler | Diario a medianoche (recomendado) vs cada 1h vs cada 6h | Diario es suficiente: la regla es por día de negocio, no por instante |
| REQUIRES_DEPOSIT → CONFIRMED | Implementar en Fase 2 o posterior | Posterior — no es crítico para la evolución de estados |

---

### 14.8 Scheduler — Evaluación de Opciones

**Criterios de selección:** más simple, más económica, segura, idempotente, fácil de mantener.

**La regla de auto-estados es por día de negocio, no por instante.** Un turno de las 18:00 que se procese a las 00:01 del día siguiente es correcto. No hay necesidad de polling horario innecesario.

#### Opción A: Supabase Schedule (pg_cron wrapper)

**Ventajas:**
- Más simple: SQL directo, UI en Supabase Dashboard
- Sin coding adicional
- Ejecución dentro del motor de BD
- Sin costo adicional por ejecución
- Frecuencia configurable fácilmente

**Desventajas:**
- Requiere habilitar la extensión `pg_cron` en el proyecto Supabase
- Lógica en SQL puro (no reutiliza helpers TypeScript)
- Logging más limitado

**Requisito:** `CREATE EXTENSION IF NOT EXISTS pg_cron;` + configurar el job.

**SQL ejemplo:**
```sql
-- Ejecutar cada día a las 00:05
SELECT cron.schedule(
  'auto-update-statuses',
  '5 0 * * *',  -- cada día a las 00:05
  $$
    UPDATE appointments
    SET status = 'COMPLETED'
    WHERE status = 'CONFIRMED'
      AND start_at < (CURRENT_DATE - 1)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'
      AND start_at >= (CURRENT_DATE - 2)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires';

    UPDATE appointments
    SET status = 'EXPIRED'
    WHERE status = 'PENDING'
      AND start_at < (CURRENT_DATE - 1)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'
      AND start_at >= (CURRENT_DATE - 2)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires';
  $$
);
```

#### Opción B: Edge Function con cron

**Ventajas:**
- Más flexible: lógica TypeScript completa, fácil de testear
- Acceso a helpers existentes (`dateTime.ts`) para conversión timezone-safe
- Logging y error handling más rico
- No requiere habilitar extensiones adicionales

**Desventajas:**
- Requiere coding (implementar la function)
- Costo por ejecución (aunque mínimo para queries simples)
- Dependencia de la infraestructura de Edge Functions de Supabase
- Overkill para una lógica que solo necesita ejecutarse una vez al día

**Costo estimado:** Supabase Edge Functions tienen ~1M requests/mes gratuitos. Ejecución diaria = ~365 ejecuciones/mes. Dentro del plan gratuito.

#### Opción C: pg_cron directo (sin wrapper)

**Ventajas:**
- Igual que Supabase Schedule pero con control SQL directo
- Más simple que Edge Function

**Desventajas:**
- Requiere habilitar la extensión `pg_cron`
- Mismas limitaciones de logging

#### Recomendación

**Evaluar en Fase 4:**

1. Primero verificar si `pg_cron` está disponible/habilitable en el proyecto Supabase actual.
2. **Si pg_cron está disponible → usar pg_cron o Supabase Schedule.** Es la opción más simple y económica para una lógica que solo necesita ejecutarse una vez al día.
3. **Si pg_cron NO está disponible → usar Edge Function** con cron diario (`0 5 * * *` = 00:05 UTC = ~02:05 BA, o ajustar según offset).
4. **Frecuencia:** Ejecución diaria a las 00:05 es suficiente. La regla es por día de negocio, no por instante. Un turno de las 23:59 que se procese a las 00:06 del día siguiente es correcto.

**La ejecución diaria es preferible al polling horario:** no hay valor en ejecutar cada hora una tarea que solo necesita ejecutarse una vez al día.

---

### 14.9 Auto-Completado — Especificación Técnica Definitiva

**Scheduler:** Ejecución diaria a las 00:05 (hora local del servidor, preferiblemente UTC). La regla es por día de negocio, no por instante.

**Frecuencia:** Diaria. No hay necesidad de polling horario.

**Opción preferida (si pg_cron disponible):** Supabase Schedule / pg_cron con SQL directo.

**Opción alternativa (si pg_cron no disponible):** Edge Function con cron diario.

#### Pseudocódigo para Edge Function (alternativa)

```typescript
// Pseudocódigo definitivo de la Edge Function (solo si pg_cron no está disponible)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, service_role_key)

// 1. Obtener fecha de ayer en timezone del negocio usando helpers existentes
//    (ayer = día de negocio procesado)
const yesterdayStr = getYesterdayInTimezone('America/Argentina/Buenos_Aires')  // YYYY-MM-DD

// 2. Calcular threshold UTC-safe usando helpers de dateTime.ts
const yesterdayStartISO = buildTimestampISO(yesterdayStr, '00:00:00')
const todayStartISO = buildTimestampISO(getTodayInTimezone('America/Argentina/Buenos_Aires'), '00:00:00')

// 3. Turnos CONFIRMED de ayer → COMPLETED
const { data: completed, error: completedError } = await supabase
  .from('appointments')
  .update({ status: 'COMPLETED' })
  .eq('status', 'CONFIRMED')
  .gte('start_at', yesterdayStartISO)  // desde ayer 00:00 UTC
  .lt('start_at', todayStartISO)       // hasta hoy 00:00 UTC
  .select()

// 4. Turnos PENDING de ayer → EXPIRED (V1: solo PENDING, NO REQUIRES_DEPOSIT)
const { data: expired, error: expiredError } = await supabase
  .from('appointments')
  .update({ status: 'EXPIRED' })
  .eq('status', 'PENDING')  // V1: solo PENDING
  .gte('start_at', yesterdayStartISO)  // desde ayer 00:00 UTC
  .lt('start_at', todayStartISO)       // hasta hoy 00:00 UTC
  .select()

// 5. Logging
console.log(`Auto-completed: ${completed?.length || 0}, Auto-expired: ${expired?.length || 0}`)
```

#### SQL para pg_cron / Supabase Schedule (preferido si disponible)

```sql
-- Ejecutar cada día a las 00:05
-- Procesa turnos del día anterior (ayer)

-- CONFIRMED de ayer → COMPLETED
UPDATE appointments
SET status = 'COMPLETED',
    updated_at = NOW()
WHERE status = 'CONFIRMED'
  AND start_at >= (CURRENT_DATE - 1)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'
  AND start_at <  CURRENT_DATE::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires';

-- PENDING de ayer → EXPIRED (V1: solo PENDING)
UPDATE appointments
SET status = 'EXPIRED',
    updated_at = NOW()
WHERE status = 'PENDING'
  AND start_at >= (CURRENT_DATE - 1)::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'
  AND start_at <  CURRENT_DATE::date::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires';
```

**Consideraciones críticas:**

| Aspecto | Requisito |
|---------|-----------|
| Timezone | `America/Argentina/Buenos_Aires` explícita en toda comparación |
| Ventana de procesamiento | Solo el día anterior (ayer), no "todos los días anteriores" — idempotente |
| Idempotencia | UPDATE en turnos ya completados es seguro (WHERE status = 'CONFIRMED' previene re-procesamiento) |
| RLS | Usar `service_role_key` para bypass de RLS (function corre con privilegios de servicio) |
| Error handling | Si una query falla, loguear pero NO romper la otra |
| Frecuencia | Diaria a las 00:05 (preferido) |
| NO_SHOW | NUNCA tocar estados NO_SHOW |
| REQUIRES_DEPOSIT | NO incluir en auto-expirado (fuera de alcance V1) |
| CANCELLED | NO tocar estados CANCELLED |

**Cron configuration (Supabase Dashboard / pg_cron):**
```
Schedule: 5 0 * * *  (cada día a las 00:05)
Target: auto-update-statuses (Edge Function) o SQL directo (pg_cron)
```
