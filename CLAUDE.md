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
│   │   └── icons/       # Centralized icon components (ArrowIcons, TransformIcons, ActionIcons)
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
│   ├── useDropdown.ts   # Dropdown state + outside click
│   ├── useTimer.ts      # Timer management with cleanup
│   ├── useModalManager.ts # Multi-modal state management
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

### useDropdown

Combines dropdown open/close state with outside click handling:

```typescript
import { useDropdown } from "@/hooks/useDropdown";

function MyDropdown() {
  const dropdown = useDropdown<HTMLDivElement>();

  return (
    <div ref={dropdown.ref}>
      <button onClick={dropdown.toggle}>Toggle</button>
      {dropdown.isOpen && <div className="dropdown-panel">Content</div>}
    </div>
  );
}
// Also provides: dropdown.open(), dropdown.close()
```

### useTimer

Timer management with automatic cleanup:

```typescript
import { useTimer } from "@/hooks/useTimer";

function MyComponent() {
  const timer = useTimer();

  const startTimer = () => {
    timer.set(() => console.log("Done!"), 1000);
  };

  const cancelTimer = () => {
    timer.clear();
  };

  // timer.isActive - check if timer is running
}
```

### useModalManager

Manage multiple modal states with single-modal enforcement:

```typescript
import { useModalManager } from "@/hooks/useModalManager";

type ModalKey = "edit" | "delete" | "share";

function MyComponent() {
  const modals = useModalManager<ModalKey>();

  return (
    <>
      <button onClick={() => modals.open("edit")}>Edit</button>
      {modals.isOpen("edit") && <EditModal onClose={() => modals.close("edit")} />}
      {/* Only one modal can be open at a time */}
    </>
  );
}
// Also provides: modals.closeAll(), modals.activeModal
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

### Testing Requirements for New Features

**IMPORTANT**: Every new feature or tool MUST include comprehensive testing. Follow this checklist:

#### 1. Extract Business Logic for Testability

Before implementing UI, extract all business logic into pure functions in `/lib/`:

```typescript
// ✗ Avoid - logic in component
function MyComponent() {
  const handleProcess = () => {
    const result = data.filter(x => x.valid).map(x => transform(x));
    // ... more logic
  };
}

// ✓ Good - extracted to lib/
// /src/lib/my-tool/processing.ts
export function processData(data: DataType[]): ResultType[] {
  return data.filter(x => x.valid).map(x => transform(x));
}

// Component just calls the function
import { processData } from "@/lib/my-tool/processing";
```

#### 2. Use Dependency Injection for Storage/External Data

All hooks that use storage or external data MUST accept injectable dependencies:

```typescript
// /src/hooks/my-tool/useMyData.ts
export interface UseMyDataOptions {
  storage?: IMyStorage;  // Optional - defaults to real implementation
}

export function useMyData(options?: UseMyDataOptions) {
  const storage = options?.storage ?? realStorage;
  // ... implementation
}
```

Create in-memory implementations for testing:

```typescript
// /src/lib/my-tool/storage/memoryStorage.ts
export class InMemoryMyStorage implements IMyStorage {
  private data: Map<string, MyData> = new Map();

  async save(item: MyData): Promise<string> {
    const id = generateId();
    this.data.set(id, item);
    return id;
  }
  // ... other methods
}
```

#### 3. Use Agents for Test Implementation

Use the `test-generator` agent to create comprehensive unit tests:

```
Task: test-generator
Prompt: Create tests for /src/lib/my-tool/processing.ts covering all functions
```

Use the `e2e-generator` agent for Playwright tests:

```
Task: e2e-generator
Prompt: Create E2E tests for the new my-tool feature at /tools/my-tool
```

Use the `coverage-analyzer` agent to verify coverage:

```
Task: coverage-analyzer
Prompt: Analyze test coverage for src/lib/my-tool and identify gaps
```

#### 4. Verify UI with Playwright MCP Server

After implementing a feature, use the Playwright MCP server to verify it works:

```typescript
// Use mcp__playwright tools to:
// 1. Navigate to the feature page
// 2. Interact with UI elements
// 3. Verify expected behavior
// 4. Check responsive layouts (mobile, tablet, desktop)
```

Manual verification checklist:
- [ ] Feature loads without errors
- [ ] All interactive elements respond correctly
- [ ] Form validation works as expected
- [ ] Error states display properly
- [ ] Mobile/touch interactions work
- [ ] Keyboard navigation functions

#### 5. Add E2E Tests for New Features

Every new feature MUST have E2E tests in `/e2e/`:

```typescript
// /e2e/my-tool.spec.ts
import { test, expect } from "@playwright/test";

test.describe("My Tool", () => {
  test("loads and displays initial state", async ({ page }) => {
    await page.goto("/tools/my-tool");
    await expect(page.getByRole("heading", { name: /my tool/i })).toBeVisible();
  });

  test("performs core functionality", async ({ page }) => {
    await page.goto("/tools/my-tool");
    // Test the main user workflow
  });

  test("handles errors gracefully", async ({ page }) => {
    await page.goto("/tools/my-tool");
    // Test error scenarios
  });

  test("works on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile only");
    await page.goto("/tools/my-tool");
    // Test mobile-specific interactions
  });
});
```

#### 6. Add/Update Visual Regression Tests

New features need visual regression coverage:

```typescript
// /e2e/visual-my-tool.spec.ts
import { test, expect } from "@playwright/test";

test.describe("My Tool Visual", () => {
  test("default state", async ({ page }) => {
    await page.goto("/tools/my-tool");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("my-tool-default.png", { fullPage: true });
  });

  test("with data loaded", async ({ page }) => {
    await page.goto("/tools/my-tool");
    // Load some data
    await expect(page).toHaveScreenshot("my-tool-with-data.png");
  });

  test("mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/tools/my-tool");
    await expect(page).toHaveScreenshot("my-tool-mobile.png", { fullPage: true });
  });
});
```

#### 7. New Feature Testing Checklist

Before considering a feature complete:

- [ ] **Unit Tests**: All pure functions in `/lib/` have tests (>90% coverage)
- [ ] **Hook Tests**: All custom hooks have tests with mock dependencies
- [ ] **E2E Tests**: Core user workflows are covered
- [ ] **Visual Tests**: Key states have screenshot baselines
- [ ] **UI Verification**: Manually verified with Playwright MCP or browser
- [ ] **Mobile Testing**: Touch interactions and responsive layout verified
- [ ] **Error Handling**: Error states are tested
- [ ] **Tests Pass**: `npm run test && npm run test:e2e` both pass

#### 8. Recommended Agent Workflow for New Features

```
1. Plan the feature architecture
   → Use Plan agent to design testable structure

2. Implement business logic in /lib/
   → Extract pure functions
   → Create storage interfaces

3. Generate unit tests
   → Use test-generator agent
   → Target >90% coverage for new code

4. Implement UI components and hooks
   → Use dependency injection
   → Keep components thin

5. Generate E2E tests
   → Use e2e-generator agent
   → Cover core workflows

6. Verify with Playwright MCP
   → Navigate and interact with feature
   → Check all viewports

7. Add visual regression tests
   → Capture key states
   → Include mobile screenshots

8. Run full test suite
   → npm run validate
   → Fix any failures

9. Review with code-reviewer agent
   → Check patterns and conventions
```

## Selection Mode Pattern

For touch-friendly multi-selection in grids and lists. This is the standard pattern for all selectable items.

### Interaction Model

| Device | Enter Selection Mode | Select Items | Exit Mode |
|--------|---------------------|--------------|-----------|
| Touch | Long-press (500ms) OR tap "Select" button | Tap to toggle, drag across multiple | Tap "Done" |
| Desktop | Click "Select" button OR use modifiers | Shift+click (range), Ctrl+click (toggle), drag across | Click "Done" |

### Hooks

- **`useLongPress`** (`/src/hooks/useLongPress.ts`): Generic long-press detection for touch and mouse
- **`useSelectionMode`** (`/src/hooks/character-editor/useSelectionMode.ts`): Selection mode state management
- **`useDragSelect`** (`/src/hooks/useDragSelect.ts`): iOS Photos-style drag-select across multiple items

### Components

- **`SelectionModeBar`** (`/src/components/ui/SelectionModeBar.tsx`): Floating action bar shown during selection mode

### Usage Example

```typescript
import { useSelectionMode } from "@/hooks/character-editor/useSelectionMode";
import { SelectionModeBar } from "@/components/ui/SelectionModeBar";

function MyGrid({ items, selectedIndex, batchSelection, onSelect }) {
  const selectionMode = useSelectionMode({
    itemCount: items.length,
    selectedIndex,
    batchSelection,
    onSelect,
  });

  return (
    <div className="relative">
      {/* Grid with selection mode support */}
      <div className={selectionMode.isSelectionMode ? "ring-1 ring-retro-cyan/30" : ""}>
        {items.map((item, index) => (
          <ItemWithLongPress
            key={index}
            isSelectionMode={selectionMode.isSelectionMode}
            onLongPress={() => selectionMode.handleLongPress(index)}
            onClick={(e) => selectionMode.handleItemInteraction(index, e.shiftKey, e.metaKey)}
          />
        ))}
      </div>

      {/* Selection mode bar */}
      <SelectionModeBar
        isVisible={selectionMode.isSelectionMode}
        selectionCount={selectionMode.selectionCount}
        totalItems={items.length}
        onSelectAll={selectionMode.selectAll}
        onClearSelection={selectionMode.clearSelection}
        onExitMode={selectionMode.exitSelectionMode}
      />
    </div>
  );
}
```

### Visual Indicators

- **Selection mode active**: Cyan ring around grid container (`ring-1 ring-retro-cyan/30`)
- **Selected items**: Checkmark overlay in top-right corner
- **SelectionModeBar**: Slides up from bottom with count, All/None buttons, custom actions, and Done button

### Key Behaviors

1. **Long-press** (500ms) enters selection mode with that item selected
2. **"Select" button** toggles selection mode on/off
3. **In selection mode**: Single tap toggles item in/out of selection
4. **Drag-select** (in selection mode): Drag finger/mouse across items to toggle multiple at once (like iOS Photos)
5. **Outside selection mode**: Shift+click for range, Ctrl+click for toggle
6. **Exit mode**: Tap "Done" or explicitly exit; clears batch selection

### Drag-Select Implementation

For grids that support drag-select, use the `useDragSelect` hook:

```typescript
const getIndexFromPoint = useCallback((clientX, clientY) => {
  // Calculate which grid cell is at these coordinates
  const grid = gridRef.current;
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  // ... calculate column/row from position
  return index;
}, [/* deps */]);

const dragSelect = useDragSelect({
  enabled: isSelectionMode,
  onItemTouched: (index) => toggleSelection(index),
  getIndexFromPoint,
});

// Attach to grid container (onClickCapture prevents click after drag)
<div
  ref={gridRef}
  onTouchStart={dragSelect.onTouchStart}
  onTouchMove={dragSelect.onTouchMove}
  onTouchEnd={dragSelect.onTouchEnd}
  onMouseDown={dragSelect.onMouseDown}
  onMouseMove={dragSelect.onMouseMove}
  onMouseUp={dragSelect.onMouseUp}
  onClickCapture={dragSelect.onClickCapture}
>
  {items}
</div>
```

## Key Files Reference

| File                                           | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `/src/app/layout.tsx`                          | Root layout, fonts, ToastProvider    |
| `/src/app/globals.css`                         | All styling (Tailwind v4 + CSS vars) |
| `/src/lib/constants.ts`                        | Site config, nav items, social links |
| `/src/components/layout/ToolLayout.tsx`        | Tool page wrapper                    |
| `/src/components/ui/ToggleSwitch.tsx`          | Use instead of checkboxes            |
| `/src/components/ui/SelectionModeBar.tsx`      | Selection mode floating action bar   |
| `/src/components/ui/icons/`                    | Centralized icon components          |
| `/src/hooks/useDropdown.ts`                    | Dropdown state + outside click       |
| `/src/hooks/useTimer.ts`                       | Timer management with cleanup        |
| `/src/hooks/useModalManager.ts`                | Multi-modal state management         |
| `/src/hooks/useLongPress.ts`                   | Long-press detection hook            |
| `/src/hooks/useDragSelect.ts`                  | Drag-select gesture detection hook   |
| `/src/hooks/character-editor/useSelectionMode.ts` | Selection mode state management   |
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

## Business Logic & Testing Patterns

### Pure Function Extraction

Business logic should be extracted to pure functions in `/lib/` for testability:

```typescript
// ✓ Good - pure function, no dependencies
// /src/lib/character-editor/library/filters.ts
import { filterCharacterSets } from "@/lib/character-editor/library/filters";

const filtered = filterCharacterSets(sets, filters);

// ✗ Avoid - logic embedded in component
function MyComponent() {
  const filtered = useMemo(() => {
    return sets.filter(set => /* complex logic */);
  }, [sets, filters]);
}
```

### Storage Abstraction

All storage operations use interfaces for dependency injection:

```typescript
// Interfaces in /src/lib/character-editor/storage/interfaces.ts
interface IKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ICharacterSetStorage {
  initialize(): Promise<void>;
  getAll(): Promise<SerializedCharacterSet[]>;
  save(set: SerializedCharacterSet): Promise<string>;
  delete(id: string): Promise<void>;
  // ... other operations
}
```

### Dependency Injection in Hooks

Hooks accept optional storage dependencies for testing:

```typescript
// Hook with injectable storage
export interface UseCharacterLibraryOptions {
  storage?: ICharacterSetStorage;  // defaults to real implementation
}

export function useCharacterLibrary(
  options?: UseCharacterLibraryOptions
): UseCharacterLibraryResult {
  const storage = options?.storage ?? characterStorage;
  // ...
}

// In tests - use mock storage
import { createMockCharacterSetStorage } from "@/lib/character-editor/__tests__/testUtils";

test('loads character sets', async () => {
  const mockStorage = createMockCharacterSetStorage();
  mockStorage.sets.push(sampleCharacterSet);

  const { result } = renderHook(() =>
    useCharacterLibrary({ storage: mockStorage })
  );

  await waitFor(() => {
    expect(result.current.characterSets).toHaveLength(1);
  });
});
```

### Test Utilities Location

```
src/lib/character-editor/__tests__/
├── testUtils.ts    # Mock factories and storage mocks
├── fixtures.ts     # Sample data for tests
```

### Testing Pure Functions

```typescript
import { filterCharacterSets, hasActiveFilters } from "@/lib/character-editor/library/filters";
import { sampleCharacterSets, commodoreFilter } from "@/lib/character-editor/__tests__/fixtures";

test('filters by manufacturer', () => {
  const result = filterCharacterSets(sampleCharacterSets, commodoreFilter);

  expect(result.every(s => s.metadata.manufacturer === 'Commodore')).toBe(true);
});

test('detects active filters', () => {
  expect(hasActiveFilters(commodoreFilter)).toBe(true);
  expect(hasActiveFilters(emptyFilter)).toBe(false);
});
```

### In-Memory Storage for Tests

```typescript
import { InMemoryCharacterSetStorage } from "@/lib/character-editor/storage/memoryStorage";

test('saves and retrieves character set', async () => {
  const storage = new InMemoryCharacterSetStorage();
  await storage.initialize();

  const id = await storage.save(sampleCharacterSet);
  const retrieved = await storage.getById(id);

  expect(retrieved?.metadata.name).toBe(sampleCharacterSet.metadata.name);
});
```

## Testing

### Test Structure

```
src/
├── lib/
│   └── character-editor/
│       ├── __tests__/
│       │   ├── transforms.test.ts      # Pure function tests
│       │   ├── utils.test.ts
│       │   ├── types.test.ts
│       │   ├── presets.test.ts
│       │   ├── exports.test.ts
│       │   ├── testUtils.ts            # Mock factories
│       │   └── fixtures.ts             # Sample test data
│       ├── library/__tests__/
│       │   └── filters.test.ts
│       ├── import/__tests__/
│       │   ├── binary.test.ts
│       │   ├── imageImport.test.ts
│       │   ├── fontImport.test.ts
│       │   ├── textImport.test.ts
│       │   └── integration.test.ts
│       └── storage/__tests__/
│           └── memoryStorage.test.ts
├── hooks/
│   ├── __tests__/
│   │   ├── useOutsideClick.test.ts     # Generic hook tests
│   │   ├── useMediaQuery.test.ts
│   │   ├── useTheme.test.ts
│   │   ├── useLongPress.test.ts
│   │   └── useDragSelect.test.ts
│   └── character-editor/__tests__/
│       ├── useUndoRedo.test.ts         # Feature-specific hook tests
│       ├── useSelectionMode.test.ts
│       ├── useChangeLog.test.ts
│       └── useAutoSave.test.ts
├── components/
│   └── ui/__tests__/
│       └── Button.test.tsx             # Component tests
├── e2e/
│   ├── home.spec.ts                    # Page E2E tests
│   ├── character-editor.spec.ts
│   ├── pages.spec.ts
│   ├── visual.spec.ts                  # Visual regression tests
│   └── visual-character-editor.spec.ts
└── test-fixtures/                      # Shared test assets (project root)
    ├── cyber.bin                       # Binary character set
    ├── cyber.png                       # Character sheet image
    ├── cyber-wide.png
    ├── OpenDyslexic3-Regular.ttf       # Font files for testing
    ├── OpenDyslexic-Regular.otf
    ├── OpenDyslexic-Regular.woff
    ├── OpenDyslexic-Regular.woff2
    └── OpenDyslexic-Regular.eot
```

### Test File Naming

- **Unit tests**: `<module>.test.ts` co-located in `__tests__/` folder
- **Component tests**: `<Component>.test.tsx`
- **E2E tests**: `<feature>.spec.ts` in `e2e/` folder
- **Visual tests**: `visual-<feature>.spec.ts` or `visual.spec.ts`

### Unit Testing Pure Functions

Test pure functions directly without mocking:

```typescript
import { rotateCharacter, flipHorizontal } from "@/lib/character-editor/transforms";
import { createTestCharacter } from "@/lib/character-editor/__tests__/testUtils";

describe("rotateCharacter", () => {
  it("rotates 90 degrees clockwise", () => {
    const char = createTestCharacter([
      [true, false],
      [true, false],
    ]);

    const result = rotateCharacter(char, "cw");

    expect(result.pixels).toEqual([
      [true, true],
      [false, false],
    ]);
  });

  it("rotating 4 times returns original", () => {
    const original = createTestCharacter([
      [true, false, true],
      [false, true, false],
    ]);

    let result = original;
    for (let i = 0; i < 4; i++) {
      result = rotateCharacter(result, "cw");
    }

    expect(result.pixels).toEqual(original.pixels);
  });
});
```

### Hook Testing with renderHook

Use `@testing-library/react` for testing hooks:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useUndoRedo } from "@/hooks/character-editor/useUndoRedo";

describe("useUndoRedo", () => {
  it("tracks state history", () => {
    const { result } = renderHook(() => useUndoRedo({ count: 0 }));

    act(() => {
      result.current.setState({ count: 1 });
    });

    act(() => {
      result.current.setState({ count: 2 });
    });

    expect(result.current.state.count).toBe(2);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.undo();
    });

    expect(result.current.state.count).toBe(1);
  });

  it("supports batched operations", () => {
    const { result } = renderHook(() => useUndoRedo({ value: 0 }));

    act(() => {
      result.current.startBatch();
      result.current.setState({ value: 1 });
      result.current.setState({ value: 2 });
      result.current.setState({ value: 3 });
      result.current.endBatch();
    });

    // All three changes = one undo entry
    act(() => {
      result.current.undo();
    });

    expect(result.current.state.value).toBe(0);
  });
});
```

### Mocking Browser APIs

#### localStorage Mock

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});
```

#### matchMedia Mock

```typescript
function createMatchMediaMock(matches: boolean) {
  return jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Use in tests
window.matchMedia = createMatchMediaMock(true); // matches
window.matchMedia = createMatchMediaMock(false); // doesn't match
```

#### Timer Mocks

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it("debounces calls", () => {
  const callback = jest.fn();
  const debounced = debounce(callback, 100);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(100);

  expect(callback).toHaveBeenCalledTimes(1);
});
```

#### Document/DOM Mocks

```typescript
// Mock classList for theme testing
const classListMock = {
  add: jest.fn(),
  remove: jest.fn(),
  contains: jest.fn(),
};
Object.defineProperty(document.documentElement, "classList", {
  value: classListMock,
  writable: true,
});

// Mock event listeners
const listeners: Record<string, EventListener[]> = {};
document.addEventListener = jest.fn((event, cb) => {
  listeners[event] = listeners[event] || [];
  listeners[event].push(cb as EventListener);
});
document.removeEventListener = jest.fn((event, cb) => {
  listeners[event] = (listeners[event] || []).filter((l) => l !== cb);
});

// Trigger events in tests
function fireEvent(event: string, eventObj: Event) {
  listeners[event]?.forEach((cb) => cb(eventObj));
}
```

### MockImageData for Image Tests

For testing image import without browser canvas:

```typescript
class MockImageData implements ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: PredefinedColorSpace = "srgb";

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a = 255): void {
    const index = (y * this.width + x) * 4;
    this.data[index] = r;
    this.data[index + 1] = g;
    this.data[index + 2] = b;
    this.data[index + 3] = a;
  }

  fill(r: number, g: number, b: number, a = 255): void {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }
}

// Usage
it("parses white image to empty characters", () => {
  const imageData = new MockImageData(16, 16);
  imageData.fill(255, 255, 255); // white background

  const result = parseImageToCharacters(imageData, defaultOptions);

  expect(result.characters[0].pixels.flat().every((p) => !p)).toBe(true);
});
```

### Testing File Validation

```typescript
function createMockFile(name: string, type: string, size = 1024): File {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
}

describe("isValidFontFile", () => {
  it.each([
    ["font.ttf", "font/ttf", true],
    ["font.otf", "font/otf", true],
    ["font.woff", "font/woff", true],
    ["font.woff2", "font/woff2", true],
    ["image.png", "image/png", false],
    ["doc.pdf", "application/pdf", false],
  ])("validates %s (%s) as %s", (name, type, expected) => {
    const file = createMockFile(name, type);
    expect(isValidFontFile(file)).toBe(expected);
  });
});
```

### E2E Testing with Playwright

#### Basic Page Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("Character Editor", () => {
  test("loads editor page", async ({ page }) => {
    await page.goto("/tools/character-rom-editor");
    await expect(page.getByRole("heading", { name: /character/i })).toBeVisible();
  });

  test("navigates characters with keyboard", async ({ page }) => {
    await page.goto("/tools/character-rom-editor");
    await page.keyboard.press("ArrowRight");
    // Assert selection moved
  });
});
```

#### Responsive Testing

```typescript
test("mobile menu opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Only run on mobile");

  await page.goto("/");
  await page.getByRole("button", { name: /open menu/i }).click();

  const menu = page.getByRole("dialog", { name: /navigation menu/i });
  await expect(menu).toBeVisible();

  await page.getByRole("button", { name: /close menu/i }).click();
  await expect(menu).not.toBeVisible();
});
```

#### File Upload Testing

```typescript
test("imports binary file", async ({ page }) => {
  await page.goto("/tools/character-rom-editor");

  // Open import dialog
  await page.getByRole("button", { name: /import/i }).click();

  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles("test-fixtures/cyber.bin");

  // Verify import success
  await expect(page.getByText(/imported/i)).toBeVisible();
});
```

### Visual Regression Testing

```typescript
import { test, expect } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("home page screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home.png", {
      fullPage: true,
    });
  });

  test("editor default state", async ({ page }) => {
    await page.goto("/tools/character-rom-editor");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("editor-default.png", {
      fullPage: true,
    });
  });

  test("editor with selection", async ({ page }) => {
    await page.goto("/tools/character-rom-editor");
    await page.click('[data-testid="character-grid"] >> nth=5');

    await expect(page).toHaveScreenshot("editor-selected.png");
  });
});
```

### Test Commands

```bash
npm run test              # Run all Jest unit tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report

npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:visual       # Run visual regression tests
npm run test:visual -- --update-snapshots  # Update baseline screenshots

npm run test:all          # Run all tests (unit + E2E)
npm run validate          # Full validation (lint + typecheck + tests)
```

### Coverage Goals

Target coverage for business logic:

| Category | Target |
|----------|--------|
| Pure functions (`lib/`) | >90% |
| Hooks | >80% |
| Components | >70% |
| Overall | >80% |

### Test Data Fixtures

Use the shared `test-fixtures/` directory at project root for binary test assets:

```typescript
import * as fs from "fs";
import * as path from "path";

// Read binary fixture
const binaryPath = path.join(process.cwd(), "test-fixtures", "cyber.bin");
const binaryData = fs.readFileSync(binaryPath);

// For font validation tests
const fontFixtures = [
  "OpenDyslexic3-Regular.ttf",
  "OpenDyslexic-Regular.otf",
  "OpenDyslexic-Regular.woff",
  "OpenDyslexic-Regular.woff2",
  "OpenDyslexic-Regular.eot",
];
```

### Writing Testable Code

1. **Extract pure functions** - Move logic out of components into `/lib/`
2. **Use dependency injection** - Accept storage/services as optional parameters
3. **Avoid side effects** - Return new objects instead of mutating
4. **Small, focused functions** - Each function does one thing
5. **Explicit dependencies** - No hidden globals or singletons
