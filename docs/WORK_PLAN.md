# Neudi — Plan de Trabajo

## Principios

1. **Seguridad primero** — RLS y permisos deben ser correctos antes de cualquier funcionalidad nueva.
2. **Datos reales sobre mocks** — Conectar todo el frontend a Supabase antes de agregar features.
3. **Reservas funcionando** — El flujo principal (público) debe estar 100% operativo.
4. **Dashboard funcional** — Cada sección del dashboard debe funcionar con datos reales.
5. **UI/UX como último paso** — Una vez que todo funcione, mejorar la experiencia visual.

---

## Fase 1: Verificar y Corregir RLS (Seguridad)

### 1.1 Verificar políticas RLS existentes
- [x] Confirmar que todas las tablas tienen RLS habilitado (`SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)`)
- [x] Verificar que NO existe `FORCE ROW LEVEL SECURITY` en tablas públicas (businesses, services, business_hours, business_exceptions)
- [x] Verificar que las políticas de lectura pública permiten acceso a `anon` y `authenticated`

### 1.2 Corregir RLS si es necesario
- [x] Asegurar que `public_read_businesses` permite SELECT para anon/authenticated sin condiciones restrictivas
- [x] Asegurar que `public_read_services` permite SELECT para anon/authenticated con condición `is_active = true`
- [x] Asegurar que `public_read_business_hours` permite SELECT para anon/authenticated con condición `is_active = true`
- [x] Asegurar que `public_read_business_exceptions` permite SELECT para anon/authenticated sin condiciones restrictivas

### 1.3 Verificar permisos de funciones RPC
- [x] Confirmar que `create_public_appointment`, `get_available_slots` y `auto_find_or_create_customer` tienen `SECURITY DEFINER`
- [x] Confirmar que los roles `anon` y `authenticated` tienen `EXECUTE` sobre estas funciones

---

## Fase 2: Conectar Dashboard a Datos Reales (Integración)

### 2.1 Agenda del Dashboard
- [x] Verificar si `useBusinessAppointments` usa query directa o mock data
- [x] Si es mock → reemplazar con llamada real a Supabase: `SELECT * FROM appointments WHERE business_id = $1 ORDER BY start_at DESC`
- [x] Asegurar que la consulta respeta RLS (el usuario debe ser miembro del negocio)

### 2.2 Reservas del Dashboard
- [x] Verificar si el CRUD de reservas está conectado a Supabase
- [x] Implementar `updateAppointmentStatus` → `UPDATE appointments SET status = $1 WHERE id = $2 AND business_id = $3`
- [x] Implementar cancelación real (SET status = 'CANCELLED')

### 2.3 Clientes del Dashboard
- [x] Verificar si la lista de clientes usa datos reales o mock
- [x] Si es mock → reemplazar con: `SELECT * FROM customers WHERE business_id = $1 ORDER BY created_at DESC`
- [x] Verificar que `createCustomer` inserta en tabla real

### 2.4 Servicios del Dashboard
- [x] Verificar si el CRUD de servicios está conectado a Supabase
- [x] Implementar `createService` → `INSERT INTO services (business_id, name, description, duration_minutes, price) VALUES (...)`
- [x] Implementar `updateService` → `UPDATE services SET ... WHERE id = $1 AND business_id = $2`
- [x] Implementar `deleteService` → `UPDATE services SET is_active = false WHERE id = $1 AND business_id = $2` (soft delete)

### 2.5 Horarios del Dashboard
- [x] Verificar si la carga de horarios usa datos reales o mock
- [x] Si es mock → reemplazar con: `SELECT * FROM business_hours WHERE business_id = $1 ORDER BY day_of_week`
- [x] Implementar CRUD completo (crear, editar, eliminar horarios)

### 2.6 Excepciones del Dashboard
- [x] Verificar si la carga de excepciones usa datos reales o mock
- [x] Si es mock → reemplazar con: `SELECT * FROM business_exceptions WHERE business_id = $1 ORDER BY date DESC`
- [x] Implementar CRUD completo (crear, editar, eliminar excepciones)

---

## Fase 3: Validaciones del Flujo Público

### 3.1 Validación de horarios en frontend
- [x] Asegurar que el frontend envía `start_at` y `end_at` como timestamps UTC (ISO string)
- [x] Calcular automáticamente `end_at = start_at + service.duration_minutes`
- [x] Mostrar error si el slot ya no está disponible al confirmar

### 3.2 Manejo de errores en creación de reservas
- [x] Capturar y mostrar mensajes de error del RPC (`error`, `message`)
- [x] Manejar caso de "slot ya reservado" (race condition)
- [x] Mostrar confirmación visual tras reserva exitosa con appointment_id

### 3.3 Datos del cliente en el formulario público
- [x] Validar que nombre y teléfono no estén vacíos antes de enviar
- [x] Validar formato de email si se proporciona
- [x] No permitir crear reserva sin datos mínimos del cliente

---

## Fase 4: Datos de Prueba (Configuración Inicial)

### 4.1 Configurar negocio de prueba completo
- [ ] Asegurar que "Peluquería Juan" tiene horarios semanales configurados en `business_hours`
- [ ] Agregar servicios de ejemplo en la tabla `services`:
  - Corte de cabello (30 min, precio)
  - Barba (20 min, precio)
  - Corte + Barba (50 min, precio)
  - Tinte (90 min, precio)

### 4.2 Verificar flujo end-to-end
- [ ] Navegar a `/reservar/peluqueria-juan` como usuario no autenticado
- [ ] Seleccionar servicio → fecha → horario → datos del cliente
- [ ] Crear reserva exitosamente
- [ ] Verificar que la reserva aparece en el dashboard (como owner)

---

## Fase 5: Mejoras de UX/UI

### 5.1 Página pública
- [ ] Agregar loading states durante carga de servicios y horarios
- [ ] Mostrar mensaje claro si no hay slots disponibles para una fecha
- [ ] Agregar confirmación visual tras reserva exitosa (página de éxito con detalles)
- [ ] Agregar estado de error amigable si la reserva falla

### 5.2 Dashboard
- [ ] Agregar loading states en todas las secciones
- [ ] Agregar empty states cuando no hay datos
- [ ] Mejorar feedback visual al crear/editar/eliminar registros
- [ ] Agregar confirmación antes de acciones destructivas (eliminar servicio, cancelar reserva)

---

## Priorización Resumen

| Fase | Qué | Por qué | Antes de | Estado |
|------|-----|---------|----------|--------|
| 1 | Verificar RLS | Seguridad — sin esto, datos expuestos | Cualquier otra cosa | ✅ COMPLETADA |
| 2 | Conectar dashboard | Datos reales sobre mocks | Fase 3 y 5 | ✅ COMPLETADA |
| 3 | Validar flujo público | Reservas funcionando correctamente | Fase 5 | ✅ COMPLETADA |
| 4 | Datos de prueba | Poder probar end-to-end | Cualquier testing | Pendiente |
| 5 | Mejoras UX/UI | Experiencia del usuario | Cuando todo funcione | Pendiente |

---

## Riesgos Identificados

### Alto
- **RLS mal configurado:** Si las políticas públicas son demasiado restrictivas, los clientes no podrán ver negocios/servicios. Si son demasiado permisivas, cualquier persona podrá ver datos privados del negocio.
- **Race conditions en reservas:** Aunque el RPC usa advisory locks, si el frontend permite enviar múltiples solicitudes simultáneas, pueden generarse errores confusos para el usuario.

### Medio
- **Timezone mismatch:** El frontend debe enviar timestamps UTC y el backend los convierte a la timezone del negocio. Si hay inconsistencia, las validaciones fallarán.
- **Grid de 15 minutos:** Si el usuario puede editar manualmente la hora en el formulario, debe validarse que cumple con el grid (minuto % 15 == 0).

### Bajo
- **Datos hardcodeados en dashboard:** No es un riesgo funcional, pero dificulta testing real.

---

## Acciones Inmediatas Recomendadas

1. **Ejecutar Fase 1** — Verificar RLS con queries directas a Supabase (MCP)
2. **Ejecutar Fase 4** — Configurar datos de prueba (servicios + horarios del negocio)
3. **Probar flujo end-to-end** — Crear una reserva real desde la página pública y verificar que aparece en el dashboard
4. **Si el flujo funciona** → El proyecto está funcional para reservas básicas
5. **Si algo falla** → Corregir según los errores específicos encontrados
