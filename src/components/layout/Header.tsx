"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navigation, TabletNavigation } from "./Navigation";
import { MobileMenu, HamburgerButton } from "./MobileMenu";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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

            {/* Theme toggle and Mobile Menu Button */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:block" />
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
