import { test, expect, Page } from "@playwright/test";

/**
 * Visual regression tests for the Character ROM Editor
 *
 * These tests capture screenshots of various editor states to detect
 * unintended visual changes. Screenshots are compared against baseline
 * images stored in e2e/visual-character-editor.spec.ts-snapshots/
 *
 * Visual states covered:
 * 1. Library view - character set listing
 * 2. Editor default state - first character selected
 * 3. Character selected - different character highlighted
 * 4. Transform toolbar visible
 * 5. Mobile responsive layouts
 * 6. Dark and light themes
 */

/**
 * Helper function to navigate to the edit page
 * Navigates from library to edit page by clicking on a character set
 */
async function navigateToEditPage(page: Page): Promise<void> {
  // Go to library first
  await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });

  // Wait for content to load
  await page.waitForTimeout(1500);

  // Find and click on a character set to edit
  const editLink = page.locator('a[href*="/edit?id="]').first();

  if (await editLink.isVisible({ timeout: 5000 })) {
    await editLink.click();
  } else {
    // Try alternative navigation - click on a card
    const card = page.locator('[class*="card"], [class*="Card"]').first();
    if (await card.isVisible()) {
      await card.click();
    }
  }

  // Wait for edit page to load
  await page.waitForURL(/\/edit\?id=/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // Additional wait for React to hydrate and animations to complete
  await page.waitForTimeout(1000);
}

/**
 * Helper to wait for page to stabilize (animations, lazy loading)
 */
async function waitForStableState(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  // Wait for any CSS animations to complete
  await page.waitForTimeout(500);
}

test.describe("Character Editor Visual Regression - Library", () => {
  test("library page default state", async ({ page }) => {
    await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });
    await waitForStableState(page);

    // Wait for character sets to load
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot("library-default.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("library page mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });
    await waitForStableState(page);

    // Wait for character sets to load
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot("library-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("library page tablet view", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });
    await waitForStableState(page);

    // Wait for character sets to load
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot("library-tablet.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Editor Default", () => {
  test("editor default state", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-default.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("editor with canvas visible", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Focus on the main editor area (canvas + sidebar)
    const mainContent = page.locator("main").first();
    await expect(mainContent).toBeVisible();

    await expect(mainContent).toHaveScreenshot("editor-main-content.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Character Selection", () => {
  test("character selected state", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Find and click on a different character in the grid (not the first one)
    const gridItems = page.locator('[role="option"], [data-grid-index]');
    const itemCount = await gridItems.count();

    if (itemCount > 5) {
      // Select the 6th character to show a different selection
      await gridItems.nth(5).click();
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveScreenshot("editor-character-selected.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("sidebar with selection highlighted", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Select a character in the middle of the grid
    const gridItems = page.locator('[role="option"], [data-grid-index]');
    const itemCount = await gridItems.count();

    if (itemCount > 10) {
      await gridItems.nth(10).click();
      await page.waitForTimeout(300);
    }

    // Capture just the sidebar area
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot("editor-sidebar-selection.png", {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});

test.describe("Character Editor Visual Regression - Mobile Views", () => {
  test("editor mobile view - iPhone SE", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-mobile-iphone-se.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("editor mobile view - iPhone 16", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-mobile-iphone-16.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("editor mobile view - iPhone 16 Pro Max", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 932 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-mobile-iphone-16-pro-max.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Tablet Views", () => {
  test("editor tablet view - iPad Mini", async ({ page }) => {
    await page.setViewportSize({ width: 744, height: 1133 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-tablet-ipad-mini.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("editor tablet view - iPad", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-tablet-ipad.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("editor tablet view - iPad Pro 12", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-tablet-ipad-pro-12.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Desktop Wide", () => {
  test("editor wide desktop view", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateToEditPage(page);
    await waitForStableState(page);

    await expect(page).toHaveScreenshot("editor-desktop-wide.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Theme", () => {
  test("editor dark theme (default)", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Ensure dark theme is active (default)
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = !htmlClass?.includes("light");

    if (isDark) {
      await expect(page).toHaveScreenshot("editor-dark-theme.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test("editor light theme", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Toggle to light theme by adding the class
    await page.evaluate(() => {
      document.documentElement.classList.add("light");
      localStorage.setItem("retrostack-theme", "light");
    });

    // Wait for theme transition
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("editor-light-theme.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - UI Components", () => {
  test("toolbar buttons visible", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Capture the toolbar area
    const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"], [role="toolbar"]').first();
    if (await toolbar.isVisible()) {
      await expect(toolbar).toHaveScreenshot("editor-toolbar.png", {
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test("transform toolbar visible", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // The transform toolbar is on the right sidebar
    // Look for transform buttons
    const transformButtons = page.locator('button[title*="Rotate"], button[title*="Flip"], button[title*="Invert"]');
    const firstTransform = transformButtons.first();

    if (await firstTransform.isVisible({ timeout: 3000 })) {
      // Find the parent container of transform tools
      const transformSection = page.locator('[class*="transform"], [class*="Transform"]').first();
      if (await transformSection.isVisible()) {
        await expect(transformSection).toHaveScreenshot("editor-transform-toolbar.png", {
          maxDiffPixelRatio: 0.02,
        });
      }
    }
  });

  test("editor canvas area", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Capture the canvas element
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    await expect(canvas).toHaveScreenshot("editor-canvas.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("character grid in sidebar", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Find the character grid
    const characterGrid = page.locator('[role="listbox"][aria-label*="haracter"]').first();
    if (await characterGrid.isVisible({ timeout: 3000 })) {
      await expect(characterGrid).toHaveScreenshot("editor-character-grid.png", {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});

test.describe("Character Editor Visual Regression - Help Modal", () => {
  test("help modal open", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Open help modal with ? key
    await page.keyboard.press("Shift+/");
    await page.waitForTimeout(300);

    // Modal should be visible
    const helpModal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
    await expect(helpModal).toBeVisible({ timeout: 3000 });

    await expect(page).toHaveScreenshot("editor-help-modal.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe("Character Editor Visual Regression - Loading State", () => {
  test("editor loading state", async ({ page }) => {
    // Navigate directly to edit page without waiting for full load
    await page.goto("/tools/character-rom-editor", { waitUntil: "domcontentloaded" });

    // Find and click on a character set quickly
    const editLink = page.locator('a[href*="/edit?id="]').first();
    await editLink.waitFor({ state: "visible", timeout: 5000 });
    await editLink.click();

    // Capture the loading state quickly before content loads
    // This may show the loading spinner
    await page.waitForTimeout(100);

    // Check if loading state is visible
    const loadingSpinner = page.locator('[class*="animate-spin"], [class*="loading"]');
    if (await loadingSpinner.isVisible({ timeout: 500 })) {
      await expect(page).toHaveScreenshot("editor-loading.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.05, // More tolerance for loading states
      });
    }
  });
});

test.describe("Character Editor Visual Regression - Error State", () => {
  test("editor error state - invalid ID", async ({ page }) => {
    // Navigate to edit page with invalid ID
    await page.goto("/tools/character-rom-editor/edit?id=invalid-id-12345", {
      waitUntil: "networkidle",
    });

    // Wait for error state to render
    await page.waitForTimeout(2000);

    // Check if error message is visible
    const errorMessage = page.locator("text=/not found|error/i").first();
    if (await errorMessage.isVisible({ timeout: 3000 })) {
      await expect(page).toHaveScreenshot("editor-error-state.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});

test.describe("Character Editor Visual Regression - Header States", () => {
  test("editor header with dirty state", async ({ page }) => {
    await navigateToEditPage(page);
    await waitForStableState(page);

    // Make a change to trigger dirty state
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(300);
    }

    // Capture the header which should show dirty indicator
    const header = page.locator("header, [class*='header'], [class*='Header']").first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot("editor-header-dirty.png", {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});
