# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 2 — seleccionar servicio desde página pública
- Location: tests\e2e.spec.ts:112:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/servicio/i)
Expected: visible
Error: strict mode violation: getByText(/servicio/i) resolved to 2 elements:
    1) <h3 class="text-sm font-semibold text-neutral-900 mb-2">Servicios personalizables</h3> aka getByRole('heading', { name: 'Servicios personalizables' })
    2) <p class="text-sm text-neutral-500 leading-relaxed">Configurá servicios, duración, precios y opciones…</p> aka getByText('Configurá servicios, duración')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/servicio/i)

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
> 16  |     await expect(page.getByText(new RegExp(keyword, 'i'))).toBeVisible({ timeout: 5000 });
      |                                                            ^ Error: expect(locator).toBeVisible() failed
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
  97  |     await expect(page.getByText('Buenos Aires, Argentina')).toBeVisible();
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
```