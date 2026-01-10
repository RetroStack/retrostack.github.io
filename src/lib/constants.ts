export interface NavChild {
  label: string;
  href: string;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
}

export const title: string = "RetroStack - Vintage Computing Hardware & Software";
export const description: string =
  "Open-source hardware replicas, information, and development tools for vintage computing enthusiasts.";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Systems",
    href: "/systems",
    children: [
      { label: "Computers", href: "/systems/computers", description: "TRS-80, Sorcerer, Apple I, and more" },
      { label: "Game Consoles", href: "/systems/game-consoles", description: "Classic gaming systems" },
      { label: "SDKs", href: "/systems/sdks", description: "System Development Kits" },
      {
        label: "Trainer Boards",
        href: "/systems/trainer-boards",
        description: "KIM-1, AIM-65, MicroProfessor, and more",
      },
      { label: "Others", href: "/systems/others", description: "Mechanical calculators and more" },
    ],
  },
  {
    label: "Tools",
    href: "/tools",
    children: [
      { label: "Character ROM Editor", href: "/tools/character-rom-editor", description: "Edit character ROM data" },
      { label: "Binary ROM Editor", href: "/tools/binary-rom-editor", description: "Binary ROM editing tools" },
      { label: "Emulators", href: "/tools/emulators", description: "Z80, 6502 emulators" },
      { label: "Assemblers", href: "/tools/assemblers", description: "Assembly language tools" },
      { label: "Schematic Viewer", href: "/tools/schematic-viewer", description: "View circuit schematics" },
      { label: "PCB Viewer", href: "/tools/pcb-viewer", description: "PCB layout viewer" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Datasheets", href: "/resources/datasheets", description: "Component datasheets" },
      { label: "Documentation", href: "/resources/documentation", description: "Guides and manuals" },
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
