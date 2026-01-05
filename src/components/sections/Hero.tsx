"use client";

import Image from "next/image";
import Link from "next/link";
import { GridBackground } from "@/components/effects/GridBackground";
import { NeonText } from "@/components/effects/NeonText";
import { Container } from "@/components/ui/Container";
import { SITE_CONFIG } from "@/lib/constants";

export function Hero() {
  return (
    <GridBackground
      animated
      overlay
      className="min-h-screen min-h-[100dvh] flex items-center justify-center pt-16 sm:pt-20"
    >
      <Container className="relative z-10 text-center py-12 sm:py-16 md:py-20">
        {/* Logo - fluid sizing */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div
            className="relative overflow-hidden"
            style={{
              width: "clamp(100px, 20vw + 60px, 200px)",
              height: "clamp(100px, 20vw + 60px, 200px)",
            }}
          >
            <Image
              src="/images/logo.png"
              alt={SITE_CONFIG.name}
              fill
              className="object-contain drop-shadow-[0_0_30px_rgba(255,42,109,0.5)]"
              priority
            />
          </div>
        </div>

        {/* Title - fluid typography */}
        <h1 className="mb-3 sm:mb-4">
          <NeonText
            as="span"
            color="pink"
            className="font-display block"
            style={{ fontSize: "clamp(1.25rem, 4vw + 0.5rem, 3rem)" }}
          >
            {SITE_CONFIG.name}
          </NeonText>
        </h1>

        {/* Tagline - fluid */}
        <p
          className="font-ui text-retro-cyan mb-6 sm:mb-8"
          style={{ fontSize: "clamp(1rem, 2vw + 0.5rem, 1.5rem)" }}
        >
          {SITE_CONFIG.tagline}
        </p>

        {/* Description - fluid */}
        <p
          className="font-terminal text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2"
          style={{ fontSize: "clamp(1rem, 1.5vw + 0.75rem, 1.5rem)" }}
        >
          {SITE_CONFIG.description}
        </p>

        {/* CTAs - stack on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
          <Link
            href="/systems"
            className="btn-neon btn-neon-pink px-6 sm:px-8 py-3 text-xs sm:text-sm touch-target"
          >
            Explore Systems
          </Link>
          <Link
            href="/tools"
            className="btn-neon btn-neon-cyan px-6 sm:px-8 py-3 text-xs sm:text-sm touch-target"
          >
            Try Our Tools
          </Link>
        </div>

        {/* Scroll indicator - hidden on very short screens */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-retro-violet"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </Container>
    </GridBackground>
  );
}
