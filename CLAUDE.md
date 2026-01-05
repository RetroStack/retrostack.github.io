# RetroStack Web

Marketing website for RetroStack - a collection of tools and resources for retro computing enthusiasts.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest (unit) + Playwright (e2e)
- **Deployment**: GitHub Pages (static export)

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run test:e2e     # Playwright e2e tests
npm run deploy       # Deploy to GitHub Pages
```

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
  - `layout/` - Header, Footer, Navigation, MobileMenu, ToolLayout
  - `sections/` - Hero, Features, SystemsPreview, ToolsPreview
  - `ui/` - Container, OverflowMenu, ResponsiveToolbar
- `src/hooks/` - Custom React hooks
- `e2e/` - Playwright e2e tests

## Key Features

- Responsive design with mobile menu
- RetroStack branding with gradient accents
- Systems and tools preview sections
- Static export for GitHub Pages deployment
