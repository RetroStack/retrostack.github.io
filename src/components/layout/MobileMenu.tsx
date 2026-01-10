/**
 * Mobile Menu Components
 *
 * Full-screen slide-in menu for mobile/small tablet viewports.
 * Triggered by HamburgerButton in the header.
 *
 * Features:
 * - Accordion-style expandable sections
 * - Body scroll lock when open
 * - Escape key to close
 * - Theme toggle in header
 * - Social links in footer
 *
 * @module components/layout/MobileMenu
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-retro-dark/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel - adaptive width based on viewport */}
      <div
        className="fixed top-0 right-0 h-full z-50 md:hidden overflow-y-auto
          w-[85vw] max-w-[320px] sm:w-80 sm:max-w-[380px]
          bg-retro-navy safe-top safe-right safe-bottom
          shadow-xl shadow-retro-purple/30"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button and theme toggle */}
        <div className="p-3 sm:p-4 border-b border-retro-grid flex justify-between items-center">
          <ThemeToggle />
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center text-retro-pink hover:text-retro-cyan transition-colors rounded-md hover:bg-retro-purple/30"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-3 sm:p-4" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-retro-grid/50">
              {item.children ? (
                <>
                  <button
                    onClick={() =>
                      setExpandedItem(expandedItem === item.label ? null : item.label)
                    }
                    className="w-full flex items-center justify-between touch-target font-ui text-sm uppercase tracking-wider text-gray-300 hover:text-retro-cyan transition-colors"
                    aria-expanded={expandedItem === item.label}
                  >
                    {item.label}
                    <span
                      className={`text-retro-cyan transition-transform duration-200 ${
                        expandedItem === item.label ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedItem === item.label && (
                    <div className="pb-3 pl-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="block touch-target flex items-center text-sm text-gray-400 hover:text-retro-cyan transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block touch-target flex items-center font-ui text-sm uppercase tracking-wider text-gray-300 hover:text-retro-cyan transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Social Links */}
        <div className="p-3 sm:p-4 mt-4 border-t border-retro-grid/30">
          <div className="flex gap-2">
            <a
              href="https://github.com/retrostack"
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex items-center justify-center text-gray-400 hover:text-retro-cyan transition-colors rounded-md hover:bg-retro-purple/30"
              aria-label="GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

interface HamburgerButtonProps {
  onClick: () => void;
}

export function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden touch-target flex items-center justify-center text-gray-300 hover:text-retro-cyan transition-colors rounded-md hover:bg-retro-purple/30"
      aria-label="Open menu"
      aria-haspopup="dialog"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
