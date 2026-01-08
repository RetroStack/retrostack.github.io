# RetroStack Web

Marketing website for RetroStack - a collection of tools and resources for retro computing enthusiasts.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
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

- `src/app/` - Next.js App Router pages
  - `systems/` - Systems pages (computers, game-consoles, sdks, trainer-boards, others)
  - `tools/` - Tools pages (character-rom-editor, binary-rom-editor, emulators, etc.)
  - `resources/` - Resources pages (datasheets, documentation)
- `src/components/` - React components
  - `layout/` - Header, Footer, Navigation, MobileMenu, ToolLayout
  - `sections/` - Hero, Features, SystemsPreview, ToolsPreview, CallToAction, PlaceholderPage
  - `ui/` - Button, Card, Container, OverflowMenu, ResponsiveToolbar
  - `effects/` - GridBackground, NeonText
- `src/hooks/` - Custom React hooks (useOutsideClick, useMediaQuery, useResizeObserver)
- `src/lib/` - Shared utilities and constants
- `e2e/` - Playwright e2e tests

## Key Features

- Responsive design with mobile menu
- RetroStack branding with gradient accents
- Systems and tools preview sections
- Visual regression testing
- Static export for GitHub Pages deployment

## Coding Conventions

- **No barrel files**: Do not create index.ts files that re-export from other files. Import directly from the source file instead of using barrel exports. This keeps the dependency graph explicit and avoids circular import issues.

## Local Storage Conventions

All localStorage and IndexedDB keys must follow a consistent naming pattern and be centralized in a keys file for each tool/feature.

### Naming Pattern

- **App-wide settings**: `retrostack-<setting>` (e.g., `retrostack-theme`)
- **Tool-specific settings**: `retrostack-<tool-name>-<setting>` (e.g., `retrostack-character-editor-onboarding`)

### Key Files

Each tool should have a centralized keys file that exports all storage key constants:

- **Character Editor**: `src/lib/character-editor/storage/keys.ts`
  - Shared database config: `DB_NAME` ("retrostack-web"), `DB_VERSION`
  - Editor-specific IndexedDB stores: `CHARACTER_EDITOR_STORE_NAME`, `CHARACTER_EDITOR_SNAPSHOTS_STORE`
  - Editor-specific localStorage keys: `CHARACTER_EDITOR_STORAGE_KEY_*`

### Adding New Storage Keys

1. Add the new key constant to the appropriate keys file
2. Use the tool prefix for tool-specific constants (e.g., `CHARACTER_EDITOR_*`)
3. Shared database config (`DB_NAME`, `DB_VERSION`) is reused across all tools
4. Follow the naming pattern for values: `retrostack-<tool>-<setting>`
5. Import and use the constant instead of hardcoding strings

## Form Input Design

All form inputs should follow these consistent styling patterns:

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

Dropdown panels should follow this consistent structure:

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
