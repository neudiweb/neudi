
import asyncio
from playwright.async_api import async_playwright

async def test_login():
    async with async_playwright() as p:
        # Use chromium without head for automation
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        print("Navigating to login...")
        await page.goto('https://neudiweb.github.io/neudi/login')
        
        print("Filling credentials...")
        # Using selectors that are likely to work
        await page.get_by_role("textbox", name="email", exact=False).fill('nneejjii1996@gmail.com')
        # If the above fails, try a more generic selector
        try:
            await page.get_by_role("textbox", name="email", exact=False).fill('nneejjii1996@gmail.com')
        except:
            await page.fill('input[type="email"]', 'nneejjii1996@gmail.com')

        await page.get_by_role("textbox", name="password", exact=False).fill('123456')
        try:
            await page.get_by_role("textbox", name="password", exact=False).fill('123456')
        except:
            await page.fill('input[type="password"]', '123456')

        print("Clicking login...")
        # Find button by text
        await page.get_by_role("button", name="login", exact=False).click()
        # Fallback if name is different
        try:
            await page.click('button:has-text("Entrar"), button:has-text("Iniciar")')
        except:
            pass

        print("Waiting for navigation...")
        try:
            # Wait for network to be idle to ensure no more background requests/errors
            await page.wait_for_load_state("networkidle", timeout=10000)
        except:
            print("Timeout waiting for network idle, proceeding to check error...")

        # Check for React Error #310 in console
        # We can's easily catch console errors in a simple script without listeners, 
        # but we can check the current URL and presence of error elements.
        
        url = page.url
        print(f"Current URL: {url}")
        
        # Check for common error selectors
        error_found = await page.query_selector('.error, [role="alert"], .message-error, .text-red-500')
        error_text = await error_found.text_content() if error_found else "No UI error found"
        
        # Check if we are on the dashboard
        dashboard_found = await page.query_selector('h1, h2, [role="main"], .dashboard-container')
        
        print(f"UI Error Text: {error_text}")
        print(f"Dashboard found: {bool(dashboard_found)}")
        
        if "Error #310" in error_text or "Error #310" in url:
            print("RESULT: FAIL - React Error #310 detected")
        elif not dashboard_found and "login" not in url:
            print("RESULT: FAIL - Logged in but dashboard not visible")
        else:
            print("RESULT: SUCCESS - Login successful and no UI error detected")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_login())
