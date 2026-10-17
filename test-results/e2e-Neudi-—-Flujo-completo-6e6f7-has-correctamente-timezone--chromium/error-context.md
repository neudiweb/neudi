# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 16 — agenda muestra fechas correctamente (timezone)
- Location: tests\e2e.spec.ts:478:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Agenda' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Agenda' })

```

```yaml
- link "Neudi":
  - /url: /
  - heading "Neudi" [level=1]
- paragraph: Iniciar sesión en tu cuenta
- text: Email
- textbox "Email":
  - /placeholder: tu@email.com
- text: Contraseña
- textbox "Contraseña":
  - /placeholder: Tu contraseña
- paragraph: Mínimo 6 caracteres
- button "Iniciar sesión"
- text: o
- button "Probar demo":
  - img
  - text: Probar demo
- paragraph:
  - text: ¿No tenés cuenta?
  - link "Crear una cuenta":
    - /url: /register
- link "Volver al inicio":
  - /url: /
  - img
  - text: Volver al inicio
```

# Test source

```ts
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
  420 |     await corteCard.click();
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
> 483 |     await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 5000 });
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
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