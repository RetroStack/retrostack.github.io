import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { NeonText } from "@/components/effects/NeonText";

const FEATURED_SYSTEMS = [
  {
    name: "TRS-80",
    category: "Computers",
    description: "The legendary Tandy/RadioShack computer that launched the home computing revolution.",
    href: "/systems/computers",
    icon: "80",
  },
  {
    name: "Apple I",
    category: "Computers",
    description: "Steve Wozniak's hand-built masterpiece that started it all for Apple.",
    href: "/systems/computers",
    icon: "I",
  },
  {
    name: "Sorcerer",
    category: "Computers",
    description: "Exidy's powerful CP/M-compatible machine with built-in Microsoft BASIC.",
    href: "/systems/computers",
    icon: "S",
  },
  {
    name: "BitStack",
    category: "Trainer Boards",
    description: "Educational trainer boards including DigiTrainer and DigiMind for learning digital electronics.",
    href: "/systems/trainer-boards",
    icon: "B",
  },
];

export function SystemsPreview() {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
          <div>
            <NeonText
              as="h2"
              color="pink"
              className="font-display mb-3 sm:mb-4"
              style={{ fontSize: "clamp(1.125rem, 2vw + 0.5rem, 1.5rem)" }}
            >
              Featured Systems
            </NeonText>
            <p className="text-gray-400 max-w-xl text-sm sm:text-base">
              Explore our collection of vintage computer replicas and educational hardware.
            </p>
          </div>
          <Link
            href="/systems"
            className="text-retro-cyan hover:text-retro-pink transition-colors font-ui text-xs sm:text-sm uppercase tracking-wider touch-target inline-flex items-center"
          >
            View All Systems →
          </Link>
        </div>

        {/* Systems Grid - fluid auto-fit */}
        <div
          className="grid gap-4 sm:gap-6"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
          }}
        >
          {FEATURED_SYSTEMS.map((system) => (
            <Link
              key={system.name}
              href={system.href}
              className="card-retro p-4 sm:p-6 hover-glow-pink group block"
            >
              {/* Icon/Badge */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-retro-purple/50 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-retro-pink/20 transition-colors duration-300">
                <span className="font-display text-xl sm:text-2xl text-retro-cyan group-hover:text-retro-pink transition-colors duration-300">
                  {system.icon}
                </span>
              </div>

              {/* Category */}
              <span className="text-[10px] sm:text-xs text-retro-violet uppercase tracking-wider">
                {system.category}
              </span>

              {/* Name */}
              <h3 className="font-ui text-base sm:text-lg text-white mt-1 mb-2 group-hover:text-retro-pink transition-colors duration-300">
                {system.name}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-xs sm:text-sm">
                {system.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
