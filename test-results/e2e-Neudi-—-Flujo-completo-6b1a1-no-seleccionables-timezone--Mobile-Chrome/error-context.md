# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 14 — días cerrados no seleccionables (timezone)
- Location: tests\e2e.spec.ts:414:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /corte/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - link "Sistema de turnos gratuito para tu negocio" [ref=e7] [cursor=pointer]:
      - /url: /register
    - heading "Turnos online que simplifican tu día" [level=1] [ref=e9]
    - paragraph [ref=e10]: Neudi permite que tus clientes reserven turnos 24/7 sin llamadas ni mensajes. Vos gestionás todo desde un panel simple.
    - generic [ref=e11]:
      - link "Empezar gratis" [ref=e12] [cursor=pointer]:
        - /url: /register
      - link "¿Cómo funciona?" [ref=e15] [cursor=pointer]:
        - /url: "#como-funciona"
    - generic [ref=e16]:
      - generic [ref=e17]: Sin tarjeta de crédito
      - generic [ref=e20]: Configuración en 5 min
  - generic [ref=e24]:
    - generic [ref=e25]:
      - heading "Todo lo que necesitás, nada que no" [level=2] [ref=e26]
      - paragraph [ref=e27]: Neudi se encarga de la gestión de turnos para que vos puedas enfocarte en tu negocio.
    - generic [ref=e28]:
      - generic [ref=e29]:
        - heading "Calendario inteligente" [level=3] [ref=e34]
        - paragraph [ref=e35]: Tus clientes ven los horarios disponibles y reservan al instante. Sin conflictos ni solapamientos.
      - generic [ref=e36]:
        - heading "Gestión de clientes" [level=3] [ref=e43]
        - paragraph [ref=e44]: Historial de visitas, preferencias y datos de contacto de cada cliente en un solo lugar.
      - generic [ref=e45]:
        - heading "Servicios personalizables" [level=3] [ref=e50]
        - paragraph [ref=e51]: Configurá servicios, duración, precios y opciones como seña o depósito.
      - generic [ref=e52]:
        - heading "Horarios flexibles" [level=3] [ref=e57]
        - paragraph [ref=e58]: Definí horarios por día, feriados y períodos especiales fácilmente.
      - generic [ref=e59]:
        - heading "Página de reserva" [level=3] [ref=e65]
        - paragraph [ref=e66]: Cada negocio tiene su página personalizada para que los clientes reserven online.
      - generic [ref=e67]:
        - heading "Fácil de usar" [level=3] [ref=e71]
        - paragraph [ref=e72]: Interfaz intuitiva tanto para vos como para tus clientes. Sin curva de aprendizaje.
  - generic [ref=e79]:
    - heading "¿Listo para simplificar tu negocio?" [level=2] [ref=e80]
    - paragraph [ref=e81]: Creá tu cuenta gratis y empezá a recibir turnos online en minutos.
    - link "Crear mi cuenta gratuita" [ref=e82] [cursor=pointer]:
      - /url: /register
  - contentinfo [ref=e85]:
    - generic [ref=e86]:
      - link "N Neudi" [ref=e87] [cursor=pointer]:
        - /url: /
        - generic [ref=e88]: "N"
        - generic [ref=e90]: Neudi
      - paragraph [ref=e91]: © 2026 Neudi. Todos los derechos reservados.
```

# Test source

```ts
  320 |   });
  321 | 
  322 |   // TEST 10: Cambiar PENDING → CONFIRMED
  323 |   test('TEST 10 — cambiar PENDING a CONFIRMADO', async ({ page }) => {
  324 |     await page.goto('/dashboard');
  325 | 
  326 |     // Esperar carga de agenda
  327 |     await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });
  328 | 
  329 |     // Buscar un turno con estado PENDIENTE y hacer click para abrir detalle
  330 |     const pendingTexts = page.getByText('PENDIENTE', { exact: true }).all();
  331 |     const pendingList = await pendingTexts;
  332 | 
  333 |     if (pendingList.length > 0) {
  334 |       // Click en el primer turno pendiente para abrir detalle
  335 |       const firstPendingCard = pendingList[0].locator('..').locator('..');
  336 |       await firstPendingCard.click();
  337 | 
  338 |       // Esperar modal o panel de detalle
  339 |       await page.waitForTimeout(500);
  340 | 
  341 |       // Buscar botón "Confirmar" y hacer click
  342 |       const confirmBtn = page.getByRole('button', { name: /confirmar/i }).first();
  343 |       if (await confirmBtn.isVisible({ timeout: 3000 })) {
  344 |         await confirmBtn.click();
  345 | 
  346 |         // Verificar que el estado cambió a CONFIRMADO
  347 |         await expect(page.getByText(/confirmado|CONFIRMADO/i)).toBeVisible({ timeout: 5000 });
  348 |       }
  349 |     } else {
  350 |       // Si no hay pendientes, verificar que la agenda carga correctamente
  351 |       const anyCard = page.locator('[class*="border"]').first();
  352 |       await expect(anyCard).toBeVisible();
  353 |     }
  354 |   });
  355 | 
  356 |   // TEST 11: Cambiar PENDING → REJECTED
  357 |   test('TEST 11 — cambiar PENDING a RECHAZADO', async ({ page }) => {
  358 |     await page.goto('/dashboard');
  359 | 
  360 |     // Esperar carga de agenda
  361 |     await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });
  362 | 
  363 |     // Buscar un turno y hacer click para abrir detalle
  364 |     const anyCard = page.locator('[class*="border"]').first();
  365 |     if (await anyCard.isVisible({ timeout: 3000 })) {
  366 |       await anyCard.click();
  367 | 
  368 |       await page.waitForTimeout(500);
  369 | 
  370 |       // Buscar botón "Rechazar" y hacer click
  371 |       const rejectBtn = page.getByRole('button', { name: /rechazar/i }).first();
  372 |       if (await rejectBtn.isVisible({ timeout: 3000 })) {
  373 |         await rejectBtn.click();
  374 | 
  375 |         // Verificar que el estado cambió a RECHAZADO
  376 |         await expect(page.getByText(/rechazado|REJECTED/i)).toBeVisible({ timeout: 5000 });
  377 |       }
  378 |     } else {
  379 |       test.skip('No hay turnos para interactuar');
  380 |     }
  381 |   });
  382 | 
  383 |   // TEST 13: Verificar que la fecha se muestra correctamente en el resumen de reserva (timezone test)
  384 |   test('TEST 13 — fecha correcta en resumen de reserva (timezone)', async ({ page }) => {
  385 |     await page.goto('/business/peluqueria-juan/reservar');
  386 |     await waitForApp(page);
  387 | 
  388 |     // Ir al paso de datos
  389 |     await goToDataStep(page);
  390 | 
  391 |     // Completar formulario
  392 |     await fillCustomerData(page, 'Cliente Timezone', '+54 911 1234-5678', 'timezone@demo.com');
  393 | 
  394 |     // Ir al paso de resumen
  395 |     const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
  396 |     if (await reviewBtn.isVisible({ timeout: 3000 })) {
  397 |       await reviewBtn.click();
  398 |     }
  399 | 
  400 |     await waitForApp(page);
  401 |     await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });
  402 | 
  403 |     // Verificar que la fecha se muestra correctamente (sin drift UTC)
  404 |     // Debería mostrar la fecha en español con formato legible
  405 |     const dateText = page.getByText(/de de/);
  406 |     await expect(dateText).toBeVisible({ timeout: 3000 });
  407 | 
  408 |     // Verificar que la hora se muestra correctamente
  409 |     const timeText = page.getByText(/^\d{1,2}:\d{2}$/);
  410 |     await expect(timeText.first()).toBeVisible({ timeout: 3000 });
  411 |   });
  412 | 
  413 |   // TEST 14: Verificar que los días cerrados no son seleccionables (timezone test)
  414 |   test('TEST 14 — días cerrados no seleccionables (timezone)', async ({ page }) => {
  415 |     await page.goto('/business/peluqueria-juan/reservar');
  416 |     await waitForApp(page);
  417 | 
  418 |     // Seleccionar servicio
  419 |     const corteCard = page.getByRole('button', { name: /corte/i }).first();
> 420 |     await corteCard.click();
      |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  421 | 
  422 |     await waitForApp(page);
  423 |     await waitForStepHeading(page, 'fecha');
  424 | 
  425 |     // Buscar todas las fechas disponibles
  426 |     const dateButtons = page.locator('button').filter({ hasText: /^\w+\d/ });
  427 |     const count = await dateButtons.count();
  428 |     
  429 |     // Debería haber al menos algunas fechas
  430 |     expect(count).toBeGreaterThan(0);
  431 | 
  432 |     // Verificar que las fechas no disponibles están deshabilitadas
  433 |     const disabledDates = page.locator('button:disabled').filter({ hasText: /^\w+\d/ });
  434 |     const disabledCount = await disabledDates.count();
  435 |     
  436 |     // Debería haber al menos un día cerrado (Domingo)
  437 |     expect(disabledCount).toBeGreaterThan(0);
  438 |   });
  439 | 
  440 |   // TEST 15: Verificar que el flujo completo funciona con timezone correcta
  441 |   test('TEST 15 — flujo completo con timezone correcta', async ({ page }) => {
  442 |     await page.goto('/business/peluqueria-juan/reservar');
  443 |     await waitForApp(page);
  444 | 
  445 |     // Ir al paso de datos
  446 |     await goToDataStep(page);
  447 | 
  448 |     // Completar formulario
  449 |     await fillCustomerData(page, 'Cliente Full Timezone', '+54 911 9999-8888', 'full@demo.com');
  450 | 
  451 |     // Ir al paso de resumen
  452 |     const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
  453 |     if (await reviewBtn.isVisible({ timeout: 3000 })) {
  454 |       await reviewBtn.click();
  455 |     }
  456 | 
  457 |     await waitForApp(page);
  458 |     await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });
  459 | 
  460 |     // Verificar datos en resumen
  461 |     await expect(page.getByText('Cliente Full Timezone')).toBeVisible({ timeout: 3000 });
  462 | 
  463 |     // Confirmar reserva
  464 |     const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
  465 |     if (await submitBtn.isVisible({ timeout: 3000 })) {
  466 |       await submitBtn.click();
  467 |     }
  468 | 
  469 |     await waitForApp(page);
  470 |     await page.waitForTimeout(1000);
  471 | 
  472 |     // Verificar confirmación
  473 |     await expect(page.getByText('Solicitud enviada')).toBeVisible({ timeout: 5000 });
  474 |     await expect(page.getByText('Cliente Full Timezone')).toBeVisible({ timeout: 3000 });
  475 |   });
  476 | 
  477 |   // TEST 16: Verificar que la agenda muestra fechas correctamente
  478 |   test('TEST 16 — agenda muestra fechas correctamente (timezone)', async ({ page }) => {
  479 |     await page.goto('/dashboard');
  480 |     await waitForApp(page);
  481 | 
  482 |     // Verificar que el título de la agenda es visible
  483 |     await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 5000 });
  484 | 
  485 |     // Verificar que hay un date picker visible
  486 |     const dateInput = page.locator('input[type="date"]');
  487 |     await expect(dateInput).toBeVisible({ timeout: 3000 });
  488 | 
  489 |     // Verificar botones de navegación de fecha
  490 |     const navButtons = page.locator('button[aria-label="Día anterior"], button[aria-label="Día siguiente"]');
  491 |     const navCount = await navButtons.count();
  492 |     expect(navCount).toBeGreaterThanOrEqual(2);
  493 |   });
  494 | });
  495 | 
```