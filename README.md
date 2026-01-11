# RetroStack Web

A collection of tools and resources for retro computing enthusiasts. Explore vintage computing with open-source hardware replicas, documentation, and modern development tools for classic systems.

## 🖥️ Features

### Tools

- **Character ROM Editor** - Create, edit, and export character ROM data for vintage computers. Features include:
  - Visual pixel editor for character glyphs
  - Built-in library of classic character sets (Apple I, TRS-80, Commodore, etc.)
  - Import/export in multiple formats (binary, hex, C arrays)
  - PDF export for documentation
  - Share character sets via URL

### Coming Soon

- **Binary ROM Editor** - Edit and analyze ROM dumps
- **Emulators** - Z80, 6502 processor emulators
- **Assemblers** - Assembly language development tools
- **Schematic Viewer** - Interactive circuit schematic viewer
- **PCB Viewer** - PCB layout visualization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/RetroStack/retrostack-web.git
cd retrostack-web

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 📜 Available Scripts

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start development server                       |
| `npm run build`         | Create production build                        |
| `npm run start`         | Start production server                        |
| `npm run lint`          | Run ESLint                                     |
| `npm run typecheck`     | Run TypeScript type checking                   |
| `npm run test`          | Run Jest unit tests                            |
| `npm run test:coverage` | Run tests with coverage report                 |
| `npm run test:e2e`      | Run Playwright end-to-end tests                |
| `npm run test:visual`   | Run visual regression tests                    |
| `npm run validate`      | Full validation (lint + typecheck + all tests) |
| `npm run deploy`        | Build and deploy to GitHub Pages               |

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Testing**: Jest (unit) + Playwright (e2e & visual regression)
- **Deployment**: GitHub Pages (static export)

### Key Dependencies

- **@dnd-kit** - Drag and drop functionality
- **fflate** - Fast compression for exports
- **jspdf** - PDF generation
- **opentype.js** - Font file parsing
- **qrcode.react** - QR code generation for sharing

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── tools/            # Tool pages
│   │   └── character-rom-editor/  # Character ROM Editor
│   ├── systems/          # System documentation pages
│   └── resources/        # Resource pages
├── components/
│   ├── layout/           # Header, Footer, Navigation
│   ├── sections/         # Homepage sections
│   ├── ui/               # Reusable UI components
│   └── character-editor/ # Character editor components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and types
│   ├── constants.ts      # Site configuration
│   └── character-editor/ # Editor utilities
└── e2e/                  # Playwright tests
```

## 🧪 Testing

### Unit Tests

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### End-to-End Tests

```bash
npm run test:e2e          # Run all e2e tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run in headed browser
```

### Visual Regression Tests

```bash
npm run test:visual              # Run visual tests
npm run test:visual:update       # Update snapshots
```

## 🚢 Deployment

The site is deployed to GitHub Pages as a static export.

```bash
npm run deploy
```

This builds the project and publishes the `out` directory to the `gh-pages` branch.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run validation (`npm run validate`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is part of the RetroStack organization. See the LICENSE file for details.

## 🔗 Links

- [RetroStack GitHub](https://github.com/RetroStack)
- [Report Issues](https://github.com/RetroStack/retrostack-web/issues)
