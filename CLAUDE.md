# RetroStack Web

Marketing website for RetroStack - a collection of tools and resources for retro computing enthusiasts.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (configured in globals.css, no tailwind.config.ts)
- **Testing**: Jest (unit) + Playwright (e2e & visual)
- **Deployment**: GitHub Pages (static export)

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # TypeScript checking
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run test:e2e     # Playwright e2e tests
npm run test:visual  # Visual regression tests
npm run validate     # Full validation (lint + typecheck + tests)
```

## Project Structure

```text
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css      # All styling (Tailwind v4 + CSS variables)
│   ├── systems/         # Systems pages
│   ├── tools/           # Tools pages (character-rom-editor, etc.)
│   └── resources/       # Resources pages
├── components/
│   ├── layout/          # Header, Footer, Navigation, ToolLayout
│   ├── sections/        # Page sections
│   ├── ui/              # Reusable primitives (Button, Card, ToggleSwitch, etc.)
│   │   └── icons/       # Centralized icon components
│   ├── effects/         # Visual effects (GridBackground, NeonText)
│   └── character-editor/# Tool-specific components by feature
├── hooks/               # Custom React hooks
│   └── character-editor/# Tool-specific hooks
├── lib/                 # Shared utilities
│   ├── constants.ts     # Site config, nav items
│   └── character-editor/# Tool-specific utilities & types
└── e2e/                 # Playwright tests
```

## Coding Conventions

### No Barrel Files

Import directly from source files - no `index.ts` re-exports.

```typescript
// Good
import { Button } from "@/components/ui/Button";

// Avoid
import { Button } from "@/components/ui";
```

### Path Aliases

Always use `@/` for imports:

```typescript
import { Component } from "@/components/ui/Button";
import { hook } from "@/hooks/useDropdown";
```

### File Naming

- Components: PascalCase (`Button.tsx`)
- Hooks: camelCase with `use` prefix (`useDropdown.ts`)
- Utilities: camelCase (`constants.ts`)

### Directory Organization

Organize by feature, not by type. Co-locate related components.

## Page Patterns

### Tool Page Structure

```text
src/app/tools/my-tool/
├── page.tsx          # Server component with metadata
└── MyToolView.tsx    # "use client" with all logic
```

### ToolLayout

All tool pages use `ToolLayout` wrapper:

```typescript
import { ToolLayout, ToolContent, ToolSidebar } from "@/components/layout/ToolLayout";
```

### Navigation

Add new pages in `/src/lib/constants.ts`.

## Component Patterns

- Use `forwardRef` for ref forwarding
- Extend HTML attributes for flexibility
- Use `useOutsideClick` for dropdowns/menus
- Use `ToggleSwitch` instead of checkboxes
- Use `useDropdown` for dropdown state + outside click

## State Management

- Use custom hooks over React Context for complex state
- Use `useUndoRedo` for undo/redo functionality
- Use `useAutoSave` for auto-save patterns

## Storage

- IndexedDB for large data (character sets, etc.)
- localStorage for settings
- Keys centralized in `/src/lib/[tool]/storage/keys.ts`
- Naming: `retrostack-<tool>-<setting>`

## Color System

Colors defined in `/src/app/globals.css`:

- `--retro-dark` (#0a0a1a): Main background
- `--retro-navy` (#1a1a3e): Secondary background
- `--retro-grid` (#2a2a5e): Borders
- `--retro-pink` (#ff2a6d): Primary accent
- `--retro-cyan` (#00f5ff): Secondary accent
- `--retro-violet` (#9d4edd): Tertiary accent
- `--retro-amber` (#ffb800): Warning/highlight

Use via Tailwind: `bg-retro-dark`, `text-retro-pink`, etc.

## Form Styling

### Text Inputs

```css
bg-retro-dark border border-retro-grid/50 rounded text-sm text-white
placeholder-gray-500 focus:outline-none focus:border-retro-cyan
```

### Dropdowns/Selects

```css
bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200
focus:border-retro-cyan
```

### Selected Chips

```css
border-retro-pink bg-retro-pink/10 text-retro-pink
```

### Range Sliders

```css
accent-retro-cyan
```

### Toggle Switches

Use `ToggleSwitch` component - pink when on, purple when off.

### 3D Raised Buttons (action triggers)

```css
bg-gradient-to-b from-gray-600/50 to-gray-700/50
border border-retro-cyan/50 shadow-md text-retro-cyan
```

## Responsive Design

- Standard Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Use `clamp()` for fluid sizing (defined in globals.css)
- Touch targets: 44px minimum
- Use `(pointer: coarse)` for touch device detection

## Common Hooks Reference

### useDropdown

Combines dropdown state with outside click handling:

```typescript
const dropdown = useDropdown<HTMLDivElement>();
// dropdown.ref, dropdown.isOpen, dropdown.toggle(), dropdown.open(), dropdown.close()
```

### useTimer

Timer with automatic cleanup:

```typescript
const timer = useTimer();
timer.set(() => console.log("Done!"), 1000);
timer.clear();
// timer.isActive
```

### useModalManager

Manage multiple modals (only one open at a time):

```typescript
const modals = useModalManager<"edit" | "delete">();
modals.open("edit");
modals.isOpen("edit");
modals.close("edit");
// modals.closeAll(), modals.activeModal
```

### useOutsideClick

Close on click outside or Escape key:

```typescript
const ref = useOutsideClick<HTMLDivElement>(handleClose, isOpen);
```

### useToast

Toast notifications:

```typescript
const { showToast } = useToast();
showToast("Message", "success"); // success, error, warning, info
```

### Responsive Hooks

```typescript
import { useIsMobile, useIsTablet, useIsDesktop, usePrefersTouch } from "@/hooks/useMediaQuery";
```

## Selection Mode

For multi-selection in grids:

- Long-press (500ms) or "Select" button enters selection mode
- Use `useLongPress`, `useSelectionMode`, `useDragSelect` hooks
- Use `SelectionModeBar` component for floating actions

## Testing

### Structure

- Unit tests: `__tests__/<module>.test.ts`
- E2E tests: `e2e/<feature>.spec.ts`
- Visual tests: `e2e/visual-<feature>.spec.ts`
- Test fixtures: `test-fixtures/`

### Patterns

Extract business logic to pure functions in `/lib/`:

```typescript
// Good - testable pure function
export function processData(data: DataType[]): ResultType[] {
  return data.filter(x => x.valid).map(x => transform(x));
}
```

Use dependency injection for storage in hooks:

```typescript
export interface UseMyDataOptions {
  storage?: IMyStorage; // Optional - defaults to real implementation
}

export function useMyData(options?: UseMyDataOptions) {
  const storage = options?.storage ?? realStorage;
}
```

### Coverage Targets

- Pure functions: >90%
- Hooks: >80%
- Components: >70%

## Adding New Features

### New Tool Page

1. Create `src/app/tools/my-tool/page.tsx` and `MyToolView.tsx`
2. Add to navigation in `/src/lib/constants.ts`
3. Use `ToolLayout` wrapper
4. Create storage keys in `src/lib/my-tool/storage/keys.ts` if needed

### New UI Component

1. Create in `/src/components/ui/`
2. Use `forwardRef` for ref forwarding
3. Extend HTML attributes
4. Export `displayName`

### Testing Checklist

- [ ] Extract business logic to `/lib/` as pure functions
- [ ] Add unit tests for pure functions (>90% coverage)
- [ ] Add hook tests with mock dependencies
- [ ] Add E2E tests for user workflows
- [ ] Verify UI manually or with Playwright
- [ ] Run `npm run validate`

## Key Files

| File                                        | Purpose                 |
| ------------------------------------------- | ----------------------- |
| `/src/app/globals.css`                      | All styling             |
| `/src/lib/constants.ts`                     | Nav items, config       |
| `/src/components/layout/ToolLayout.tsx`     | Tool page wrapper       |
| `/src/hooks/useDropdown.ts`                 | Dropdown state          |
| `/src/hooks/useModalManager.ts`             | Modal management        |
| `/src/lib/character-editor/types.ts`        | Character editor types  |
| `/src/lib/character-editor/storage/keys.ts` | Storage keys            |
