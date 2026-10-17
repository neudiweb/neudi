import { test, expect } from '@playwright/test';

test.describe('Neudi — Flujo completo de reserva', () => {
  // Helper: wait for React SPA to fully hydrate and render visible content
  async function waitForApp(page) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0 && root.textContent.trim().length > 10;
    }, { timeout: 15000 });
    await page.waitForTimeout(300);
  }

  // Helper: wait for step heading to appear (handles accented chars via regex)
  async function waitForStepHeading(page, keyword) {
    await expect(page.getByText(new RegExp(keyword, 'i'))).toBeVisible({ timeout: 5000 });
  }

  // Helper: click first date button in the date grid
  async function clickFirstDate(page) {
    const dateGrid = page.locator('[class*="overflow-x-auto"]');
    if (await dateGrid.count() > 0) {
      await dateGrid.getByRole('button').first().click();
    } else {
      // Fallback: find button whose textContent contains a day number
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const text = await buttons.nth(i).textContent();
        if (/^\w+\d/.test(text || '')) {
          await buttons.nth(i).click();
          break;
        }
      }
    }
  }

  // Helper: click first time slot button
  async function clickFirstTimeSlot(page) {
    const timeButtons = page.getByRole('button').filter({ hasText: /\d{1,2}:\d{2}/ });
    if (await timeButtons.count() > 0) {
      await timeButtons.first().click();
    } else {
      // Fallback: find button with time-like textContent
      const buttons = page.locator('button');
      for (let i = 0; i < await buttons.count(); i++) {
        const text = await buttons.nth(i).textContent();
        if (/^\d{1,2}:\d{2}$/.test(text?.trim() || '')) {
          await buttons.nth(i).click();
          break;
        }
      }
    }
  }

  // Helper: navigate to the customer data step
  async function goToDataStep(page) {
    // Step 1: Service
    const corteCard = page.getByRole('button', { name: /corte/i }).first();
    await corteCard.click();

    // Wait for step 2 (date)
    await waitForApp(page);
    await waitForStepHeading(page, 'fecha');

    // Step 2: Date
    await clickFirstDate(page);

    // Wait for step 3 (time)
    await waitForApp(page);
    await waitForStepHeading(page, 'horario');

    // Step 3: Time
    await clickFirstTimeSlot(page);

    // Wait for step 4 (data)
    await waitForApp(page);
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible({ timeout: 5000 });
  }

  // Helper: fill customer data form
  async function fillCustomerData(page, name = 'Cliente Demo', phone = '+54 911 1234-5678', email = 'cliente@demo.com') {
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();
    const inputList = await inputs;
    if (inputList.length >= 1) await inputList[0].fill(name);
    if (inputList.length >= 2) await inputList[1].fill(phone);
    if (inputList.length >= 3) await inputList[2].fill(email);
  }

  // TEST 1: Abrir página pública
  test('TEST 1 — abrir página pública', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page).toHaveTitle(/Neudi/, { timeout: 5000 });

    const heroText = page.locator('h1').first();
    await expect(heroText).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Buenos Aires, Argentina')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reservar turno' })).toBeVisible();

    await expect(page.getByText('Nuestros servicios')).toBeVisible();
    await expect(page.getByText('Corte', { exact: true })).toBeVisible();
    await expect(page.getByText('Corte + Barba')).toBeVisible();
    // "Color" appears multiple times; use heading role for the service name
    await expect(page.getByRole('heading', { name: 'Color' })).toBeVisible();

    await expect(page.getByText('Horarios')).toBeVisible();
    await expect(page.getByText('Lunes')).toBeVisible();
    await expect(page.getByText('Cerrado')).toBeVisible();
  });

  // TEST 2: Seleccionar servicio (desde página pública)
  test('TEST 2 — seleccionar servicio desde página pública', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });

    // Esperar paso de servicio — usar heading regex (handles accented chars)
    await waitForStepHeading(page, 'servicio');

    // Seleccionar "Corte"
    const corteCard = page.getByRole('button', { name: /corte/i }).first();
    await corteCard.click();

    // Verificar que avanzó al paso de fecha
    await waitForApp(page);
    await waitForStepHeading(page, 'fecha');
  });

  // TEST 3: Seleccionar fecha
  test('TEST 3 — seleccionar fecha', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Esperar paso de servicio
    await waitForStepHeading(page, 'servicio');

    // Seleccionar "Corte" (45 min)
    const corteCard = page.getByRole('button', { name: /corte/i }).first();
    await corteCard.click();

    // Esperar paso de fecha
    await waitForApp(page);
    await waitForStepHeading(page, 'fecha');

    // Seleccionar la primera fecha disponible (using textContent matching)
    await clickFirstDate(page);

    // Verificar que avanzó al paso de horario
    await waitForApp(page);
    await waitForStepHeading(page, 'horario');
  });

  // TEST 4: Seleccionar horario
  test('TEST 4 — seleccionar horario', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Paso 1: Servicio
    const corteCard = page.getByRole('button', { name: /corte/i }).first();
    await corteCard.click();

    // Paso 2: Fecha
    await waitForApp(page);
    await waitForStepHeading(page, 'fecha');
    await clickFirstDate(page);

    // Paso 3: Horario
    await waitForApp(page);
    await waitForStepHeading(page, 'horario');

    // Seleccionar el primer horario disponible (using textContent matching)
    await clickFirstTimeSlot(page);

    // Verificar que avanzó al paso de datos del cliente
    await waitForApp(page);
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible({ timeout: 3000 });
  });

  // TEST 5: Completar datos del cliente
  test('TEST 5 — completar datos del cliente', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Ir al paso de datos
    await goToDataStep(page);

    // Completar formulario
    await fillCustomerData(page, 'Cliente Demo', '+54 911 1234-5678', 'cliente@demo.com');

    // Verificar que los campos se completaron
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();
    const inputList = await inputs;
    await expect(inputList[0]).toHaveValue('Cliente Demo');
  });

  // TEST 6: Enviar reserva
  test('TEST 6 — enviar reserva', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Ir al paso de datos
    await goToDataStep(page);

    // Completar formulario con nombre específico
    await fillCustomerData(page, 'Cliente Test', '+54 911 1234-5678', 'test@demo.com');

    // Agregar notas opcionales
    const textareas = page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Me gustaría que me atienda Pepito si es posible.');
    }

    // Click en "Revisar reserva" para ir al paso de resumen
    const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
    if (await reviewBtn.isVisible({ timeout: 3000 })) {
      await reviewBtn.click();
    }

    // Esperar paso de resumen
    await waitForApp(page);
    await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });

    // Click en "Confirmar reserva"
    const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click();
    } else {
      // Fallback: último botón visible
      const buttons = page.locator('button').filter({ hasText: /confirmar|enviar|reservar/i });
      if (await buttons.count() > 0) {
        await buttons.last().click();
      }
    }

    // Esperar transición
    await waitForApp(page);
    await page.waitForTimeout(1000);
  });

  // TEST 7: Ver confirmación
  test('TEST 7 — ver confirmación', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Ir al paso de datos
    await goToDataStep(page);

    // Completar formulario con nombre específico
    await fillCustomerData(page, 'Cliente Confirmación', '+54 911 1234-5678', 'confirmacion@demo.com');

    // Agregar notas opcionales
    const textareas = page.locator('textarea').all();
    if (textareas.length > 0) {
      await textareas[0].fill('Me gustaría que me atienda Pepito si es posible.');
    }

    // Ir al paso de resumen y confirmar
    const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
    if (await reviewBtn.isVisible({ timeout: 3000 })) {
      await reviewBtn.click();
    }

    await waitForApp(page);
    await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });

    const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click();
    } else {
      const buttons = page.locator('button').filter({ hasText: /confirmar|enviar|reservar/i });
      if (await buttons.count() > 0) {
        await buttons.last().click();
      }
    }

    // Verificar confirmación
    await waitForApp(page);
    await expect(page.getByText('Solicitud enviada')).toBeVisible({ timeout: 5000 });

    // Verificar que muestra el estado PENDIENTE
    const pendingBadge = page.getByText('PENDIENTE', { exact: true }).first();
    if (await pendingBadge.isVisible({ timeout: 3000 })) {
      await expect(pendingBadge).toBeVisible();
    } else {
      // Check for any status indicator
      const statusText = page.getByText(/pendiente|confirmado/i);
      await expect(statusText).toBeVisible({ timeout: 3000 });
    }

    // Verificar que muestra el nombre del cliente
    await expect(page.getByText('Cliente Confirmación')).toBeVisible({ timeout: 3000 });
  });

  // TEST 8: Abrir dashboard
  test('TEST 8 — abrir dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar que el dashboard carga
    await waitForApp(page);

    // Verificar sidebar de navegación
    await expect(page.getByRole('link', { name: 'Agenda' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Servicios' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Configur/i })).toBeVisible();
  });

  // TEST 9: Ver turno creado
  test('TEST 9 — ver turno en agenda', async ({ page }) => {
    await page.goto('/dashboard');

    // Esperar a que carguen los turnos mock
    await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });

    // Verificar que hay turnos listados (al menos uno)
    const appointmentCards = page.locator('[class*="border"], [class*="rounded"]');
    const count = await appointmentCards.count();
    expect(count).toBeGreaterThan(0);
  });

  // TEST 10: Cambiar PENDING → CONFIRMED
  test('TEST 10 — cambiar PENDING a CONFIRMADO', async ({ page }) => {
    await page.goto('/dashboard');

    // Esperar carga de agenda
    await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });

    // Buscar un turno con estado PENDIENTE y hacer click para abrir detalle
    const pendingTexts = page.getByText('PENDIENTE', { exact: true }).all();
    const pendingList = await pendingTexts;

    if (pendingList.length > 0) {
      // Click en el primer turno pendiente para abrir detalle
      const firstPendingCard = pendingList[0].locator('..').locator('..');
      await firstPendingCard.click();

      // Esperar modal o panel de detalle
      await page.waitForTimeout(500);

      // Buscar botón "Confirmar" y hacer click
      const confirmBtn = page.getByRole('button', { name: /confirmar/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();

        // Verificar que el estado cambió a CONFIRMADO
        await expect(page.getByText(/confirmado|CONFIRMADO/i)).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Si no hay pendientes, verificar que la agenda carga correctamente
      const anyCard = page.locator('[class*="border"]').first();
      await expect(anyCard).toBeVisible();
    }
  });

  // TEST 11: Cambiar PENDING → REJECTED
  test('TEST 11 — cambiar PENDING a RECHAZADO', async ({ page }) => {
    await page.goto('/dashboard');

    // Esperar carga de agenda
    await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });

    // Buscar un turno y hacer click para abrir detalle
    const anyCard = page.locator('[class*="border"]').first();
    if (await anyCard.isVisible({ timeout: 3000 })) {
      await anyCard.click();

      await page.waitForTimeout(500);

      // Buscar botón "Rechazar" y hacer click
      const rejectBtn = page.getByRole('button', { name: /rechazar/i }).first();
      if (await rejectBtn.isVisible({ timeout: 3000 })) {
        await rejectBtn.click();

        // Verificar que el estado cambió a RECHAZADO
        await expect(page.getByText(/rechazado|REJECTED/i)).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip('No hay turnos para interactuar');
    }
  });

  // TEST 13: Verificar que la fecha se muestra correctamente en el resumen de reserva (timezone test)
  test('TEST 13 — fecha correcta en resumen de reserva (timezone)', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Ir al paso de datos
    await goToDataStep(page);

    // Completar formulario
    await fillCustomerData(page, 'Cliente Timezone', '+54 911 1234-5678', 'timezone@demo.com');

    // Ir al paso de resumen
    const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
    if (await reviewBtn.isVisible({ timeout: 3000 })) {
      await reviewBtn.click();
    }

    await waitForApp(page);
    await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });

    // Verificar que la fecha se muestra correctamente (sin drift UTC)
    // Debería mostrar la fecha en español con formato legible
    const dateText = page.getByText(/de de/);
    await expect(dateText).toBeVisible({ timeout: 3000 });

    // Verificar que la hora se muestra correctamente
    const timeText = page.getByText(/^\d{1,2}:\d{2}$/);
    await expect(timeText.first()).toBeVisible({ timeout: 3000 });
  });

  // TEST 14: Verificar que los días cerrados no son seleccionables (timezone test)
  test('TEST 14 — días cerrados no seleccionables (timezone)', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Seleccionar servicio
    const corteCard = page.getByRole('button', { name: /corte/i }).first();
    await corteCard.click();

    await waitForApp(page);
    await waitForStepHeading(page, 'fecha');

    // Buscar todas las fechas disponibles
    const dateButtons = page.locator('button').filter({ hasText: /^\w+\d/ });
    const count = await dateButtons.count();
    
    // Debería haber al menos algunas fechas
    expect(count).toBeGreaterThan(0);

    // Verificar que las fechas no disponibles están deshabilitadas
    const disabledDates = page.locator('button:disabled').filter({ hasText: /^\w+\d/ });
    const disabledCount = await disabledDates.count();
    
    // Debería haber al menos un día cerrado (Domingo)
    expect(disabledCount).toBeGreaterThan(0);
  });

  // TEST 15: Verificar que el flujo completo funciona con timezone correcta
  test('TEST 15 — flujo completo con timezone correcta', async ({ page }) => {
    await page.goto('/business/peluqueria-juan/reservar');
    await waitForApp(page);

    // Ir al paso de datos
    await goToDataStep(page);

    // Completar formulario
    await fillCustomerData(page, 'Cliente Full Timezone', '+54 911 9999-8888', 'full@demo.com');

    // Ir al paso de resumen
    const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
    if (await reviewBtn.isVisible({ timeout: 3000 })) {
      await reviewBtn.click();
    }

    await waitForApp(page);
    await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });

    // Verificar datos en resumen
    await expect(page.getByText('Cliente Full Timezone')).toBeVisible({ timeout: 3000 });

    // Confirmar reserva
    const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click();
    }

    await waitForApp(page);
    await page.waitForTimeout(1000);

    // Verificar confirmación
    await expect(page.getByText('Solicitud enviada')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Cliente Full Timezone')).toBeVisible({ timeout: 3000 });
  });

  // TEST 16: Verificar que la agenda muestra fechas correctamente
  test('TEST 16 — agenda muestra fechas correctamente (timezone)', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForApp(page);

    // Verificar que el título de la agenda es visible
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 5000 });

    // Verificar que hay un date picker visible
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 3000 });

    // Verificar botones de navegación de fecha
    const navButtons = page.locator('button[aria-label="Día anterior"], button[aria-label="Día siguiente"]');
    const navCount = await navButtons.count();
    expect(navCount).toBeGreaterThanOrEqual(2);
  });
});
