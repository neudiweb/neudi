import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspace = 'C:/Users/USER/Desktop/NEUDI';
const screenshotsDir = path.join(workspace, 'playwright-screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  // 1. Login
  await page.goto('http://localhost:5173/neudi/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[placeholder*="correo"], input[type="email"]', 'nneejjii1996@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  console.log('Logged in');

  // 2. Navigate to Hours
  await page.waitForSelector('aside', { timeout: 5000 });
  const hoursBtn = await page.$('button:has-text("Horarios"), [data-nav="hours"], a:has-text("Horarios")');
  if (hoursBtn) {
    await hoursBtn.click();
  } else {
    const sidebarBtn = await page.$('button[title*="Horario"], button[aria-label*="Horario"]');
    if (sidebarBtn) await sidebarBtn.click();
  }
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  console.log('Navigated to Hours');

  // 3. Desktop screenshot
  await context.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'hours_desktop.png'), fullPage: false });
  console.log('DESKTOP SCREENSHOT SAVED');

  // 4. Mobile screenshots
  await context.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'hours_mobile.png'), fullPage: false });
  console.log('MOBILE SCREENSHOT SAVED');

  await context.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'hours_mobile_large.png'), fullPage: false });
  console.log('MOBILE LARGE SCREENSHOT SAVED');

  // 5. Dark mode
  await page.evaluate(async () => {
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.click();
    else {
      // Try to find the theme toggle button
      const allBtns = document.querySelectorAll('button');
      for (const b of allBtns) {
        if (b.textContent.includes('☀') || b.textContent.includes('☾') || b.textContent.includes('☼')) {
          b.click();
          break;
        }
      }
    }
  });
  await page.waitForTimeout(500);
  await context.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: path.join(screenshotsDir, 'hours_desktop_dark.png'), fullPage: false });
  console.log('DESKTOP DARK SCREENSHOT SAVED');

} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await browser.close();
}
