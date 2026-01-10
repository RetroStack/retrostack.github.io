/**
 * Site Configuration and Navigation Constants
 *
 * Central configuration file for the RetroStack website. Contains:
 * - Navigation menu structure with nested dropdowns
 * - Site metadata (title, description, tagline)
 * - Social media links
 *
 * @module lib/constants
 *
 * Usage:
 * - Import NAV_ITEMS for header/footer navigation
 * - Import SITE_CONFIG for SEO and metadata
 * - Import SOCIAL_LINKS for social media buttons
 *
 * To add a new page:
 * 1. Add the route to the appropriate section in NAV_ITEMS
 * 2. Create the corresponding page in /src/app/
 */

export interface NavChild {
  label: string;
  href: string;
  description: string;
  enabled: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
  children?: NavChild[];
}

export const title: string = "RetroStack - Vintage Computing Hardware & Software";
export const description: string =
  "Explore vintage computing with open-source hardware replicas, documentation, and modern development tools for classic systems.";
export const tagline: string = "Vintage Computing, Modern Tools";
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    enabled: true,
  },
  {
    label: "Systems",
    href: "/systems",
    enabled: false,
    children: [
      { label: "Computers", href: "/systems/computers", description: "TRS-80, Sorcerer, Apple I, and more", enabled: false },
      { label: "Game Consoles", href: "/systems/game-consoles", description: "Classic gaming systems", enabled: false },
      { label: "SDKs", href: "/systems/sdks", description: "System Development Kits", enabled: false },
      {
        label: "Trainer Boards",
        href: "/systems/trainer-boards",
        description: "KIM-1, AIM-65, MicroProfessor, and more",
        enabled: false,
      },
      { label: "Others", href: "/systems/others", description: "Mechanical calculators and more", enabled: false },
    ],
  },
  {
    label: "Tools",
    href: "/tools",
    enabled: true,
    children: [
      { label: "Character ROM Editor", href: "/tools/character-rom-editor", description: "Edit character ROM data", enabled: true },
      { label: "Binary ROM Editor", href: "/tools/binary-rom-editor", description: "Binary ROM editing tools", enabled: false },
      { label: "Emulators", href: "/tools/emulators", description: "Z80, 6502 emulators", enabled: false },
      { label: "Assemblers", href: "/tools/assemblers", description: "Assembly language tools", enabled: false },
      { label: "Schematic Viewer", href: "/tools/schematic-viewer", description: "View circuit schematics", enabled: false },
      { label: "PCB Viewer", href: "/tools/pcb-viewer", description: "PCB layout viewer", enabled: false },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    enabled: false,
    children: [
      { label: "Datasheets", href: "/resources/datasheets", description: "Component datasheets", enabled: false },
      { label: "Documentation", href: "/resources/documentation", description: "Guides and manuals", enabled: false },
    ],
  },
];

export const SOCIAL_LINKS = {
  github: "https://github.com/retrostack",
  patreon: "https://patreon.com/retrostack",
} as const;

export const SITE_CONFIG = {
  name: "RetroStack",
  tagline: "Vintage Computing, Modern Tools",
  description: description,
} as const;

/**
 * Featured Systems for homepage preview
 */
export interface FeaturedSystem {
  name: string;
  category: string;
  description: string;
  href: string;
  icon: string;
  enabled: boolean;
}

export const FEATURED_SYSTEMS: FeaturedSystem[] = [
  {
    name: "TRS-80",
    category: "Computers",
    description: "The legendary Tandy/RadioShack computer that launched the home computing revolution.",
    href: "/systems/computers",
    icon: "80",
    enabled: false,
  },
  {
    name: "Apple I",
    category: "Computers",
    description: "Steve Wozniak's hand-built masterpiece that started it all for Apple.",
    href: "/systems/computers",
    icon: "I",
    enabled: false,
  },
  {
    name: "Sorcerer",
    category: "Computers",
    description: "Exidy's powerful CP/M-compatible machine with built-in Microsoft BASIC.",
    href: "/systems/computers",
    icon: "S",
    enabled: false,
  },
];

/**
 * Featured Tools for homepage preview
 * Note: Icons are defined in the component as they are JSX elements
 */
export interface FeaturedTool {
  name: string;
  description: string;
  href: string;
  enabled: boolean;
}

export const FEATURED_TOOLS: FeaturedTool[] = [
  {
    name: "Character ROM Editor",
    description: "Design and edit character sets for vintage display systems. Export directly to ROM format.",
    href: "/tools/character-rom-editor",
    enabled: true,
  },
  {
    name: "Z80 Emulator",
    description: "Full-featured Zilog Z80 emulator with debugging tools and memory inspection.",
    href: "/tools/emulators",
    enabled: false,
  },
  {
    name: "Schematic Viewer",
    description: "Interactive viewer for vintage computer schematics with zoom and component highlighting.",
    href: "/tools/schematic-viewer",
    enabled: false,
  },
];
