/**
 * Site Footer Component
 *
 * Displays navigation links, social media links, and copyright.
 * Uses the NAV_ITEMS from constants for consistent navigation
 * structure with the header.
 *
 * Responsive layout:
 * - Mobile: Single column
 * - Tablet: 2 columns
 * - Desktop: 4 columns (brand + nav sections)
 *
 * @module components/layout/Footer
 */
"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Tooltip } from "@/components/ui/Tooltip";
import { NAV_ITEMS, SOCIAL_LINKS, SITE_CONFIG } from "@/lib/constants";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { useToast } from "@/hooks/useToast";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { isOwnerMode, toggleOwnerMode } = useOwnerMode();
  const { showToast } = useToast();

  const handleCopyrightClick = () => {
    toggleOwnerMode();
    showToast(
      isOwnerMode ? "Owner mode disabled" : "Owner mode enabled",
      "info"
    );
  };

  return (
    <footer className="bg-retro-navy border-t border-retro-grid safe-bottom safe-x">
      <Container>
        <div className="py-8 sm:py-12">
          {/* Main Footer Content - fluid grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block touch-target">
                <span className="font-display text-base sm:text-lg text-retro-pink">{SITE_CONFIG.name}</span>
              </Link>
              <p className="mt-3 sm:mt-4 text-sm text-text-secondary max-w-xs">{SITE_CONFIG.description}</p>
            </div>

            {/* Navigation Links - only show enabled sections with enabled children */}
            {NAV_ITEMS.filter((section) => section.enabled && section.children).map((section) => {
              const enabledChildren = section.children?.filter((child) => child.enabled);
              if (!enabledChildren || enabledChildren.length === 0) return null;

              return (
                <div key={section.label}>
                  <h3 className="font-ui text-xs sm:text-sm uppercase tracking-wider text-retro-cyan mb-3 sm:mb-4">
                    {section.label}
                  </h3>
                  <ul className="space-y-1 sm:space-y-2">
                    {enabledChildren.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="inline-flex items-center min-h-[36px] sm:min-h-[32px] text-sm text-text-secondary hover:text-retro-pink transition-colors duration-200"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-retro-grid/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright - The "C" in the copyright symbol is a hidden owner mode toggle */}
            <p className="text-xs sm:text-sm text-text-muted text-center sm:text-left">
              <button
                onClick={handleCopyrightClick}
                className={`hover:text-retro-cyan transition-colors cursor-pointer ${isOwnerMode ? "text-retro-amber" : ""}`}
                aria-label="Toggle owner mode"
              >
                ©
              </button>{" "}
              {currentYear} {SITE_CONFIG.name}. All rights reserved.
            </p>

            {/* Social Links - touch-friendly */}
            <div className="flex items-center gap-2">
              <Tooltip content="View on GitHub" position="top">
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target flex items-center justify-center text-text-secondary hover:text-retro-cyan transition-colors duration-200 rounded-md hover:bg-retro-purple/30"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              </Tooltip>
              <Tooltip content="Support on Patreon" position="top">
                <a
                  href={SOCIAL_LINKS.patreon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target flex items-center justify-center text-text-secondary hover:text-retro-pink transition-colors duration-200 rounded-md hover:bg-retro-purple/30"
                  aria-label="Patreon"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                  </svg>
                </a>
              </Tooltip>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
