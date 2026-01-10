/**
 * Call To Action Section
 *
 * Homepage section encouraging community engagement with RetroStack.
 * Features:
 * - Gradient background glow effect
 * - "Join the Community" heading with NeonText
 * - Description about open source nature
 * - CTA buttons for GitHub and Patreon with social icons
 * - Trust indicators showing project count, open source status, and license
 *
 * Uses social links from site constants.
 *
 * @module components/sections/CallToAction
 */
import { Container } from "@/components/ui/Container";
import { NeonText } from "@/components/effects/NeonText";
import { SOCIAL_LINKS } from "@/lib/constants";

export function CallToAction() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-retro-pink/5 via-retro-purple/10 to-retro-cyan/5" />

      <Container className="relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Heading */}
          <NeonText as="h2" color="violet" className="font-display text-xl sm:text-2xl md:text-3xl mb-6">
            Join the Community
          </NeonText>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
            RetroStack is open source and community-driven. Contribute to our projects,
            report issues, or support development through Patreon.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon btn-neon-cyan px-8 py-4 text-sm inline-flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a
              href={SOCIAL_LINKS.patreon}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-neon btn-neon-pink px-8 py-4 text-sm inline-flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
              </svg>
              Support on Patreon
            </a>
          </div>

          {/* Stats or trust indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="font-display text-2xl text-retro-pink">10+</div>
              <div className="text-gray-500 text-sm">Projects</div>
            </div>
            <div>
              <div className="font-display text-2xl text-retro-cyan">100%</div>
              <div className="text-gray-500 text-sm">Open Source</div>
            </div>
            <div>
              <div className="font-display text-2xl text-retro-violet">MIT</div>
              <div className="text-gray-500 text-sm">Licensed</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
