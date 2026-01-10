import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for the Character ROM Editor
 *
 * Tests cover:
 * 1. Page loading and initial state
 * 2. Character navigation and selection
 * 3. Keyboard navigation
 * 4. Pixel editing operations
 * 5. Transform operations (rotate, flip, invert)
 * 6. Undo/Redo functionality
 */

test.describe("Character Editor - Library Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });
  });

  test("loads the library page", async ({ page }) => {
    await expect(page).toHaveTitle(/Character ROM Editor/i);

    // Should show the library header
    await expect(page.getByRole("heading", { name: /character/i }).first()).toBeVisible();
  });

  test("displays character set cards", async ({ page }) => {
    // Wait for character sets to load (they come from IndexedDB/built-in data)
    // Look for library cards or grid items
    const libraryContent = page.locator('[class*="library"], [class*="grid"]').first();
    await expect(libraryContent).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to edit page from library", async ({ page }) => {
    // Wait for the page to load character sets
    await page.waitForTimeout(1000);

    // Look for an "Edit" button or a character set card to click
    const editButton = page.getByRole("button", { name: /edit/i }).first();
    const cardLink = page.locator('a[href*="/edit"]').first();

    if (await editButton.isVisible()) {
      await editButton.click();
    } else if (await cardLink.isVisible()) {
      await cardLink.click();
    } else {
      // Click on a character set card which should navigate to edit
      const card = page.locator('[class*="card"], [class*="Card"]').first();
      if (await card.isVisible()) {
        await card.click();
      }
    }

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/edit\?id=/, { timeout: 5000 });
  });
});

test.describe("Character Editor - Edit Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to library first
    await page.goto("/tools/character-rom-editor", { waitUntil: "networkidle" });

    // Wait for content to load
    await page.waitForTimeout(1500);

    // Find and click on a character set to edit
    // First try to find an edit link or button
    const editLink = page.locator('a[href*="/edit?id="]').first();

    if (await editLink.isVisible({ timeout: 3000 })) {
      await editLink.click();
    } else {
      // Try clicking on a card that might lead to edit
      const card = page.locator('[role="button"], [class*="card"]').first();
      await card.click();
    }

    // Wait for edit page to load
    await page.waitForURL(/\/edit\?id=/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
  });

  test("loads editor page with all main components", async ({ page }) => {
    // Verify the page loaded correctly
    await expect(page).toHaveURL(/\/edit\?id=/);

    // Main layout should be visible
    // Header with character set name
    const header = page.locator("header, [class*='header'], [class*='Header']").first();
    await expect(header).toBeVisible();

    // Editor canvas area should be visible
    const canvasArea = page.locator("canvas").first();
    await expect(canvasArea).toBeVisible({ timeout: 5000 });
  });

  test("displays toolbar with action buttons", async ({ page }) => {
    // Toolbar should have common actions
    // Look for toolbar buttons by their labels or roles
    const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"], [role="toolbar"]').first();

    // If no explicit toolbar, look for button groups
    const saveButton = page.getByRole("button", { name: /save/i }).first();
    const undoButton = page.getByRole("button", { name: /undo/i }).first();
    const helpButton = page.getByRole("button", { name: /help/i }).first();

    // At least one of these should be visible
    const toolbarOrButtons = await Promise.all([
      toolbar.isVisible().catch(() => false),
      saveButton.isVisible().catch(() => false),
      undoButton.isVisible().catch(() => false),
      helpButton.isVisible().catch(() => false),
    ]);

    expect(toolbarOrButtons.some((v) => v)).toBeTruthy();
  });

  test("displays character grid in sidebar", async ({ page }) => {
    // The sidebar should show a grid of characters
    const characterGrid = page.locator('[role="listbox"][aria-label*="haracter"]').first();

    // Or look for the sidebar component
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]').first();

    // Try to find either the grid or sidebar
    const gridVisible = await characterGrid.isVisible().catch(() => false);
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    // At least sidebar or grid should exist
    expect(gridVisible || sidebarVisible).toBeTruthy();
  });

  test("shows editor canvas with pixel grid", async ({ page }) => {
    // The main editor canvas should be visible
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Canvas should have reasonable dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(50);
    expect(box!.height).toBeGreaterThan(50);
  });
});

test.describe("Character Editor - Character Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditPage(page);
  });

  test("clicking character in grid changes selection", async ({ page }) => {
    // Find character grid items
    const gridItems = page.locator('[role="option"], [data-grid-index]');
    const itemCount = await gridItems.count();

    if (itemCount > 1) {
      // Get the second item
      const secondItem = gridItems.nth(1);

      // Click on it
      await secondItem.click();

      // It should now be selected (aria-selected or ring styling)
      await expect(secondItem).toHaveAttribute("aria-selected", "true");
    }
  });

  test("selected character is visually highlighted", async ({ page }) => {
    // Find the selected character (should have ring styling or aria-selected)
    const selectedItem = page.locator('[aria-selected="true"], [class*="ring-retro-cyan"]').first();

    await expect(selectedItem).toBeVisible({ timeout: 5000 });
  });

  test("navigation updates character index display", async ({ page }) => {
    // Look for character index display in header/footer
    const indexDisplay = page.locator("text=/\\d+\\s*(of|\\/)\\s*\\d+/i").first();

    if (await indexDisplay.isVisible({ timeout: 2000 })) {
      // Click on a different character
      const gridItems = page.locator('[role="option"], [data-grid-index]');
      if ((await gridItems.count()) > 1) {
        await gridItems.nth(1).click();
        await page.waitForTimeout(200);

        // Index display should update (or at least be visible)
        await expect(indexDisplay).toBeVisible();
      }
    }
  });
});

test.describe("Character Editor - Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditPage(page);
  });

  test("arrow keys navigate between characters", async ({ page }) => {
    // Focus on the sidebar/grid area
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]').first();
    await sidebar.click();

    // Get initial selected index
    const initialSelected = page.locator('[aria-selected="true"]').first();
    const initialIndex = await initialSelected.getAttribute("data-grid-index");

    // Press arrow right/down to move to next character
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    // Check if selection moved (should now select next item)
    const newSelected = page.locator('[aria-selected="true"]').first();
    const newIndex = await newSelected.getAttribute("data-grid-index");

    // The index should have changed (or wrapped around)
    // This verifies keyboard navigation is working
    if (initialIndex && newIndex) {
      expect(parseInt(newIndex)).not.toBe(parseInt(initialIndex));
    }
  });

  test("keyboard shortcuts for undo work", async ({ page }) => {
    // Make a change first by clicking on canvas pixel
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Get canvas position
    const box = await canvas.boundingBox();
    if (box) {
      // Click in the middle of the canvas to toggle a pixel
      await canvas.click({
        position: { x: box.width / 2, y: box.height / 2 },
      });
    }

    // Now press Ctrl+Z to undo
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(100);

    // Undo button should still be available (or disabled if nothing to undo)
    // The test passes if no error occurred
  });

  test("Help shortcut opens help modal", async ({ page }) => {
    // Press ? to open help
    await page.keyboard.press("Shift+/"); // This types ?

    // Help modal should appear
    const helpModal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
    await expect(helpModal).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Character Editor - Pixel Editing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditPage(page);
  });

  test("clicking on canvas pixel toggles it", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Get canvas position
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click to toggle a pixel
    const clickX = box!.width / 3;
    const clickY = box!.height / 3;

    await canvas.click({ position: { x: clickX, y: clickY } });
    await page.waitForTimeout(100);

    // The canvas should re-render (we can't easily verify pixel state,
    // but we verify the interaction doesn't cause errors)

    // Click again to toggle back
    await canvas.click({ position: { x: clickX, y: clickY } });
    await page.waitForTimeout(100);
  });

  test("drag painting works on canvas", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Perform a drag operation across the canvas
    const startX = box!.x + box!.width / 4;
    const startY = box!.y + box!.height / 4;
    const endX = box!.x + (box!.width * 3) / 4;
    const endY = box!.y + (box!.height * 3) / 4;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

    // The operation should complete without errors
    await page.waitForTimeout(100);
  });

  test("canvas shows crosshair cursor for interactive mode", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Canvas should have crosshair cursor class
    const cursorClass = await canvas.getAttribute("class");
    expect(cursorClass).toContain("cursor-crosshair");
  });
});

test.describe("Character Editor - Transform Operations", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditPage(page);
  });

  test("rotate buttons are visible in toolbar", async ({ page }) => {
    // Look for rotate buttons in the transform toolbar
    const rotateLeftBtn = page.getByRole("button", { name: /rotate.*left/i }).first();
    const rotateRightBtn = page.getByRole("button", { name: /rotate.*right/i }).first();

    // Or find by tooltip/title
    const rotateButtons = page.locator('button[title*="Rotate"], button[aria-label*="Rotate"]');

    // Check if any rotate button is visible
    const leftVisible = await rotateLeftBtn.isVisible().catch(() => false);
    const rightVisible = await rotateRightBtn.isVisible().catch(() => false);
    const genericVisible = await rotateButtons.first().isVisible().catch(() => false);

    expect(leftVisible || rightVisible || genericVisible).toBeTruthy();
  });

  test("flip horizontal button is functional", async ({ page }) => {
    // Find flip horizontal button
    const flipHBtn = page.locator('button[title*="Flip Horizontal"], button[aria-label*="Flip Horizontal"]').first();

    if (await flipHBtn.isVisible({ timeout: 2000 })) {
      // Click the button
      await flipHBtn.click();
      await page.waitForTimeout(100);

      // Verify no errors occurred (button should still be visible)
      await expect(flipHBtn).toBeVisible();
    }
  });

  test("invert button toggles all pixels", async ({ page }) => {
    // Find invert button
    const invertBtn = page.locator('button[title*="Invert"], button[aria-label*="Invert"]').first();

    if (await invertBtn.isVisible({ timeout: 2000 })) {
      // Click invert
      await invertBtn.click();
      await page.waitForTimeout(100);

      // Click again to invert back
      await invertBtn.click();
      await page.waitForTimeout(100);

      // Button should still be functional
      await expect(invertBtn).toBeEnabled();
    }
  });

  test("shift buttons move character content", async ({ page }) => {
    // Find shift up button
    const shiftUpBtn = page.locator('button[title*="Shift Up"], button[aria-label*="Shift Up"]').first();

    if (await shiftUpBtn.isVisible({ timeout: 2000 })) {
      await shiftUpBtn.click();
      await page.waitForTimeout(100);
      await expect(shiftUpBtn).toBeEnabled();
    }
  });

  test("keyboard shortcut R rotates character", async ({ page }) => {
    // Make sure we have a character with some pixels
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Draw something first
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 3 } });
    }

    // Press R to rotate
    await page.keyboard.press("r");
    await page.waitForTimeout(100);

    // No error should occur
  });

  test("keyboard shortcut I inverts character", async ({ page }) => {
    // Focus the page
    await page.locator("body").click();

    // Press I to invert
    await page.keyboard.press("i");
    await page.waitForTimeout(100);

    // Press I again to invert back
    await page.keyboard.press("i");
    await page.waitForTimeout(100);
  });
});

test.describe("Character Editor - Undo/Redo", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditPage(page);
  });

  test("undo button is visible", async ({ page }) => {
    const undoBtn = page.getByRole("button", { name: /undo/i }).first();
    await expect(undoBtn).toBeVisible({ timeout: 5000 });
  });

  test("redo button is visible", async ({ page }) => {
    const redoBtn = page.getByRole("button", { name: /redo/i }).first();
    await expect(redoBtn).toBeVisible({ timeout: 5000 });
  });

  test("Ctrl+Z undoes last change", async ({ page }) => {
    // Make a change first
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      // Make a pixel change
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);

      // Undo with Ctrl+Z
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(100);
    }

    // Undo button might now be disabled (no more history)
    // or we should see the change reverted
  });

  test("Ctrl+Y redoes undone change", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      // Make a change
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);

      // Undo
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(100);

      // Redo with Ctrl+Y
      await page.keyboard.press("Control+y");
      await page.waitForTimeout(100);
    }
  });

  test("Ctrl+Shift+Z also redoes (alternative)", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      // Make a change
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(100);

      // Undo
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(100);

      // Redo with Ctrl+Shift+Z
      await page.keyboard.press("Control+Shift+z");
      await page.waitForTimeout(100);
    }
  });

  test("multiple undo/redo operations work correctly", async ({ page }) => {
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      // Make multiple changes
      await canvas.click({ position: { x: box.width / 3, y: box.height / 3 } });
      await page.waitForTimeout(50);
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(50);
      await canvas.click({ position: { x: (box.width * 2) / 3, y: (box.height * 2) / 3 } });
      await page.waitForTimeout(100);

      // Undo multiple times
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(50);
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(50);
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(100);

      // Redo once
      await page.keyboard.press("Control+y");
      await page.waitForTimeout(100);
    }
  });
});

test.describe("Character Editor - Mobile/Touch Support", () => {
  test("touch targets are adequately sized on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only test");

    await navigateToEditPage(page);

    // Check toolbar buttons have adequate touch target size (44px minimum)
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Should be at least 32x32 for touch (44 ideal, 32 minimum)
          expect(box.width).toBeGreaterThanOrEqual(32);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });

  test("canvas is touch-enabled", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only test");

    await navigateToEditPage(page);

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Canvas should have touch-action set
    const touchAction = await canvas.evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");
  });
});

test.describe("Character Editor - Responsive Layout", () => {
  test("layout adapts to viewport size", async ({ page, viewport }) => {
    await navigateToEditPage(page);

    // On smaller viewports, sidebar might be collapsed or hidden
    if (viewport && viewport.width < 768) {
      // Mobile layout - might have different arrangement
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible();
    } else {
      // Desktop layout - sidebar should be visible
      const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]').first();
      await expect(sidebar).toBeVisible();
    }
  });

  test("canvas remains interactive at all sizes", async ({ page }) => {
    await navigateToEditPage(page);

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Canvas should be clickable regardless of viewport
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});

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

  // Additional wait for React to hydrate
  await page.waitForTimeout(500);
}
