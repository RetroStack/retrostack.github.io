import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { NeonText } from "@/components/effects/NeonText";

const FEATURED_TOOLS = [
  {
    name: "Character ROM Editor",
    description: "Design and edit character sets for vintage display systems. Export directly to ROM format.",
    href: "/tools/character-rom-editor",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    name: "Z80 Emulator",
    description: "Full-featured Zilog Z80 emulator with debugging tools and memory inspection.",
    href: "/tools/emulators",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Schematic Viewer",
    description: "Interactive viewer for vintage computer schematics with zoom and component highlighting.",
    href: "/tools/schematic-viewer",
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
];

export function ToolsPreview() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-retro-dark to-retro-navy/30">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
          <div>
            <NeonText
              as="h2"
              color="cyan"
              className="font-display mb-3 sm:mb-4"
              style={{ fontSize: "clamp(1.125rem, 2vw + 0.5rem, 1.5rem)" }}
            >
              Development Tools
            </NeonText>
            <p className="text-gray-400 max-w-xl text-sm sm:text-base">
              Browser-based tools for working with vintage hardware and software.
            </p>
          </div>
          <Link
            href="/tools"
            className="text-retro-pink hover:text-retro-cyan transition-colors font-ui text-xs sm:text-sm uppercase tracking-wider touch-target inline-flex items-center"
          >
            View All Tools →
          </Link>
        </div>

        {/* Tools Grid - fluid auto-fit */}
        <div
          className="grid gap-4 sm:gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          }}
        >
          {FEATURED_TOOLS.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="glass p-5 sm:p-6 md:p-8 rounded-lg hover-glow-cyan group block"
            >
              {/* Icon */}
              <div className="text-retro-cyan group-hover:text-retro-pink transition-colors duration-300 mb-4 sm:mb-6">
                {tool.icon}
              </div>

              {/* Name */}
              <h3 className="font-ui text-lg sm:text-xl text-white mb-2 sm:mb-3 group-hover:text-retro-cyan transition-colors duration-300">
                {tool.name}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm sm:text-base">
                {tool.description}
              </p>

              {/* Launch indicator */}
              <div className="mt-4 sm:mt-6 flex items-center text-retro-violet group-hover:text-retro-cyan transition-colors duration-300">
                <span className="text-xs sm:text-sm font-ui uppercase tracking-wider">Launch Tool</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
