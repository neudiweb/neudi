import { test, expect } from '@playwright/test';

test.describe('Login Page - Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/neudi/login');
    await page.waitForLoadState('networkidle');
  });

  test('should show forgot password link next to password field', async ({ page }) => {
    const link = page.getByText('¿Olvidaste tu contraseña?');
    await expect(link).toBeVisible();
    await expect(link).toHaveClass(/font-medium/);
  });

  test('should open reset password modal when clicking forgot password link', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click();

    const modal = page.locator('.fixed.z-50');
    await expect(modal).toBeVisible();

    await expect(page.getByText('Recuperar contraseña')).toBeVisible();
    await expect(page.getByText('Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña.')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar enlace' })).toBeVisible();
  });

  test('should close modal with X button', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await expect(page.locator('.fixed.z-50')).toBeVisible();

    await page.getByRole('button', { name: '' }).first().click();
    await expect(page.locator('.fixed.z-50')).not.toBeVisible();
  });

  test('should close modal by clicking backdrop', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await expect(page.locator('.fixed.z-50')).toBeVisible();

    await page.locator('.fixed.inset-0').click({ position: { x: 50, y: 50 } });
    await expect(page.locator('.fixed.z-50')).not.toBeVisible();
  });

  test('should show error when submitting empty email', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    await expect(page.getByText('Ingresá tu email.')).toBeVisible();
  });

  test('should show success state after reset password submission', async ({ page }) => {
    await page.getByText('¿Olvidaste tu contraseña?').click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    await expect(page.getByText('Email enviado')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    await expect(page.getByText('Te enviamos un enlace para recuperar tu contraseña a')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entendido' })).toBeVisible();
  });

  test('should show error message on login with wrong credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Contraseña').fill('wrongpass');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible();
  });

  test('should show error message on login with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Completá todos los campos.')).toBeVisible();
  });
});
