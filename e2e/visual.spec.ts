import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('home page screenshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
    });
  });
});
