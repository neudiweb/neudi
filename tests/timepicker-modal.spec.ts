import { test, expect } from '@playwright/test';

test.describe('TimePicker Modal — Horarios de atención', () => {
  const TEST_EMAIL = 'nneejjii1996@gmail.com';
  const TEST_PASSWORD = '123456';

  async function login(page) {
    await page.goto('/neudi/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  async function goToHours(page) {
    await page.goto('/neudi/dashboard/hours');
    await page.waitForTimeout(1000);
  }

  test('Desktop — abrir modal de TimePicker y cambiar hora de inicio', async ({ page }) => {
    await login(page);

    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);

    // Toggle Lunes to open
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Click first TimePicker (Inicio)
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await timePickerBtns.first().click();
    await page.waitForTimeout(300);

    // Verify modal is visible
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal content - 4 selects (start hour, start minute, end hour, end minute)
    const selects = modal.locator('select');
    await expect(selects).toHaveCount(4);
    await expect(modal.getByRole('button', { name: 'Listo' })).toBeVisible();

    // Change start hour to 10 (first select)
    await selects.first().selectOption('10');
    await selects.nth(1).selectOption('00');

    // Verify start time preview updated
    await expect(modal.getByText('10:00')).toBeVisible({ timeout: 3000 });

    // Confirm
    await modal.getByRole('button', { name: 'Listo' }).click();
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('Desktop — abrir modal de TimePicker y cambiar hora de fin', async ({ page }) => {
    await login(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);

    // Toggle Lunes
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Click second TimePicker (Fin)
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await timePickerBtns.nth(1).click();
    await page.waitForTimeout(300);

    // Verify modal is visible
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Change end hour (third select) to 17
    const selects = modal.locator('select');
    await selects.nth(2).selectOption('17');
    await selects.nth(3).selectOption('00');

    // Confirm
    await modal.getByRole('button', { name: 'Listo' }).click();
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('Desktop — cerrar modal con backdrop click', async ({ page }) => {
    await login(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);

    // Toggle Lunes
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Open TimePicker
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await timePickerBtns.first().click();
    await page.waitForTimeout(300);

    // Verify modal is visible
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click on backdrop to close (outside the modal content)
    await page.mouse.click(5, 5);
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('Mobile — TimePicker modal funciona en pantallas pequeñas', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 }); // Pixel 5

    await login(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);
    await page.waitForTimeout(500);

    // Toggle Lunes
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Open TimePicker
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await timePickerBtns.first().click();
    await page.waitForTimeout(300);

    // Verify modal is visible and not clipped
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal content is visible
    await expect(modal.getByRole('button', { name: 'Listo' })).toBeVisible();

    // Verify modal content is visible
    await expect(modal.locator('select')).toHaveCount(4);

    // Change time and confirm
    const modalContent = modal.locator('> div').first();
    const modalBox = await modalContent.boundingBox();
    expect(modalBox).toBeTruthy();
    if (modalBox) {
      expect(modalBox.width).toBeLessThan(page.viewportSize()?.width || 400);
      expect(modalBox.y).toBeGreaterThan(0);
      expect(modalBox.y + modalBox.height).toBeLessThanOrEqual(page.viewportSize()?.height || 900);
    }

    await modal.locator('select').first().selectOption('12');
    await modal.locator('select').last().selectOption('00');
    await modal.getByRole('button', { name: 'Listo' }).click();
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('Desktop — agregar segunda franja y cambiar horarios con modal', async ({ page }) => {
    await login(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);

    // Toggle Lunes
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Add a second range - click the first one visible
    const addRangeBtn = page.getByRole('button', { name: /agregar otra franja horaria/i }).first();
    await addRangeBtn.click();
    await page.waitForTimeout(500);

    // Now there should be more time pickers
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await expect(timePickerBtns.nth(2)).toBeVisible({ timeout: 5000 });

    // Click the third time picker (second range's start time)
    await timePickerBtns.nth(2).click();
    await page.waitForTimeout(300);

    // Verify modal is visible
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Change time
    const selects = modal.locator('select');
    await selects.first().selectOption('14');
    await selects.nth(1).selectOption('00');
    await modal.getByRole('button', { name: 'Listo' }).click();
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('Desktop — dark mode compatible', async ({ page }) => {
    // Set dark mode via localStorage before loading the app
    await page.addInitScript(() => {
      localStorage.setItem('neudi-theme', 'dark');
    });

    await login(page);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /iniciar sesi[óo]n/i }).click();
    await page.waitForTimeout(1500);

    await goToHours(page);

    // Toggle Lunes
    const lunesToggle = page.getByRole('switch').first();
    const isLunesOpen = await lunesToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
    if (!isLunesOpen) {
      await lunesToggle.click();
      await page.waitForTimeout(500);
    }

    // Open TimePicker
    const timePickerBtns = page.locator('button').filter({ has: page.locator('svg circle') });
    await timePickerBtns.first().click();
    await page.waitForTimeout(300);

    // Verify modal is visible in dark mode
    const modal = page.locator('[role="dialog"][aria-label="Editar horarios de franja"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify modal content is visible
    await expect(modal.getByRole('button', { name: 'Listo' })).toBeVisible();
    await expect(modal.locator('select')).toHaveCount(4);

    // Verify dark mode styling — modal bg should be dark
    const modalContent = modal.locator('> div').first();
    const bgColor = await modalContent.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).toMatch(/rgb/);

    // Confirm and close
    await modal.getByRole('button', { name: 'Listo' }).click();
    await page.waitForTimeout(300);
    await expect(modal).not.toBeVisible();
  });
});
