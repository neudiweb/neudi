# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 8 — abrir dashboard
- Location: tests\e2e.spec.ts:296:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Agenda' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Agenda' })

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
  203 |     await goToDataStep(page);
  204 | 
  205 |     // Completar formulario con nombre específico
  206 |     await fillCustomerData(page, 'Cliente Test', '+54 911 1234-5678', 'test@demo.com');
  207 | 
  208 |     // Agregar notas opcionales
  209 |     const textareas = page.locator('textarea').all();
  210 |     if (textareas.length > 0) {
  211 |       await textareas[0].fill('Me gustaría que me atienda Pepito si es posible.');
  212 |     }
  213 | 
  214 |     // Click en "Revisar reserva" para ir al paso de resumen
  215 |     const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
  216 |     if (await reviewBtn.isVisible({ timeout: 3000 })) {
  217 |       await reviewBtn.click();
  218 |     }
  219 | 
  220 |     // Esperar paso de resumen
  221 |     await waitForApp(page);
  222 |     await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });
  223 | 
  224 |     // Click en "Confirmar reserva"
  225 |     const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
  226 |     if (await submitBtn.isVisible({ timeout: 3000 })) {
  227 |       await submitBtn.click();
  228 |     } else {
  229 |       // Fallback: último botón visible
  230 |       const buttons = page.locator('button').filter({ hasText: /confirmar|enviar|reservar/i });
  231 |       if (await buttons.count() > 0) {
  232 |         await buttons.last().click();
  233 |       }
  234 |     }
  235 | 
  236 |     // Esperar transición
  237 |     await waitForApp(page);
  238 |     await page.waitForTimeout(1000);
  239 |   });
  240 | 
  241 |   // TEST 7: Ver confirmación
  242 |   test('TEST 7 — ver confirmación', async ({ page }) => {
  243 |     await page.goto('/business/peluqueria-juan/reservar');
  244 |     await waitForApp(page);
  245 | 
  246 |     // Ir al paso de datos
  247 |     await goToDataStep(page);
  248 | 
  249 |     // Completar formulario con nombre específico
  250 |     await fillCustomerData(page, 'Cliente Confirmación', '+54 911 1234-5678', 'confirmacion@demo.com');
  251 | 
  252 |     // Agregar notas opcionales
  253 |     const textareas = page.locator('textarea').all();
  254 |     if (textareas.length > 0) {
  255 |       await textareas[0].fill('Me gustaría que me atienda Pepito si es posible.');
  256 |     }
  257 | 
  258 |     // Ir al paso de resumen y confirmar
  259 |     const reviewBtn = page.getByRole('button', { name: /revisar reserva/i });
  260 |     if (await reviewBtn.isVisible({ timeout: 3000 })) {
  261 |       await reviewBtn.click();
  262 |     }
  263 | 
  264 |     await waitForApp(page);
  265 |     await expect(page.getByText('Resumen')).toBeVisible({ timeout: 5000 });
  266 | 
  267 |     const submitBtn = page.getByRole('button', { name: /confirmar reserva/i });
  268 |     if (await submitBtn.isVisible({ timeout: 3000 })) {
  269 |       await submitBtn.click();
  270 |     } else {
  271 |       const buttons = page.locator('button').filter({ hasText: /confirmar|enviar|reservar/i });
  272 |       if (await buttons.count() > 0) {
  273 |         await buttons.last().click();
  274 |       }
  275 |     }
  276 | 
  277 |     // Verificar confirmación
  278 |     await waitForApp(page);
  279 |     await expect(page.getByText('Solicitud enviada')).toBeVisible({ timeout: 5000 });
  280 | 
  281 |     // Verificar que muestra el estado PENDIENTE
  282 |     const pendingBadge = page.getByText('PENDIENTE', { exact: true }).first();
  283 |     if (await pendingBadge.isVisible({ timeout: 3000 })) {
  284 |       await expect(pendingBadge).toBeVisible();
  285 |     } else {
  286 |       // Check for any status indicator
  287 |       const statusText = page.getByText(/pendiente|confirmado/i);
  288 |       await expect(statusText).toBeVisible({ timeout: 3000 });
  289 |     }
  290 | 
  291 |     // Verificar que muestra el nombre del cliente
  292 |     await expect(page.getByText('Cliente Confirmación')).toBeVisible({ timeout: 3000 });
  293 |   });
  294 | 
  295 |   // TEST 8: Abrir dashboard
  296 |   test('TEST 8 — abrir dashboard', async ({ page }) => {
  297 |     await page.goto('/dashboard');
  298 | 
  299 |     // Verificar que el dashboard carga
  300 |     await waitForApp(page);
  301 | 
  302 |     // Verificar sidebar de navegación
> 303 |     await expect(page.getByRole('link', { name: 'Agenda' })).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  304 |     await expect(page.getByRole('link', { name: 'Servicios' })).toBeVisible();
  305 |     await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();
  306 |     await expect(page.getByRole('link', { name: /Configur/i })).toBeVisible();
  307 |   });
  308 | 
  309 |   // TEST 9: Ver turno creado
  310 |   test('TEST 9 — ver turno en agenda', async ({ page }) => {
  311 |     await page.goto('/dashboard');
  312 | 
  313 |     // Esperar a que carguen los turnos mock
  314 |     await expect(page.getByRole('button').first()).toBeVisible({ timeout: 5000 });
  315 | 
  316 |     // Verificar que hay turnos listados (al menos uno)
  317 |     const appointmentCards = page.locator('[class*="border"], [class*="rounded"]');
  318 |     const count = await appointmentCards.count();
  319 |     expect(count).toBeGreaterThan(0);
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
```