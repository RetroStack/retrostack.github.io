/**
 * Placeholder Page Component
 *
 * A reusable "coming soon" page template for features not yet implemented.
 * Displays:
 * - Optional icon
 * - Page title with NeonText styling
 * - Description text
 * - Animated "Coming Soon" badge
 * - Back navigation link
 *
 * Use this component to create placeholder pages for planned features
 * that maintain consistent styling with the rest of the site.
 *
 * @module components/sections/PlaceholderPage
 *
 * @example
 * ```tsx
 * <PlaceholderPage
 *   title="Binary ROM Editor"
 *   description="Edit and analyze binary ROM files."
 *   backLink="/tools"
 *   backLabel="Back to Tools"
 * />
 * ```
 */
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { NeonText } from "@/components/effects/NeonText";

interface PlaceholderPageProps {
  title: string;
  description: string;
  backLink: string;
  backLabel: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({
  title,
  description,
  backLink,
  backLabel,
  icon,
}: PlaceholderPageProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <Container className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          {/* Icon */}
          {icon && (
            <div className="text-retro-violet mb-8">
              {icon}
            </div>
          )}

          {/* Title */}
          <NeonText as="h1" color="pink" className="font-display text-xl sm:text-2xl md:text-3xl mb-4">
            {title}
          </NeonText>

          {/* Description */}
          <p className="text-gray-400 max-w-lg mb-8">
            {description}
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-retro-violet/50 bg-retro-purple/20 mb-12">
            <span className="w-2 h-2 rounded-full bg-retro-cyan animate-pulse" />
            <span className="text-retro-cyan text-sm font-ui uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          {/* Back Link */}
          <Link
            href={backLink}
            className="text-retro-cyan hover:text-retro-pink transition-colors font-ui text-sm uppercase tracking-wider inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {backLabel}
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
