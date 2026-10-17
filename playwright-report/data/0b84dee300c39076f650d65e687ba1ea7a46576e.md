# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 1 — abrir página pública
- Location: tests\e2e.spec.ts:90:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Buenos Aires, Argentina')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Buenos Aires, Argentina')

```

```yaml
- link "Sistema de turnos gratuito para tu negocio":
  - /url: /register
- heading "Turnos online que simplifican tu día" [level=1]
- paragraph: Neudi permite que tus clientes reserven turnos 24/7 sin llamadas ni mensajes. Vos gestionás todo desde un panel simple.
- link "Empezar gratis":
  - /url: /register
  - text: Empezar gratis
  - img
- link "¿Cómo funciona?":
  - /url: "#como-funciona"
- img
- text: Sin tarjeta de crédito
- img
- text: Configuración en 5 min
- heading "Todo lo que necesitás, nada que no" [level=2]
- paragraph: Neudi se encarga de la gestión de turnos para que vos puedas enfocarte en tu negocio.
- img
- heading "Calendario inteligente" [level=3]
- paragraph: Tus clientes ven los horarios disponibles y reservan al instante. Sin conflictos ni solapamientos.
- img
- heading "Gestión de clientes" [level=3]
- paragraph: Historial de visitas, preferencias y datos de contacto de cada cliente en un solo lugar.
- img
- heading "Servicios personalizables" [level=3]
- paragraph: Configurá servicios, duración, precios y opciones como seña o depósito.
- img
- heading "Horarios flexibles" [level=3]
- paragraph: Definí horarios por día, feriados y períodos especiales fácilmente.
- img
- heading "Página de reserva" [level=3]
- paragraph: Cada negocio tiene su página personalizada para que los clientes reserven online.
- img
- heading "Fácil de usar" [level=3]
- paragraph: Interfaz intuitiva tanto para vos como para tus clientes. Sin curva de aprendizaje.
- heading "¿Listo para simplificar tu negocio?" [level=2]
- paragraph: Creá tu cuenta gratis y empezá a recibir turnos online en minutos.
- link "Crear mi cuenta gratuita":
  - /url: /register
  - text: Crear mi cuenta gratuita
  - img
- contentinfo:
  - link "N Neudi":
    - /url: /
  - paragraph: © 2026 Neudi. Todos los derechos reservados.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Neudi — Flujo completo de reserva', () => {
  4   |   // Helper: wait for React SPA to fully hydrate and render visible content
  5   |   async function waitForApp(page) {
  6   |     await page.waitForLoadState('domcontentloaded');
  7   |     await page.waitForFunction(() => {
  8   |       const root = document.getElementById('root');
  9   |       return root && root.children.length > 0 && root.textContent.trim().length > 10;
  10  |     }, { timeout: 15000 });
  11  |     await page.waitForTimeout(300);
  12  |   }
  13  | 
  14  |   // Helper: wait for step heading to appear (handles accented chars via regex)
  15  |   async function waitForStepHeading(page, keyword) {
  16  |     await expect(page.getByText(new RegExp(keyword, 'i'))).toBeVisible({ timeout: 5000 });
  17  |   }
  18  | 
  19  |   // Helper: click first date button in the date grid
  20  |   async function clickFirstDate(page) {
  21  |     const dateGrid = page.locator('[class*="overflow-x-auto"]');
  22  |     if (await dateGrid.count() > 0) {
  23  |       await dateGrid.getByRole('button').first().click();
  24  |     } else {
  25  |       // Fallback: find button whose textContent contains a day number
  26  |       const buttons = page.locator('button');
  27  |       for (let i = 0; i < await buttons.count(); i++) {
  28  |         const text = await buttons.nth(i).textContent();
  29  |         if (/^\w+\d/.test(text || '')) {
  30  |           await buttons.nth(i).click();
  31  |           break;
  32  |         }
  33  |       }
  34  |     }
  35  |   }
  36  | 
  37  |   // Helper: click first time slot button
  38  |   async function clickFirstTimeSlot(page) {
  39  |     const timeButtons = page.getByRole('button').filter({ hasText: /\d{1,2}:\d{2}/ });
  40  |     if (await timeButtons.count() > 0) {
  41  |       await timeButtons.first().click();
  42  |     } else {
  43  |       // Fallback: find button with time-like textContent
  44  |       const buttons = page.locator('button');
  45  |       for (let i = 0; i < await buttons.count(); i++) {
  46  |         const text = await buttons.nth(i).textContent();
  47  |         if (/^\d{1,2}:\d{2}$/.test(text?.trim() || '')) {
  48  |           await buttons.nth(i).click();
  49  |           break;
  50  |         }
  51  |       }
  52  |     }
  53  |   }
  54  | 
  55  |   // Helper: navigate to the customer data step
  56  |   async function goToDataStep(page) {
  57  |     // Step 1: Service
  58  |     const corteCard = page.getByRole('button', { name: /corte/i }).first();
  59  |     await corteCard.click();
  60  | 
  61  |     // Wait for step 2 (date)
  62  |     await waitForApp(page);
  63  |     await waitForStepHeading(page, 'fecha');
  64  | 
  65  |     // Step 2: Date
  66  |     await clickFirstDate(page);
  67  | 
  68  |     // Wait for step 3 (time)
  69  |     await waitForApp(page);
  70  |     await waitForStepHeading(page, 'horario');
  71  | 
  72  |     // Step 3: Time
  73  |     await clickFirstTimeSlot(page);
  74  | 
  75  |     // Wait for step 4 (data)
  76  |     await waitForApp(page);
  77  |     await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible({ timeout: 5000 });
  78  |   }
  79  | 
  80  |   // Helper: fill customer data form
  81  |   async function fillCustomerData(page, name = 'Cliente Demo', phone = '+54 911 1234-5678', email = 'cliente@demo.com') {
  82  |     const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();
  83  |     const inputList = await inputs;
  84  |     if (inputList.length >= 1) await inputList[0].fill(name);
  85  |     if (inputList.length >= 2) await inputList[1].fill(phone);
  86  |     if (inputList.length >= 3) await inputList[2].fill(email);
  87  |   }
  88  | 
  89  |   // TEST 1: Abrir página pública
  90  |   test('TEST 1 — abrir página pública', async ({ page }) => {
  91  |     await page.goto('/');
  92  |     await waitForApp(page);
  93  |     await expect(page).toHaveTitle(/Neudi/, { timeout: 5000 });
  94  | 
  95  |     const heroText = page.locator('h1').first();
  96  |     await expect(heroText).toBeVisible({ timeout: 5000 });
> 97  |     await expect(page.getByText('Buenos Aires, Argentina')).toBeVisible();
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  98  |     await expect(page.getByRole('link', { name: 'Reservar turno' })).toBeVisible();
  99  | 
  100 |     await expect(page.getByText('Nuestros servicios')).toBeVisible();
  101 |     await expect(page.getByText('Corte', { exact: true })).toBeVisible();
  102 |     await expect(page.getByText('Corte + Barba')).toBeVisible();
  103 |     // "Color" appears multiple times; use heading role for the service name
  104 |     await expect(page.getByRole('heading', { name: 'Color' })).toBeVisible();
  105 | 
  106 |     await expect(page.getByText('Horarios')).toBeVisible();
  107 |     await expect(page.getByText('Lunes')).toBeVisible();
  108 |     await expect(page.getByText('Cerrado')).toBeVisible();
  109 |   });
  110 | 
  111 |   // TEST 2: Seleccionar servicio (desde página pública)
  112 |   test('TEST 2 — seleccionar servicio desde página pública', async ({ page }) => {
  113 |     await page.goto('/business/peluqueria-juan/reservar');
  114 |     await waitForApp(page);
  115 | 
  116 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 5000 });
  117 | 
  118 |     // Esperar paso de servicio — usar heading regex (handles accented chars)
  119 |     await waitForStepHeading(page, 'servicio');
  120 | 
  121 |     // Seleccionar "Corte"
  122 |     const corteCard = page.getByRole('button', { name: /corte/i }).first();
  123 |     await corteCard.click();
  124 | 
  125 |     // Verificar que avanzó al paso de fecha
  126 |     await waitForApp(page);
  127 |     await waitForStepHeading(page, 'fecha');
  128 |   });
  129 | 
  130 |   // TEST 3: Seleccionar fecha
  131 |   test('TEST 3 — seleccionar fecha', async ({ page }) => {
  132 |     await page.goto('/business/peluqueria-juan/reservar');
  133 |     await waitForApp(page);
  134 | 
  135 |     // Esperar paso de servicio
  136 |     await waitForStepHeading(page, 'servicio');
  137 | 
  138 |     // Seleccionar "Corte" (45 min)
  139 |     const corteCard = page.getByRole('button', { name: /corte/i }).first();
  140 |     await corteCard.click();
  141 | 
  142 |     // Esperar paso de fecha
  143 |     await waitForApp(page);
  144 |     await waitForStepHeading(page, 'fecha');
  145 | 
  146 |     // Seleccionar la primera fecha disponible (using textContent matching)
  147 |     await clickFirstDate(page);
  148 | 
  149 |     // Verificar que avanzó al paso de horario
  150 |     await waitForApp(page);
  151 |     await waitForStepHeading(page, 'horario');
  152 |   });
  153 | 
  154 |   // TEST 4: Seleccionar horario
  155 |   test('TEST 4 — seleccionar horario', async ({ page }) => {
  156 |     await page.goto('/business/peluqueria-juan/reservar');
  157 |     await waitForApp(page);
  158 | 
  159 |     // Paso 1: Servicio
  160 |     const corteCard = page.getByRole('button', { name: /corte/i }).first();
  161 |     await corteCard.click();
  162 | 
  163 |     // Paso 2: Fecha
  164 |     await waitForApp(page);
  165 |     await waitForStepHeading(page, 'fecha');
  166 |     await clickFirstDate(page);
  167 | 
  168 |     // Paso 3: Horario
  169 |     await waitForApp(page);
  170 |     await waitForStepHeading(page, 'horario');
  171 | 
  172 |     // Seleccionar el primer horario disponible (using textContent matching)
  173 |     await clickFirstTimeSlot(page);
  174 | 
  175 |     // Verificar que avanzó al paso de datos del cliente
  176 |     await waitForApp(page);
  177 |     await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible({ timeout: 3000 });
  178 |   });
  179 | 
  180 |   // TEST 5: Completar datos del cliente
  181 |   test('TEST 5 — completar datos del cliente', async ({ page }) => {
  182 |     await page.goto('/business/peluqueria-juan/reservar');
  183 |     await waitForApp(page);
  184 | 
  185 |     // Ir al paso de datos
  186 |     await goToDataStep(page);
  187 | 
  188 |     // Completar formulario
  189 |     await fillCustomerData(page, 'Cliente Demo', '+54 911 1234-5678', 'cliente@demo.com');
  190 | 
  191 |     // Verificar que los campos se completaron
  192 |     const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();
  193 |     const inputList = await inputs;
  194 |     await expect(inputList[0]).toHaveValue('Cliente Demo');
  195 |   });
  196 | 
  197 |   // TEST 6: Enviar reserva
```