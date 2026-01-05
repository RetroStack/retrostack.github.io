import { Container } from "@/components/ui/Container";
import { NeonText } from "@/components/effects/NeonText";

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    title: "Hardware Replicas",
    description: "Accurate recreations of classic computers and peripherals using modern manufacturing techniques.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    title: "ROM Adapters",
    description: "Bridge adapters allowing modern EEPROM chips to work with vintage systems.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    title: "KiCAD Libraries",
    description: "Comprehensive component libraries for vintage chip footprints and symbols.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: "Development Tools",
    description: "Emulators, assemblers, and editors for Z80, 6502, and other vintage CPUs.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Documentation",
    description: "Detailed guides, schematics, and datasheets for vintage hardware.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Open Source",
    description: "All projects freely available on GitHub for learning, modification, and contribution.",
  },
];

export function Features() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-retro-navy/50">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <NeonText
            as="h2"
            color="cyan"
            className="font-display mb-3 sm:mb-4"
            style={{ fontSize: "clamp(1.125rem, 2vw + 0.5rem, 1.5rem)" }}
          >
            What We Offer
          </NeonText>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-2">
            Everything you need to explore, preserve, and build vintage computing hardware and software.
          </p>
        </div>

        {/* Features Grid - fluid auto-fit */}
        <div
          className="grid gap-4 sm:gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          }}
        >
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="card-retro p-4 sm:p-6 hover-glow-cyan group"
            >
              <div className="text-retro-pink group-hover:text-retro-cyan transition-colors duration-300 mb-3 sm:mb-4">
                {feature.icon}
              </div>
              <h3 className="font-ui text-base sm:text-lg text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
