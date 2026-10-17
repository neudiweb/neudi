# Neudi — Turnos para tu negocio

Neudi es un SaaS argentino que ayuda a pequeños negocios de servicios a gestionar turnos online.

## Stack

- **React 19** con TypeScript
- **Vite** como bundler
- **React Router DOM v7** para routing
- Estilos inline (CSS-in-JS) — sin dependencias CSS externas
- **Playwright** para tests E2E

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abri [http://localhost:5173](http://localhost:5173)

## Build de producción

```bash
npm run build
```

El output se genera en `dist/`.

## Preview local

```bash
npm run preview
```

## Tests E2E con Playwright

```bash
# Ejecutar todos los tests
npx playwright test

# Modo UI interactiva
npx playwright test --ui

# Un solo test
npx playwright test -g "TEST 1"
```

## Estructura del proyecto

```
src/
├── components/       # Componentes reutilizables
│   ├── ui/           # Botones, inputs, badges, modales
│   └── booking/      # Pasos del flujo de reserva
├── pages/            # Páginas principales
│   ├── PublicPage.tsx        # Página pública del negocio
│   ├── BookingPage.tsx       # Flujo de reserva (6 pasos)
│   └── DashboardPage.tsx     # Dashboard del negocio
├── layouts/          # Layouts (AppLayout, DashboardLayout)
├── data/             # Datos mock (negocio, servicios, horarios, turnos)
├── services/         # Servicios mock (simulan API backend)
│   ├── businessService.ts
│   └── appointmentService.ts
├── hooks/            # Hooks personalizados
│   └── useAvailability.ts    # Lógica de cálculo de disponibilidad
├── types/            # Tipos TypeScript compartidos
│   └── index.ts
├── utils/            # Utilidades (formato moneda, fechas)
│   └── formatCurrency.ts
├── config/           # Configuración centralizada
│   └── env.ts
└── App.tsx           # Router principal
```

## Datos mock

El proyecto usa datos ficticios para desarrollo:

- **Negocio demo**: "Peluquería Juan" en Buenos Aires, Argentina
- **Servicios**: Corte ($8.000), Corte + Barba ($10.000), Color ($25.000)
- **Turnos mock**: Varios turnos con diferentes estados (PENDING, CONFIRMED, REJECTED, etc.)

Los datos están en `src/data/` y se acceden a través de servicios mock en `src/services/`.

## Flujo de reserva

El flujo tiene 6 pasos:

1. **Servicio** — Elegir entre los servicios disponibles
2. **Fecha** — Seleccionar una fecha (solo días con horario)
3. **Horario** — Ver horarios disponibles (calculados en base a duración del servicio + turnos existentes)
4. **Tus datos** — Formulario: nombre*, teléfono*, email*, notas opcionales
5. **Resumen** — Revisar todos los detalles antes de confirmar
6. **Confirmación** — "Solicitud enviada" con estado PENDIENTE

### Lógica de disponibilidad

La función `getBookedSlots()` en `src/services/appointmentService.ts`:

1. Calcula todos los slots posibles para el servicio seleccionado (de apertura a cierre, en intervalos de 30 min)
2. Para cada slot, verifica si hay un turno mock existente que lo solape
3. Un slot se marca como no disponible si: `slotStart < aptEnd && aptStart < slotEnd`
4. Los turnos REJECTED/CANCELLED/EXPIRED no bloquean slots

## Páginas

### Página pública (`/business/peluqueria-juan`)

Hero con nombre del negocio, ubicación y CTA. Servicios con precios y duración. Horarios de atención.

### Reserva (`/business/peluqueria-juan/reservar`)

Flujo de 6 pasos con barra de progreso. Datos validados en frontend. Al confirmar, crea un turno mock con estado `PENDING` y `expiresAt: Date.now() + 15min`.

### Dashboard (`/dashboard`)

Panel del negocio con sidebar de navegación. Vista principal: Agenda con todos los turnos mock. Cada turno muestra hora, servicio, cliente y estado. Click en turno abre detalle con opciones: Confirmar, Rechazar, Requerir seña.

## Variables de entorno

Crear `.env` basado en `.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

La aplicación funciona completamente sin estas variables (usa datos mock).

## Conexión con Supabase (futuro)

Los servicios en `src/services/` están diseñados para ser reemplazables:

1. Instalar `@supabase/supabase-js`
2. Reemplazar las funciones que leen de arrays mock por llamadas a Supabase
3. El tipo `Appointment` y otros tipos existentes pueden usarse directamente
4. No se necesita cambiar la estructura del frontend — solo los servicios

Ver `docs/ARCHITECTURE.md` para más detalles técnicos.

## Reglas de implementación

- NO backend propio
- NO pagos
- NO WhatsApp
- NO empleados con agenda individual
- NO suscripciones
- NO IA
- NO modificar Supabase directamente
