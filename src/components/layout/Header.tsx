/**
 * Site Header Component
 *
 * Fixed header with glassmorphism effect on scroll. Contains:
 * - RetroStack logo with neon flicker effect
 * - Desktop navigation (hidden on mobile/tablet)
 * - Tablet navigation (compact pills, hidden on mobile)
 * - Theme toggle and bug report link
 * - Hamburger menu trigger for mobile
 *
 * Responsive breakpoints:
 * - Mobile (<768px): Logo + hamburger only
 * - Tablet (768-1024px): Logo + TabletNavigation + hamburger
 * - Desktop (>1024px): Logo + full Navigation + actions
 *
 * @module components/layout/Header
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navigation, TabletNavigation } from "./Navigation";
import { MobileMenu, HamburgerButton } from "./MobileMenu";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { InstallAppButton } from "@/components/ui/InstallAppButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { SITE_CONFIG } from "@/lib/constants";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top safe-x ${
          scrolled ? "glass-dark" : "bg-transparent"
        }`}
        style={{ height: "var(--header-height)" }}
      >
        <Container className="h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt={SITE_CONFIG.name}
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-display text-[10px] sm:text-xs lg:text-sm group-hover:opacity-80 transition-opacity duration-300 neon-pink">
                {/* RetroStack with selective letter flicker */}
                <span>R</span>
                <span>e</span>
                <span>t</span>
                <span className="neon-flicker-fast">r</span>
                <span>o</span>
                <span className="neon-flicker-slow">S</span>
                <span>t</span>
                <span className="neon-flicker-medium">a</span>
                <span>c</span>
                <span>k</span>
              </span>
            </Link>

            {/* Tablet Navigation - visible on tablets (md to lg) */}
            <TabletNavigation />

            {/* Desktop Navigation - visible on large screens (lg+) */}
            <Navigation />

            {/* Theme toggle, Install App, Bug Report, and Mobile Menu Button */}
            <div className="flex items-center gap-1 sm:gap-2">
              <InstallAppButton className="hidden sm:block" />
              <ThemeToggle className="hidden sm:block" />
              <Tooltip content="Report a bug" position="bottom">
                <a
                  href="https://github.com/RetroStack/retrostack.github.io/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex p-2 rounded-lg transition-colors hover:bg-retro-grid/20"
                  aria-label="Report a bug"
                >
                  <svg
                    className="w-5 h-5 text-text-secondary hover:text-retro-pink transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-2.21 0-4 1.79-4 4v4c0 2.21 1.79 4 4 4s4-1.79 4-4v-4c0-2.21-1.79-4-4-4z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8V6m0 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6H4m2 4H4m16-4h-2m2 4h-2M7 10l-2-2m12 2l2-2M7 18l-2 2m12-2l2 2"
                    />
                  </svg>
                </a>
              </Tooltip>
              <HamburgerButton onClick={() => setMobileMenuOpen(true)} />
            </div>
          </div>
        </Container>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
