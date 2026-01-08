# RetroStack Web

Marketing website for RetroStack - a collection of tools and resources for retro computing enthusiasts.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (configured in globals.css, no tailwind.config.ts)
- **Testing**: Jest (unit) + Playwright (e2e & visual)
- **Deployment**: GitHub Pages (static export)

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run test             # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage
npm run test:e2e         # Playwright e2e tests
npm run test:e2e:ui      # Playwright with UI
npm run test:visual      # Visual regression tests
npm run test:all         # Run all tests
npm run validate         # Full validation suite
npm run deploy           # Deploy to GitHub Pages
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout with fonts & ToastProvider
│   ├── globals.css      # All styling (Tailwind v4 + CSS variables)
│   ├── page.tsx         # Homepage
│   ├── systems/         # Systems pages (computers, game-consoles, sdks, etc.)
│   ├── tools/           # Tools pages (character-rom-editor, etc.)
│   └── resources/       # Resources pages (datasheets, documentation)
├── components/
│   ├── layout/          # Global layout: Header, Footer, Navigation, MobileMenu, ToolLayout
│   ├── sections/        # Page sections: Hero, Features, SystemsPreview, ToolsPreview
│   ├── ui/              # Reusable primitives: Button, Card, Container, ToggleSwitch, Toast
│   ├── effects/         # Visual effects: GridBackground, NeonText, NeonFlicker
│   └── character-editor/# Tool-specific components organized by feature
│       ├── character/   # Character display & grid
│       ├── editor/      # Pixel editor & controls
│       ├── library/     # Character set library
│       ├── selectors/   # Input selectors
│       ├── import/      # Import utilities
│       └── help/        # Tutorials & help
├── hooks/               # Custom React hooks
│   ├── useOutsideClick.ts
│   ├── useMediaQuery.ts
│   ├── useResizeObserver.ts
│   └── character-editor/# Tool-specific hooks
├── lib/                 # Shared utilities
│   ├── constants.ts     # Site config, nav items, social links
│   └── character-editor/# Tool-specific utilities
│       ├── types.ts     # Core data types
│       ├── storage/     # IndexedDB & localStorage
│       └── data/        # Built-in data (JSON files)
└── e2e/                 # Playwright e2e tests
```

## Coding Conventions

### No Barrel Files

Do not create `index.ts` files that re-export from other files. Import directly from the source file instead of using barrel exports. This keeps the dependency graph explicit and avoids circular import issues.

```typescript
// ✓ Good - direct imports
import { Button } from "@/components/ui/Button";
import { useCharacterEditor } from "@/hooks/character-editor/useCharacterEditor";

// ✗ Avoid - barrel exports
import { Button } from "@/components/ui";
```

### Path Aliases

Use `@/` path alias for all imports:

```typescript
// ✓ Good
import { Component } from "@/components/ui/Button";
import { hook } from "@/hooks/character-editor/useCharacterEditor";
import { constant } from "@/lib/constants";

// ✗ Avoid
import { Component } from "../../../components/ui/Button";
```

### File Naming

- **Components**: PascalCase (`Button.tsx`, `EditorCanvas.tsx`)
- **Hooks**: camelCase with `use` prefix (`useCharacterEditor.ts`)
- **Utilities**: camelCase (`constants.ts`, `transforms.ts`)
- **Types**: Same file as usage, or `types.ts` for shared types

### Directory Organization

Organize by feature, not by type. Co-locate related components:

```
// ✓ Good - feature-based
character-editor/
├── editor/      # Editor-related components together
├── library/     # Library-related components together
└── import/      # Import-related components together

// ✗ Avoid - type-based separation
character-editor/
├── components/  # All components
├── hooks/       # All hooks
└── utils/       # All utilities
```

## Page Architecture

### Page Structure Pattern

Tool pages follow a consistent pattern with metadata in `page.tsx` and logic in a separate View component:

```typescript
// page.tsx - Server component with metadata
import type { Metadata } from "next";
import { MyToolView } from "./MyToolView";

export const metadata: Metadata = {
  title: "My Tool - RetroStack",
  description: "Tool description",
};

export default function MyToolPage() {
  return <MyToolView />;
}
```

```typescript
// MyToolView.tsx - Client component with logic
"use client";

import { ToolLayout, ToolContent } from "@/components/layout/ToolLayout";

export function MyToolView() {
  // All state and logic here
  return (
    <ToolLayout title="My Tool" toolbar={toolbarActions}>
      <ToolContent>{/* Page content */}</ToolContent>
    </ToolLayout>
  );
}
```

### ToolLayout Pattern

All tool pages use `ToolLayout` for consistent structure:

```typescript
import { ToolLayout, ToolContent, ToolSidebar } from "@/components/layout/ToolLayout";

<ToolLayout
  title="Tool Name"
  toolbar={toolbarActions}
  helpKey="tool-name" // For help/tutorial system
>
  <ToolSidebar>{/* Optional sidebar */}</ToolSidebar>
  <ToolContent>{/* Main content area */}</ToolContent>
</ToolLayout>;
```

### Navigation Configuration

Add new pages to navigation in `/src/lib/constants.ts`:

```typescript
export const toolsNavItems = [
  {
    label: "My Tool",
    href: "/tools/my-tool",
    description: "Tool description for dropdown menu",
  },
];
```

## Component Patterns

### UI Primitives

Reusable UI components in `/src/components/ui/` follow this pattern:

```typescript
import { forwardRef, type HTMLAttributes } from "react";

type ButtonVariant = "pink" | "cyan" | "violet" | "ghost";

interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "pink", className, ...props }, ref) => {
  const styles = `${baseStyles} ${variantStyles[variant]} ${className}`;
  return <button ref={ref} className={styles} {...props} />;
});

Button.displayName = "Button";
```

### Co-located Sub-components

Related components can be co-located in one file:

```typescript
// Card.tsx exports Card, CardHeader, CardTitle, CardContent
export const Card = forwardRef<HTMLDivElement, CardProps>(/* ... */);
export const CardHeader = ({ children }) => /* ... */;
export const CardTitle = ({ children }) => /* ... */;
export const CardContent = ({ children }) => /* ... */;
```

### Dropdown/Menu Pattern

Use `useOutsideClick` for closing dropdowns:

```typescript
import { useOutsideClick } from "@/hooks/useOutsideClick";

function Dropdown({ isOpen, onClose }) {
  const ref = useOutsideClick<HTMLDivElement>(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute ...">
      {/* Dropdown content */}
    </div>
  );
}
```

### Modal Pattern

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: DataType;
  onConfirm?: (value: DataType) => void;
}

export function Modal({ isOpen, onClose, data, onConfirm }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-retro-navy rounded-lg p-6">{/* Modal content */}</div>
    </div>
  );
}
```

### Responsive Toolbar Pattern

Use `ResponsiveToolbar` for toolbars that adapt to screen size:

```typescript
interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  priority?: number; // Higher = stays visible longer
  tooltip?: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
}

<ResponsiveToolbar
  actions={toolbarActions}
  overflowThreshold={6} // Max visible before overflow
/>;
```

## State Management

### Hooks Over Context

Use custom hooks for state management. Avoid React Context for complex state:

```typescript
// Hook pattern for complex state
export interface UseEditorResult {
  // State
  characters: Character[];
  selectedIndex: number;
  isDirty: boolean;

  // Actions
  setSelectedIndex: (index: number) => void;
  togglePixel: (x: number, y: number) => void;
  undo: () => void;
  redo: () => void;
}

export function useEditor(initialData): UseEditorResult {
  // Implementation with useCallback for stable references
}
```

### Undo/Redo Pattern

Use `useUndoRedo` hook for generic undo/redo functionality:

```typescript
const { state, setState, undo, redo, canUndo, canRedo, startBatch, endBatch } = useUndoRedo<StateType>(initialState);

// For batched operations (e.g., drawing multiple pixels)
startBatch();
// ... multiple state changes ...
endBatch(); // Creates single undo entry
```

### Auto-save Pattern

```typescript
const { triggerSave, isSaving } = useAutoSave({
  data: characterSet,
  onSave: async (data) => await saveToStorage(data),
  debounceMs: 2000,
  enabled: isDirty,
});
```

## Data Loading & Storage

### Storage Architecture

Data persists in IndexedDB with localStorage fallback:

```
IndexedDB: retrostack-web
├── character-editor-sets     # Character set data
├── character-editor-snapshots # Version history
└── [future-tool-stores]      # Other tools

localStorage:
├── retrostack-theme          # App-wide settings
├── retrostack-character-editor-* # Tool-specific settings
└── retrostack-[tool]-*       # Other tool settings
```

### Storage Keys Convention

All keys centralized in `/src/lib/[tool]/storage/keys.ts`:

```typescript
// Database config (shared across tools)
export const DB_NAME = "retrostack-web";
export const DB_VERSION = 6;

// Tool-specific stores
export const CHARACTER_EDITOR_STORE_NAME = "character-editor-sets";
export const CHARACTER_EDITOR_SNAPSHOTS_STORE = "character-editor-snapshots";

// Tool-specific localStorage keys
export const CHARACTER_EDITOR_STORAGE_KEY_AUTOSAVE = "retrostack-character-editor-autosave";
export const CHARACTER_EDITOR_STORAGE_KEY_ONBOARDING = "retrostack-character-editor-onboarding";
```

### Naming Pattern

- **App-wide settings**: `retrostack-<setting>` (e.g., `retrostack-theme`)
- **Tool-specific settings**: `retrostack-<tool-name>-<setting>` (e.g., `retrostack-character-editor-autosave`)

### Adding New Storage Keys

1. Add the key constant to the appropriate keys file
2. Use the tool prefix for tool-specific constants (e.g., `CHARACTER_EDITOR_*`)
3. Shared database config (`DB_NAME`, `DB_VERSION`) is reused across all tools
4. Follow the naming pattern for values
5. Import and use the constant - never hardcode strings

### Data Fetching Pattern

For built-in data loaded from JSON:

```typescript
// Load from JSON file
import builtinCharsets from "@/lib/character-editor/data/builtinCharsets.json";

// Convert at initialization
const characterSets = builtinCharsets.map(convertToCharacterSet);
```

For external data with caching:

```typescript
// In-memory cache for external sources
const cache = new Map<string, CharacterSet[]>();

export async function fetchExternalData(): Promise<DataType[]> {
  if (cache.has(key)) return cache.get(key)!;

  try {
    const data = await fetch(url).then((r) => r.json());
    cache.set(key, data);
    return data;
  } catch {
    console.warn("Failed to fetch:", error);
    return []; // Non-throwing, graceful degradation
  }
}
```

## Color System & Theming

### CSS Custom Properties

Colors defined in `/src/app/globals.css`:

```css
:root {
  --retro-dark: #0a0a1a; /* Main background */
  --retro-navy: #1a1a3e; /* Secondary background */
  --retro-grid: #2a2a5e; /* Grid lines, borders */
  --retro-pink: #ff2a6d; /* Primary accent */
  --retro-cyan: #00f5ff; /* Secondary accent */
  --retro-violet: #9d4edd; /* Tertiary accent */
  --retro-amber: #ffb800; /* Warning/highlight */
  --retro-purple: #7c3aed; /* Purple accent */
  --text-primary: #ededed; /* Main text */
  --text-secondary: #9ca3af; /* Muted text */
}
```

### Using Colors in Tailwind

Colors auto-available via Tailwind:

```html
<div className="bg-retro-dark text-retro-pink border-retro-cyan">
  <span className="text-retro-amber bg-retro-navy/50"></span>
</div>
```

### Light/Dark Theme

Theme switching via `html.light` class. Use `next/dynamic` for ThemeToggle to avoid hydration issues:

```typescript
const ThemeToggle = dynamic(() => import("@/components/ui/ThemeToggle").then((m) => m.ThemeToggle), { ssr: false });
```

## Responsive Design

### Fluid Sizing with clamp()

Use CSS `clamp()` for values that smoothly scale between viewport sizes. Defined in `/src/app/globals.css`:

```css
:root {
  /* Layout dimensions */
  --header-height: clamp(56px, 5vw + 40px, 72px);
  --toolbar-height: clamp(44px, 4vw + 32px, 56px);

  /* Spacing scale */
  --space-xs: clamp(4px, 1vw, 8px);
  --space-sm: clamp(8px, 2vw, 16px);
  --space-md: clamp(16px, 3vw, 24px);
  --space-lg: clamp(24px, 4vw, 48px);

  /* Typography scale */
  --font-size-sm: clamp(12px, 0.8vw + 10px, 14px);
  --font-size-base: clamp(14px, 1vw + 12px, 16px);
  --font-size-lg: clamp(16px, 1.5vw + 12px, 20px);
  --font-size-xl: clamp(20px, 2vw + 14px, 28px);
  --font-size-2xl: clamp(24px, 3vw + 12px, 40px);
  --font-size-3xl: clamp(28px, 4vw + 12px, 48px);
}
```

The formula `clamp(min, preferred, max)` ensures values never go below minimum or above maximum while scaling fluidly between them.

### Breakpoints

Standard Tailwind breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Additional custom breakpoints in globals.css:

- **Tablet range**: `(min-width: 640px) and (max-width: 1024px)` - use `.tablet-compact` class
- **Wide desktop**: `(min-width: 1920px)` - use `.wide-expand` class for larger max-widths

### Touch Device Detection

Use `(pointer: coarse)` media query to detect touch devices:

```css
@media (pointer: coarse) {
  /* Touch-friendly styles */
}
```

Available utility classes for touch devices:

```html
<!-- Ensures minimum 44px touch target (Apple HIG recommendation) -->
<button className="touch-target-auto">Tap me</button>

<!-- Adds vertical spacing between children on touch devices -->
<div className="touch-spacing">
  <button>Option 1</button>
  <button>Option 2</button>
</div>
```

### Safe Area Support

For notched devices (iPhone X+, etc.), use `env(safe-area-inset-*)` via utility classes:

```html
<!-- Individual sides -->
<div className="safe-top"><!-- Respects notch --></div>
<div className="safe-bottom"><!-- Respects home indicator --></div>
<div className="safe-left"><!-- Respects left edge --></div>
<div className="safe-right"><!-- Respects right edge --></div>

<!-- Horizontal (left + right) -->
<div className="safe-x"><!-- Respects both sides --></div>

<!-- All sides -->
<div className="safe-all"><!-- Full safe area padding --></div>
```

### Fluid Grids

Three grid utilities with different minimum column widths:

```html
<!-- Standard: min 280px columns -->
<div className="grid-fluid">
  <!-- auto-fit minmax(280px, 1fr) -->
</div>

<!-- Small: min 200px columns (more columns on wide screens) -->
<div className="grid-fluid-sm">
  <!-- auto-fit minmax(200px, 1fr) -->
</div>

<!-- Large: min 320px columns (fewer, wider columns) -->
<div className="grid-fluid-lg">
  <!-- auto-fit minmax(320px, 1fr) -->
</div>
```

### Responsive Hooks

Import from `@/hooks/useMediaQuery`:

```typescript
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsWideDesktop,
  usePrefersTouch,
  usePrefersReducedMotion,
} from "@/hooks/useMediaQuery";

// Generic hook - any media query
const matches = useMediaQuery("(min-width: 768px)");

// Predefined breakpoint hooks (match Tailwind breakpoints)
const isMobile = useIsMobile(); // max-width: 639px
const isTablet = useIsTablet(); // 640px - 1023px
const isDesktop = useIsDesktop(); // min-width: 1024px
const isWideDesktop = useIsWideDesktop(); // min-width: 1280px

// User preference hooks
const prefersTouch = usePrefersTouch(); // pointer: coarse
const prefersReducedMotion = usePrefersReducedMotion(); // prefers-reduced-motion: reduce
```

All hooks are SSR-safe and handle hydration correctly.

## Form Input Design

All form inputs follow consistent styling patterns:

### Editable Text Inputs (input, textarea)

```css
bg-retro-dark border border-retro-grid/50 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-retro-cyan
```

- Dark solid background (`bg-retro-dark`)
- White text (`text-white`)
- Cyan focus border (`focus:border-retro-cyan`)

### Non-editable Dropdowns / Comboboxes (select, MultiSelectDropdown)

```css
bg-retro-navy/50 border border-retro-grid/50 rounded text-sm text-gray-200 focus:outline-none focus:border-retro-cyan
```

- Semi-transparent navy background (`bg-retro-navy/50`)
- Gray text (`text-gray-200` when has selection, `text-gray-400` when empty)
- Cyan border when open (`border-retro-cyan`)
- Grid border when closed (`border-retro-grid/50`)
- **NOT** the 3D raised button style - that's only for action buttons
- Used in: `MultiSelectDropdown`, `ColorPresetSelector`, native `<select>` elements

### Option Buttons (chip/pill selectors)

```css
/* Default state */
border-retro-grid/50 text-gray-400 hover:border-retro-grid

/* Selected state (pink) */
border-retro-pink bg-retro-pink/10 text-retro-pink
```

- Use pink for selected state to indicate active selection
- Gray border and text for unselected state

### Range Sliders (trackbars)

```css
accent-retro-cyan
```

- Use cyan/blue accent color for all range input sliders
- Provides visual distinction from selection buttons

### Toggle Switches (iOS-style)

Use the `ToggleSwitch` component from `@/components/ui/ToggleSwitch` instead of checkboxes.

```css
/* Track - Off state */
bg-retro-purple/50 border-retro-purple rounded-full

/* Track - On state */
bg-retro-pink border-retro-pink rounded-full

/* Thumb - Off state */
bg-gray-400 rounded-full

/* Thumb - On state */
bg-white rounded-full

/* Focus ring */
focus:ring-2 focus:ring-retro-cyan focus:ring-offset-retro-dark
```

- Pink track when on (`bg-retro-pink`), purple track when off (`bg-retro-purple/50`)
- White thumb when on, gray thumb when off (`bg-gray-400`)
- Size: `h-6 w-11` track, `h-5 w-5` thumb
- Cyan focus ring for accessibility
- Smooth transition animation
- Used in place of all checkboxes throughout the app

### Dropdown Trigger Buttons (3D raised style)

```css
/* Base styles */
text-retro-cyan rounded

/* 3D gradient background (light top, dark bottom) */
bg-gradient-to-b from-gray-600/50 to-gray-700/50

/* Blue border with lighter top edge for depth */
border border-retro-cyan/50 border-t-retro-cyan/70

/* Shadow for raised effect */
shadow-md shadow-black/30

/* Hover state (lighter) */
hover:from-gray-500/50 hover:to-gray-600/50 hover:border-retro-cyan

/* Active/pressed state (darker, reduced shadow) */
active:from-gray-700/50 active:to-gray-800/50 active:shadow-sm

transition-all
```

- 3D raised button effect with gradient and shadow
- Blue/cyan text (`text-retro-cyan`)
- Gradient background: lighter at top, darker at bottom
- Blue border with brighter top edge for depth illusion
- Shadow creates raised appearance
- Active state appears "pressed in" (darker gradient, smaller shadow)
- Applies to action/picker dropdown buttons (NOT comboboxes):
  - Overflow menu icons (vertical dots) - `OverflowMenu` component
  - Text "..." picker buttons - `ChipSelect`, `ManufacturerSystemSelect`
  - "More ▼" buttons - `DimensionPresetSelector`, `CharacterCountPresetSelector`
- **Does NOT apply to comboboxes**: `MultiSelectDropdown`, `ColorPresetSelector`, native `<select>` elements (use non-editable dropdown style instead)

### Dropdown Panel Design

Dropdown panels follow this consistent structure:

```css
/* Panel container */
bg-retro-navy border border-retro-grid/50 rounded-lg shadow-xl

/* Section headers (manufacturer/category groupings) */
w-full text-left px-2 py-1 text-xs font-medium text-retro-cyan bg-retro-cyan/10 rounded

/* Option chips inside sections */
/* Default state */
px-2 py-0.5 text-xs rounded bg-retro-amber/15 text-retro-amber hover:bg-retro-amber/30 hover:text-white

/* Selected state */
bg-retro-amber/40 text-retro-amber ring-1 ring-retro-amber
```

- Section headers have cyan text on cyan/10 background
- Option chips use amber color scheme with background
- Selected options have ring highlight
- Options are indented under their section header (`ml-3`)
- Used in: `ChipSelect`, `ManufacturerSystemSelect`, `DimensionPresetSelector`, `CharacterCountPresetSelector`

### Shared Metadata Form

Use the `MetadataStep` component (`src/components/character-editor/import/MetadataStep.tsx`) for all character set metadata forms. It includes:

- Name, Description, Manufacturer/System, Chip, Locale, Source fields
- Auto-fill chip when system is selected
- Consistent styling with the design system

## Common Hooks Reference

### useOutsideClick

Close dropdowns/menus when clicking outside:

```typescript
const ref = useOutsideClick<HTMLDivElement>(handleClose, isOpen);
// Handles mousedown/touchstart and Escape key
```

### useMediaQuery

See [Responsive Hooks](#responsive-hooks) section for full documentation of `useMediaQuery` and predefined breakpoint hooks.

### useToast

Toast notifications (requires ToastProvider in layout):

```typescript
const { showToast } = useToast();
showToast("Operation successful!", "success"); // success, error, warning, info
```

### useTheme

Light/dark mode switching:

```typescript
const { theme, toggleTheme } = useTheme();
// theme: "light" | "dark"
```

## Adding New Features

### Adding a New Tool Page

1. **Create page structure**:

   ```
   src/app/tools/my-tool/
   ├── page.tsx          # Metadata + minimal wrapper
   └── MyToolView.tsx    # "use client" with all logic
   ```

2. **Add to navigation** in `/src/lib/constants.ts`

3. **Use ToolLayout wrapper** for consistent structure

4. **Create storage keys file** if tool needs persistence:
   ```
   src/lib/my-tool/storage/keys.ts
   ```

### Adding a New UI Component

1. **Create in `/src/components/ui/`**
2. **Use `forwardRef`** for ref forwarding
3. **Extend HTML attributes** for flexibility
4. **Export `displayName`** for debugging
5. **Test responsiveness** at mobile, tablet, and desktop sizes

### Adding Persistent State

1. **Create keys file**: `src/lib/my-tool/storage/keys.ts`
2. **Use storage pattern**:

   ```typescript
   function useMyState() {
     const [state, setState] = useState(() => {
       const saved = localStorage.getItem(MY_TOOL_STORAGE_KEY);
       return saved ? JSON.parse(saved) : defaultValue;
     });

     useEffect(() => {
       localStorage.setItem(MY_TOOL_STORAGE_KEY, JSON.stringify(state));
     }, [state]);

     return [state, setState];
   }
   ```

3. **For large data**, use IndexedDB with migration support

## Key Files Reference

| File                                           | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `/src/app/layout.tsx`                          | Root layout, fonts, ToastProvider    |
| `/src/app/globals.css`                         | All styling (Tailwind v4 + CSS vars) |
| `/src/lib/constants.ts`                        | Site config, nav items, social links |
| `/src/components/layout/ToolLayout.tsx`        | Tool page wrapper                    |
| `/src/components/ui/ToggleSwitch.tsx`          | Use instead of checkboxes            |
| `/src/lib/character-editor/types.ts`           | Core character editor types          |
| `/src/lib/character-editor/storage/keys.ts`    | All storage keys                     |
| `/src/lib/character-editor/storage/storage.ts` | IndexedDB wrapper                    |

## Performance Considerations

- **Code Splitting**: Next.js App Router handles automatically
- **Image Optimization**: Use `next/image` for responsive images
- **Memoization**: Use `useMemo`/`useCallback` for expensive computations
- **Batch Updates**: Use `startBatch()`/`endBatch()` for grouped undo entries
- **Storage**: IndexedDB for large datasets, localStorage for small settings
- **Caching**: External data sources cached in memory
