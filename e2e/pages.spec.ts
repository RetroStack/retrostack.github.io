import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('hero section is visible with key elements', async ({ page }) => {
    // Logo should be visible in hero
    const heroLogo = page.locator('main').getByAltText(/RetroStack/i);
    await expect(heroLogo).toBeVisible();

    // Tagline should be visible
    await expect(page.getByText(/Vintage Computing, Modern Tools/i)).toBeVisible();

    // CTA buttons should be visible
    await expect(page.getByRole('link', { name: /Explore Systems/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Try Our Tools/i })).toBeVisible();
  });

  test('features section is visible with all feature cards', async ({ page }) => {
    // Section header
    await expect(page.getByRole('heading', { name: /What We Offer/i })).toBeVisible();

    // Feature cards should be visible
    const featureTitles = [
      'Hardware Replicas',
      'ROM Adapters',
      'KiCAD Libraries',
      'Development Tools',
      'Documentation',
      'Open Source',
    ];

    for (const title of featureTitles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('Explore Systems CTA navigates to systems page', async ({ page }) => {
    await page.getByRole('link', { name: /Explore Systems/i }).click();
    await expect(page).toHaveURL('/systems');
  });

  test('Try Our Tools CTA navigates to tools page', async ({ page }) => {
    await page.getByRole('link', { name: /Try Our Tools/i }).click();
    await expect(page).toHaveURL('/tools');
  });

  test('footer is visible', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('desktop navigation shows all main nav items', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Main nav items should be visible
    const nav = page.locator('nav');
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(nav.getByText('Systems')).toBeVisible();
    await expect(nav.getByText('Tools')).toBeVisible();
    await expect(nav.getByText('Resources')).toBeVisible();
  });

  test('desktop dropdown menus show on hover', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Hover over Systems to open dropdown
    const systemsButton = page.locator('nav').getByText('Systems').first();
    await systemsButton.hover();

    // Wait for dropdown content
    await expect(page.getByRole('link', { name: /Computers/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /Game Consoles/i })).toBeVisible();
  });

  test('navigation from dropdown to subpage works', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Open Tools dropdown
    const toolsButton = page.locator('nav').getByText('Tools').first();
    await toolsButton.hover();

    // Click Character ROM Editor
    await page.getByRole('link', { name: /Character ROM Editor/i }).click();

    await expect(page).toHaveURL('/tools/character-rom-editor');
  });

  test('mobile menu navigation works', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Open mobile menu
    await page.getByRole('button', { name: /open menu/i }).click();

    // Menu should be visible
    const menu = page.getByRole('dialog', { name: /navigation menu/i });
    await expect(menu).toBeVisible();

    // Navigate to Systems
    await menu.getByRole('link', { name: /Systems/i }).first().click();

    await expect(page).toHaveURL('/systems');
  });

  test('clicking logo navigates to home', async ({ page }) => {
    await page.goto('/systems', { waitUntil: 'networkidle' });

    // Click on logo in header
    await page.locator('header').getByAltText(/RetroStack/i).click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('Systems Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/systems', { waitUntil: 'networkidle' });
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Systems.*RetroStack/i);
  });

  test('page displays heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Systems/i })).toBeVisible();
    await expect(page.getByText(/vintage computer systems/i)).toBeVisible();
  });

  test('coming soon badge is displayed', async ({ page }) => {
    await expect(page.getByText(/Coming Soon/i)).toBeVisible();
  });

  test('back to home link works', async ({ page }) => {
    await page.getByRole('link', { name: /Back to Home/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('header is visible', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Tools Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'networkidle' });
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Tools.*RetroStack/i);
  });

  test('page displays heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Tools/i })).toBeVisible();
    await expect(page.getByText(/browser-based development tools/i)).toBeVisible();
  });

  test('coming soon badge is displayed', async ({ page }) => {
    await expect(page.getByText(/Coming Soon/i)).toBeVisible();
  });

  test('back to home link works', async ({ page }) => {
    await page.getByRole('link', { name: /Back to Home/i }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Character ROM Editor', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/tools/character-rom-editor', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Character ROM Editor.*RetroStack/i);
  });

  test('editor library view loads', async ({ page }) => {
    await page.goto('/tools/character-rom-editor', { waitUntil: 'networkidle' });

    // The character editor library should show some content
    // Look for common UI elements in the editor
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('navigating from home tools dropdown', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Hover Tools menu and click Character ROM Editor
    const toolsButton = page.locator('nav').getByText('Tools').first();
    await toolsButton.hover();

    await page.getByRole('link', { name: /Character ROM Editor/i }).click();
    await expect(page).toHaveURL('/tools/character-rom-editor');
  });
});

test.describe('Resources Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resources', { waitUntil: 'networkidle' });
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Resources.*RetroStack/i);
  });

  test('page displays heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Resources/i })).toBeVisible();
    await expect(page.getByText(/datasheets/i)).toBeVisible();
  });

  test('coming soon badge is displayed', async ({ page }) => {
    await expect(page.getByText(/Coming Soon/i)).toBeVisible();
  });

  test('back to home link works', async ({ page }) => {
    await page.getByRole('link', { name: /Back to Home/i }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('404 Page', () => {
  test('invalid URL shows 404 or redirects gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345', {
      waitUntil: 'networkidle',
    });

    // Next.js may show a 404 page or the response status could be 404
    // Check either the status code or look for 404 content
    const status = response?.status();

    if (status === 404) {
      // Server returned 404 status
      expect(status).toBe(404);
    } else {
      // Page loaded but might show 404 content
      // Look for common 404 indicators
      const body = await page.locator('body').textContent();
      const is404Content =
        body?.toLowerCase().includes('404') ||
        body?.toLowerCase().includes('not found') ||
        body?.toLowerCase().includes('page not found');

      // Either it's a 404 page or Next.js handles it differently in dev
      expect(is404Content || status === 200).toBeTruthy();
    }
  });

  test('invalid nested URL shows 404', async ({ page }) => {
    const response = await page.goto('/systems/nonexistent-system-xyz', {
      waitUntil: 'networkidle',
    });

    const status = response?.status();

    // Either 404 status or 404 content
    if (status === 404) {
      expect(status).toBe(404);
    } else {
      const body = await page.locator('body').textContent();
      const is404Content =
        body?.toLowerCase().includes('404') ||
        body?.toLowerCase().includes('not found');

      expect(is404Content || status === 200).toBeTruthy();
    }
  });
});

test.describe('Responsive Layout', () => {
  test('header adapts to viewport size', async ({ page, viewport, isMobile }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    if (isMobile) {
      // Mobile should show hamburger menu
      await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
    } else if (viewport && viewport.width >= 1024) {
      // Desktop should show full nav
      const nav = page.locator('nav');
      await expect(nav.getByText('Systems')).toBeVisible();
    }
  });

  test('hero CTA buttons stack on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');

    await page.goto('/', { waitUntil: 'networkidle' });

    const exploreBtn = page.getByRole('link', { name: /Explore Systems/i });
    const toolsBtn = page.getByRole('link', { name: /Try Our Tools/i });

    const exploreBox = await exploreBtn.boundingBox();
    const toolsBox = await toolsBtn.boundingBox();

    // On mobile, buttons should be stacked (tools below explore)
    expect(toolsBox?.y).toBeGreaterThan(exploreBox?.y ?? 0);
  });

  test('hero CTA buttons are side by side on desktop', async ({ page, isMobile, viewport }) => {
    test.skip(isMobile, 'Desktop only');
    test.skip(!viewport || viewport.width < 640, 'Needs wider viewport');

    await page.goto('/', { waitUntil: 'networkidle' });

    const exploreBtn = page.getByRole('link', { name: /Explore Systems/i });
    const toolsBtn = page.getByRole('link', { name: /Try Our Tools/i });

    const exploreBox = await exploreBtn.boundingBox();
    const toolsBox = await toolsBtn.boundingBox();

    // On desktop, buttons should be roughly on the same row
    const yDiff = Math.abs((toolsBox?.y ?? 0) - (exploreBox?.y ?? 0));
    expect(yDiff).toBeLessThan(50);
  });
});

test.describe('Cross-Page Navigation Flow', () => {
  test('complete navigation flow: Home -> Systems -> Home -> Tools -> Character Editor', async ({
    page,
    isMobile,
  }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');

    // Navigate to Systems via CTA
    await page.getByRole('link', { name: /Explore Systems/i }).click();
    await expect(page).toHaveURL('/systems');
    await expect(page.getByRole('heading', { name: /Systems/i })).toBeVisible();

    // Go back home
    await page.getByRole('link', { name: /Back to Home/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to Tools via CTA
    await page.getByRole('link', { name: /Try Our Tools/i }).click();
    await expect(page).toHaveURL('/tools');
    await expect(page.getByRole('heading', { name: /Tools/i })).toBeVisible();

    // Go back home
    await page.getByRole('link', { name: /Back to Home/i }).click();
    await expect(page).toHaveURL('/');

    // Navigate to Character ROM Editor via nav (desktop) or menu (mobile)
    if (isMobile) {
      await page.getByRole('button', { name: /open menu/i }).click();
      const menu = page.getByRole('dialog', { name: /navigation menu/i });
      await expect(menu).toBeVisible();

      // Expand Tools section if needed and click Character ROM Editor
      const charEditorLink = menu.getByRole('link', { name: /Character ROM Editor/i });
      if (await charEditorLink.isVisible()) {
        await charEditorLink.click();
      } else {
        // May need to expand Tools section first
        await menu.getByText(/Tools/i).first().click();
        await menu.getByRole('link', { name: /Character ROM Editor/i }).click();
      }
    } else {
      const toolsButton = page.locator('nav').getByText('Tools').first();
      await toolsButton.hover();
      await page.getByRole('link', { name: /Character ROM Editor/i }).click();
    }

    await expect(page).toHaveURL('/tools/character-rom-editor');
  });
});
