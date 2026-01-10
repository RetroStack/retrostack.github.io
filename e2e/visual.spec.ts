import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('home page screenshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
    });
  });

  test('home page mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
    });
  });

  test('systems page screenshot', async ({ page }) => {
    await page.goto('/systems');
    await expect(page).toHaveScreenshot('systems.png', {
      fullPage: true,
    });
  });

  test('tools page screenshot', async ({ page }) => {
    await page.goto('/tools');
    await expect(page).toHaveScreenshot('tools.png', {
      fullPage: true,
    });
  });

  test('resources page screenshot', async ({ page }) => {
    await page.goto('/resources');
    await expect(page).toHaveScreenshot('resources.png', {
      fullPage: true,
    });
  });
});
