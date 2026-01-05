import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/RetroStack/);
  });

  test('should have navigation', async ({ page, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    if (isMobile) {
      // On mobile, the hamburger button should be visible
      const hamburger = page.getByRole('button', { name: /open menu/i });
      await expect(hamburger).toBeVisible();
    } else {
      // On desktop, the main navigation should be visible
      const nav = page.locator('nav');
      await expect(nav.first()).toBeVisible();
    }
  });

  test('should have responsive header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Header should always be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Logo should be visible
    const logo = page.getByAltText(/RetroStack/i);
    await expect(logo).toBeVisible();
  });

  test('should have touch-friendly targets on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Only run on mobile');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Check hamburger button has proper touch target
    const hamburger = page.getByRole('button', { name: /open menu/i });
    const box = await hamburger.boundingBox();

    // 44px is the minimum iOS touch target
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('mobile menu should open and close', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Only run on mobile');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Open mobile menu
    await page.getByRole('button', { name: /open menu/i }).click();

    // Menu should be visible
    const menu = page.getByRole('dialog', { name: /navigation menu/i });
    await expect(menu).toBeVisible();

    // Close menu
    await page.getByRole('button', { name: /close menu/i }).click();

    // Menu should be hidden
    await expect(menu).not.toBeVisible();
  });
});
