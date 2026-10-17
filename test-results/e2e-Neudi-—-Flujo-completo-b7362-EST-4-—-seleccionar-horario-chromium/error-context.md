# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> Neudi — Flujo completo de reserva >> TEST 4 — seleccionar horario
- Location: tests\e2e.spec.ts:155:3

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
> 161 |     await corteCard.click();
      |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  198 |   test('TEST 6 — enviar reserva', async ({ page }) => {
  199 |     await page.goto('/business/peluqueria-juan/reservar');
  200 |     await waitForApp(page);
  201 | 
  202 |     // Ir al paso de datos
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
```